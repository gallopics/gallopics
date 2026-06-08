const ISO_DATE_PREFIX = /^\d{4}-\d{2}-\d{2}/;
const EQUIPE_CURRENT_GRACE_DAYS = 1;

function parseIsoLocalDate(value?: string | null): Date | null {
  if (!value || !ISO_DATE_PREFIX.test(value)) return null;
  const date = new Date(`${value.slice(0, 10)}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function todayStart(): Date {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

export function isPreviousEventDate(
  startDate?: string | null,
  endDate?: string | null,
): boolean {
  const eventEnd = parseIsoLocalDate(endDate || startDate);
  if (!eventEnd) return false;
  const previousCutoff = addDays(todayStart(), -EQUIPE_CURRENT_GRACE_DAYS);
  return eventEnd < previousCutoff;
}

export function getEventSortTime(
  startDate?: string | null,
  fallbackDate?: string | null,
): number {
  return parseIsoLocalDate(startDate || fallbackDate)?.getTime() ?? 0;
}
