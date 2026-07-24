const pad = (value: number): string => String(value).padStart(2, '0');

export const toDatetimeLocalValue = (
  value: Date | string | null | undefined
): string => {
  if (value === undefined || value === null || value === '') return '';

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  return [
    date.getFullYear(),
    '-',
    pad(date.getMonth() + 1),
    '-',
    pad(date.getDate()),
    'T',
    pad(date.getHours()),
    ':',
    pad(date.getMinutes()),
  ].join('');
};

export const parseDatetimeLocal = (value: string): Date | undefined => {
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
};

export const getLocalTimezoneLabel = (): string => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'local time';
  } catch {
    return 'local time';
  }
};

