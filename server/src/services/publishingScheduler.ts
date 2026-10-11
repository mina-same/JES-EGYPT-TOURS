import Blog from '../models/Blog';
import Tour from '../models/Tour';
import { emitDashboardStatsUpdate } from '../realtime/socket';
import { assertPublishableClassification } from '../utils/blogClassification';
import { PublishingValidationError } from '../utils/publishing';

const DEFAULT_INTERVAL_MS = 30_000;

export interface PublishingRunResult {
  blogsPublished: number;
  toursActivated: number;
}

let runInProgress = false;

/** Why a due article was held back, by id — said once per reason, not every run. */
const heldBack = new Map<string, string>();

/**
 * The due articles that may not go public as they are filed now.
 *
 * An article is checked when it is scheduled, but it publishes later and
 * unattended: by then its category or topic may be switched off, its
 * destination unpublished, or any of them gone. So the same rule that guards
 * a manual publish (assertPublishableClassification) is asked again here, at
 * the moment of publication.
 *
 * An article that fails stays exactly as it is — still scheduled, same date —
 * and goes out on a later run once its classification is put right. Only the
 * rule's own refusal holds an article back; a failed lookup fails the run, so
 * nothing is published on a check that could not be made.
 */
const findUnpublishable = async (dueFilter: Record<string, unknown>): Promise<unknown[]> => {
  const due = await Blog.find(dueFilter).select('title category subCategory destination').lean();
  const blocked: unknown[] = [];

  // An article no longer due — published, rescheduled or drafted — has nothing left to report.
  const dueIds = new Set(due.map((article) => String(article._id)));
  for (const id of heldBack.keys()) {
    if (!dueIds.has(id)) heldBack.delete(id);
  }

  for (const article of due) {
    const id = String(article._id);
    try {
      await assertPublishableClassification(article);
      heldBack.delete(id);
    } catch (error) {
      if (!(error instanceof PublishingValidationError)) throw error;
      blocked.push(article._id);
      if (heldBack.get(id) !== error.message) {
        heldBack.set(id, error.message);
        const title = (article.title as { en?: string } | undefined)?.en ?? '';
        console.error(`[publishing] Scheduled article ${id} "${title}" was not published: ${error.message}`);
      }
    }
  }

  return blocked;
};

const publishDueBlogs = async (now: Date): Promise<number> => {
  const dueFilter = {
    status: 'scheduled',
    scheduledAt: { $lte: now },
    'featuredImage.url': { $type: 'string', $ne: '' },
  };
  const blocked = await findUnpublishable(dueFilter);

  // The same write as ever, minus the articles held back above. Everything it
  // can match was due at `now`, and so was among the articles just checked.
  const result = await Blog.updateMany(
    blocked.length > 0 ? { ...dueFilter, _id: { $nin: blocked } } : dueFilter,
    {
      $set: {
        status: 'published',
        publishedAt: now,
        lastModified: now,
      },
      $unset: { scheduledAt: 1 },
      $inc: { editVersion: 1 },
    }
  );

  return result.modifiedCount;
};

const activateDueTours = async (now: Date): Promise<number> => {
  const result = await Tour.updateMany(
    {
      isActive: false,
      scheduledAt: { $lte: now },
    },
    {
      $set: {
        isActive: true,
        publishedAt: now,
      },
      $unset: { scheduledAt: 1 },
      $inc: { editVersion: 1 },
    }
  );

  return result.modifiedCount;
};

export const runPublishingCycle = async (
  now: Date = new Date()
): Promise<PublishingRunResult> => {
  if (runInProgress) {
    return { blogsPublished: 0, toursActivated: 0 };
  }

  runInProgress = true;
  try {
    const [blogsPublished, toursActivated] = await Promise.all([
      publishDueBlogs(now),
      activateDueTours(now),
    ]);

    if (blogsPublished > 0 || toursActivated > 0) {
      console.log(
        `[publishing] Published ${blogsPublished} blog(s), activated ${toursActivated} tour(s)`
      );
      void emitDashboardStatsUpdate();
    }

    return { blogsPublished, toursActivated };
  } finally {
    runInProgress = false;
  }
};

export const startPublishingScheduler = (): (() => void) => {
  if (process.env.PUBLISHING_SCHEDULER_ENABLED === 'false') {
    console.log('[publishing] Scheduler disabled by environment');
    return () => undefined;
  }

  const configuredInterval = Number(process.env.PUBLISHING_SCHEDULER_INTERVAL_MS);
  const intervalMs =
    Number.isFinite(configuredInterval) && configuredInterval >= 10_000
      ? configuredInterval
      : DEFAULT_INTERVAL_MS;

  const runSafely = () => {
    void runPublishingCycle().catch((error) => {
      console.error('[publishing] Scheduler cycle failed:', error);
    });
  };

  runSafely();
  const timer = setInterval(runSafely, intervalMs);
  timer.unref();

  console.log(`[publishing] Scheduler running every ${intervalMs}ms`);
  return () => clearInterval(timer);
};
