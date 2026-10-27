export class PublishingValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PublishingValidationError';
  }
}

export const parseFutureSchedule = (
  value: unknown,
  now: Date = new Date()
): Date => {
  if (value === undefined || value === null || value === '') {
    throw new PublishingValidationError('A scheduled date is required');
  }

  const scheduledAt = value instanceof Date ? new Date(value) : new Date(String(value));

  if (Number.isNaN(scheduledAt.getTime())) {
    throw new PublishingValidationError('Scheduled date is invalid');
  }

  if (scheduledAt.getTime() <= now.getTime()) {
    throw new PublishingValidationError('Scheduled date must be in the future');
  }

  return scheduledAt;
};

/** A real date: not null, '', a number, a string or an Invalid Date. */
const isPublicationDate = (value: unknown): value is Date =>
  value instanceof Date && !Number.isNaN(value.getTime());

/**
 * The `publishedAt` an article has once a write publishes it: the first moment
 * it was public. The field is the system's, never the client's, and it is set
 * once.
 *
 * - An article that has one keeps it. Publishing it again — after a draft, or
 *   a reschedule — does not make it new.
 * - An article that never had one is dated `now`; published by the scheduler,
 *   with the time it was scheduled for (`scheduledAt`), however late the run.
 *
 * Asked only by the writes that publish an article: createBlog, updateBlog
 * (into published), publishBlog, the scheduler and the model's save backstop.
 * Every other write leaves the field as stored — an article that was never
 * published has none — and none takes it from a request: the controllers
 * drop the client's value before anything reads it.
 */
export const resolveBlogPublishedAt = ({
  existingPublishedAt,
  scheduledAt,
  now = new Date(),
}: {
  existingPublishedAt: unknown;
  scheduledAt?: unknown;
  now?: Date;
}): Date => {
  if (isPublicationDate(existingPublishedAt)) return existingPublishedAt;
  // Never a time still to come: then the article is public from now.
  if (isPublicationDate(scheduledAt) && scheduledAt.getTime() <= now.getTime()) return scheduledAt;
  return now;
};

