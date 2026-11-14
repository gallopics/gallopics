/**
 * One place for showing dates and times.
 *
 * - The API sends moments in UTC ("2026-11-14T08:15:00Z") and calendar days as "YYYY-MM-DD".
 * - Personal times (upload, purchase, sign-up) are shown in the viewer's own zone.
 * - Event times (when a photo was taken) are shown in Swedish time, like the Equipe schedule
 *   on the same pages, and sales are grouped by Swedish days/months to match the payouts.
 */

export const SWEDISH_TIME_ZONE = "Europe/Stockholm"

const LOCALE = "en-GB"
const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/

export type DateInput = string | number | Date | null | undefined

const DATE_OPTIONS: Intl.DateTimeFormatOptions = {
  day: "numeric",
  month: "short",
  year: "numeric",
}
const TIME_OPTIONS: Intl.DateTimeFormatOptions = {
  hour: "2-digit",
  minute: "2-digit",
}

const isDateOnly = (value: DateInput): value is string =>
  typeof value === "string" && DATE_ONLY.test(value)

/** Parses an API value. "YYYY-MM-DD" is a calendar day (local midnight), not UTC midnight. */
export function toDate(value: DateInput): Date | null {
  if (value === null || value === undefined || value === "") return null
  if (isDateOnly(value)) {
    const [year, month, day] = value.split("-").map(Number)
    return new Date(year, month - 1, day)
  }
  const date = value instanceof Date ? value : new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

function format(value: DateInput, options: Intl.DateTimeFormatOptions): string {
  const date = toDate(value)
  if (!date) return ""
  // A calendar day has no zone; converting it would move it to another day
  const timeZone = isDateOnly(value) ? undefined : options.timeZone
  return date.toLocaleString(LOCALE, { ...options, timeZone })
}

/**
 * "14 Nov 2026" in the viewer's zone. Pass options to change the parts, e.g. { year: undefined },
 * or the zone, e.g. { timeZone: photo.timeZone }.
 */
export const formatDate = (
  value: DateInput,
  options?: Intl.DateTimeFormatOptions
) => format(value, { ...DATE_OPTIONS, ...options })

/** "09:15" in the viewer's zone. */
export const formatTime = (value: DateInput) => format(value, TIME_OPTIONS)

/** "14 Nov 2026" in Swedish time (event times). */
export const formatEventDate = (
  value: DateInput,
  options?: Intl.DateTimeFormatOptions
) => formatDate(value, { ...options, timeZone: SWEDISH_TIME_ZONE })

/** "09:15" in Swedish time (event times). */
export const formatEventTime = (value: DateInput) =>
  format(value, { ...TIME_OPTIONS, timeZone: SWEDISH_TIME_ZONE })

/** Year, month (0-11) and day of a moment in Swedish time, for grouping sales. */
export function swedishDateParts(
  value: DateInput
): { year: number; month: number; day: number } | null {
  const date = toDate(value)
  if (!date) return null
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: SWEDISH_TIME_ZONE,
    year: "numeric",
    month: "numeric",
    day: "numeric",
  }).formatToParts(date)
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((p) => p.type === type)?.value)
  return { year: part("year"), month: part("month") - 1, day: part("day") }
}
