import { useMemo } from "react"
import {
  useQueries,
  useQuery,
  type UseQueryResult,
} from "@tanstack/react-query"

import { useAuth } from "@/context/AuthContext"
import type { PgEvent, Photo } from "@/context/PhotographerContext"
import { isUuid, type ApiEvent } from "@/data/apiClient"
import { eventQueryOptions } from "@/data/queries/events"
import {
  bookingsQueryOptions,
  myPhotosQueryOptions,
  toWorkspaceEvents,
} from "@/data/queries/photographer"

// Stable empties, so callers' memos don't rerun while loading
const NO_EVENTS: PgEvent[] = []
const NO_PHOTOS: Photo[] = []
const NO_API_EVENTS: ApiEvent[] = []

const combineEvents = (results: UseQueryResult<ApiEvent>[]) => {
  const events = results.flatMap((result) => (result.data ? [result.data] : []))
  return events.length ? events : NO_API_EVENTS
}

// The signed-in photographer's own data. Each loads only for API photographers
// (never for guests or admins) and only where a page asks for it.

/** Events the photographer booked */
export function useWorkspaceEvents() {
  const { isPhotographer } = useAuth()
  const { data = NO_EVENTS } = useQuery({
    ...bookingsQueryOptions(),
    enabled: isPhotographer,
    select: toWorkspaceEvents,
  })
  return data
}

/** All the photographer's photos */
export function useWorkspacePhotos() {
  const { isPhotographer } = useAuth()
  const { data = NO_PHOTOS } = useQuery({
    ...myPhotosQueryOptions(),
    enabled: isPhotographer,
  })
  return data
}

/**
 * The events these photos belong to, newest first. Booked events come from the
 * bookings; the rest (e.g. past events that are no longer booked) are read from
 * the public event endpoint, so they show their real name and dates.
 */
export function usePhotoEvents(photos: Pick<Photo, "eventId">[]): PgEvent[] {
  const booked = useWorkspaceEvents()
  const eventIds = useMemo(
    () => [...new Set(photos.map((photo) => photo.eventId))],
    [photos]
  )
  const missingIds = useMemo(
    () =>
      eventIds.filter(
        (id) => isUuid(id) && !booked.some((event) => event.id === id)
      ),
    [eventIds, booked]
  )
  const unbooked = useQueries({
    queries: missingIds.map((id) => eventQueryOptions(id)),
    combine: combineEvents,
  })

  return useMemo(() => {
    const notBooked = toWorkspaceEvents(unbooked).map((event) => ({
      ...event,
      isRegistered: false,
      canUploadPhotos: false,
    }))
    return [
      ...booked.filter((event) => eventIds.includes(event.id)),
      ...notBooked,
    ].sort((a, b) => b.date.localeCompare(a.date))
  }, [booked, eventIds, unbooked])
}
