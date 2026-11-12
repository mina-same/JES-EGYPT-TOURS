import Blog from '../models/Blog';
import Tour from '../models/Tour';
import { emitDashboardStatsUpdate } from '../realtime/socket';
import { assertEnglishPublicReady } from '../utils/blogAvailability';
import { assertPublishableClassification } from '../utils/blogClassification';
import { PublishingValidationError, resolveBlogPublishedAt } from '../utils/publishing';

const DEFAULT_INTERVAL_MS = 30_000;

export interface PublishingRunResult {
  blogsPublished: number;
  toursActivated: number;
}

let runInProgress = false;

/** Why a due article was held back, by id — said once per reason, not every run. */
const heldBack = new Map<string, string>();

/**
 * The due articles that may go public as they are filed now.
 *
 * An article is checked when it is scheduled, but it publishes later and
 * unattended: by then its category or topic may be switched off, its
 * destination unpublished, or any of them gone. So the same rules that guard
 * a manual publish are asked again here, at the moment of publication: its
 * classification (assertPublishableClassification) and its English page
 * (assertEnglishPublicReady). The Admin and the API already refuse to schedule
 * an article without either; asking again covers what reaches the collection
 * another way — older data, a script, an import, a direct edit.
 *
 * An article that fails stays exactly as it is — still scheduled, same date,
 * not a field touched — and goes out on a later run once it is put right. Only
 * a rule's own refusal holds an article back; a failed lookup fails the run, so
 * nothing is published on a check that could not be made.
 */
const findPublishable = async (dueFilter: Record<string, unknown>) => {
  const due = await Blog.find(dueFilter)
    .select('title slug contentBlocks category subCategory destination publishedAt scheduledAt')
    .lean();
  const publishable: typeof due = [];

  // An article no longer due — published, rescheduled or drafted — has nothing left to report.
  const dueIds = new Set(due.map((article) => String(article._id)));
  for (const id of heldBack.keys()) {
    if (!dueIds.has(id)) heldBack.delete(id);
  }

  for (const article of due) {
    const id = String(article._id);
    try {
      await assertPublishableClassification(article);
      assertEnglishPublicReady(article);
      heldBack.delete(id);
      publishable.push(article);
    } catch (error) {
      if (!(error instanceof PublishingValidationError)) throw error;
      if (heldBack.get(id) !== error.message) {
        heldBack.set(id, error.message);
        const title = (article.title as { en?: string } | undefined)?.en ?? '';
        console.error(`[publishing] Scheduled article ${id} "${title}" was not published: ${error.message}`);
      }
    }
  }

  return publishable;
};

const publishDueBlogs = async (now: Date): Promise<number> => {
  const dueFilter = {
    status: 'scheduled',
    scheduledAt: { $lte: now },
    'featuredImage.url': { $type: 'string', $ne: '' },
  };
  const publishable = await findPublishable(dueFilter);

  // Each article gets its own first-publication date (resolveBlogPublishedAt):
  // the time it was scheduled for, not this run's — or, public before and then
  // rescheduled, the date it first went public on. A plain update sets one
  // value for every document it matches, so there is one write per date:
  // usually exactly one, and none when nothing is due. Pipeline and $rename
  // updates could copy each article's own scheduledAt, but the content-update
  // guard (utils/duplicateInternalLinksPlugin.ts) refuses both by design.
  //
  // Each write matches only articles checked above, and only while they are
  // still scheduled and due: an article an editor moved meanwhile is not
  // touched. While an article stays scheduled nothing else writes its date.
  const byDate = new Map<number, { publishedAt: Date; ids: unknown[] }>();
  for (const article of publishable) {
    const publishedAt = resolveBlogPublishedAt({
      existingPublishedAt: article.publishedAt,
      scheduledAt: article.scheduledAt,
      now,
    });
    const batch = byDate.get(publishedAt.getTime()) ?? { publishedAt, ids: [] };
    batch.ids.push(article._id);
    byDate.set(publishedAt.getTime(), batch);
  }

  let published = 0;
  for (const { publishedAt, ids } of byDate.values()) {
    const result = await Blog.updateMany(
      { ...dueFilter, _id: { $in: ids } },
      {
        $set: {
          status: 'published',
          publishedAt,
          lastModified: now,
        },
        $unset: { scheduledAt: 1 },
        $inc: { editVersion: 1 },
      }
    );
    published += result.modifiedCount;
  }

  return published;
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
