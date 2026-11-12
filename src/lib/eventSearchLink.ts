/** Carry a matched rider or horse into the event's photo filter. */
export function eventSearchLink(eventId: string, matchLabel?: string) {
  const match = /^(?:Rider|Horse): (.+)$/.exec(matchLabel ?? "")
  return `/event/${eventId}${match ? `?q=${encodeURIComponent(match[1])}` : ""}`
}
