import { useQuery } from "@tanstack/react-query"

import { useAuth } from "@/context/AuthContext"
import type { PgEvent, Photo } from "@/context/PhotographerContext"
import {
  bookingsQueryOptions,
  myPhotosQueryOptions,
  toWorkspaceEvents,
} from "@/data/queries/photographer"

// Stable empties, so callers' memos don't rerun while loading
const NO_EVENTS: PgEvent[] = []
const NO_PHOTOS: Photo[] = []

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
