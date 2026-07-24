import Blog from '../models/Blog';
import Tour from '../models/Tour';
import { emitDashboardStatsUpdate } from '../realtime/socket';

const DEFAULT_INTERVAL_MS = 30_000;

export interface PublishingRunResult {
  blogsPublished: number;
  toursActivated: number;
}

let runInProgress = false;

const publishDueBlogs = async (now: Date): Promise<number> => {
  const result = await Blog.updateMany(
    {
      status: 'scheduled',
      scheduledAt: { $lte: now },
      'featuredImage.url': { $type: 'string', $ne: '' },
    },
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
