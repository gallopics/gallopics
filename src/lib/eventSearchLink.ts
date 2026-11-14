/** Why an event matched a search: a photo tag ("rider", "horse", "class") or "photographer" */
export interface EventMatch {
  type: string
  value: string
}

const MATCH_LABELS: Record<string, string> = {
  rider: "Rider",
  horse: "Horse",
  class: "Class",
  photographer: "Photographer",
}

/** e.g. "Rider: Anna Svensson" */
export const formatEventMatch = (match: EventMatch) =>
  `${MATCH_LABELS[match.type] ?? match.type}: ${match.value}`

/** The event page; a matched rider or horse becomes its photo filter */
export function eventSearchLink(eventId: string, match?: EventMatch) {
  const filter =
    match && (match.type === "rider" || match.type === "horse")
      ? match.value
      : ""
  return `/event/${eventId}${filter ? `?q=${encodeURIComponent(filter)}` : ""}`
}
