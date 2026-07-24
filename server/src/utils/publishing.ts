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

