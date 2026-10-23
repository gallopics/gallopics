import { queryOptions, type QueryClient } from "@tanstack/react-query"

import { api, type ApiPhoto } from "../apiClient"
import {
  fetchClassSectionStarts,
  fetchEventFromApi,
  fetchEventScheduleFromApi,
  fetchEventsFromApi,
} from "../eventsApi"

/** Public event data: lists, details, schedules and galleries */
export const eventKeys = {
  all: ["events"] as const,
  lists: () => [...eventKeys.all, "list"] as const,
  list: (hasPhotos: boolean) => [...eventKeys.lists(), { hasPhotos }] as const,
  detail: (eventId: string) => [...eventKeys.all, "detail", eventId] as const,
  schedule: (eventId: string) =>
    [...eventKeys.detail(eventId), "schedule"] as const,
  galleries: (eventId: string) =>
    [...eventKeys.detail(eventId), "gallery"] as const,
  gallery: (eventId: string, pageSize: number) =>
    [...eventKeys.galleries(eventId), pageSize] as const,
  searches: (eventId: string) =>
    [...eventKeys.detail(eventId), "search"] as const,
  search: (eventId: string, query: string) =>
    [...eventKeys.searches(eventId), query] as const,
  classStarts: (classSectionId: string) =>
    [...eventKeys.all, "class-sections", classSectionId, "starts"] as const,
}

/** Photos of one event that match the query (tags, or photographer name) */
async function searchEventPhotos(eventId: string, query: string) {
  try {
    const [searchedPhotos, galleryPage] = await Promise.all([
      api.searchGallery(eventId, query),
      api.getEventGallery(eventId, 1, 25),
    ])
    const photographerMatches = galleryPage.items.filter((photo) =>
      (photo.photographer_display_name || "")
        .toLowerCase()
        .includes(query.toLowerCase())
    )
    const photosById = new Map(
      [...searchedPhotos, ...photographerMatches].map((photo) => [
        photo.id,
        photo,
      ])
    )
    return Array.from(photosById.values())
  } catch (error) {
    // One event failing should not hide the matches of the others
    console.warn(`Failed to search photo metadata for event ${eventId}`, error)
    return [] as ApiPhoto[]
  }
}

export const eventsListQueryOptions = (hasPhotos: boolean) =>
  queryOptions({
    queryKey: eventKeys.list(hasPhotos),
    queryFn: () =>
      fetchEventsFromApi(hasPhotos ? { hasPhotos: true } : undefined),
  })

export const eventQueryOptions = (eventId: string) =>
  queryOptions({
    queryKey: eventKeys.detail(eventId),
    queryFn: () => fetchEventFromApi(eventId),
  })

export const eventScheduleQueryOptions = (eventId: string) =>
  queryOptions({
    queryKey: eventKeys.schedule(eventId),
    queryFn: () => fetchEventScheduleFromApi(eventId),
  })

/** The first page of an event's public photos */
export const eventGalleryQueryOptions = (eventId: string, pageSize: number) =>
  queryOptions({
    queryKey: eventKeys.gallery(eventId, pageSize),
    queryFn: () => api.getEventGallery(eventId, 1, pageSize),
  })

/** An event's photos matching a search (never fails: errors give no matches) */
export const eventPhotoSearchQueryOptions = (eventId: string, query: string) =>
  queryOptions({
    queryKey: eventKeys.search(eventId, query),
    queryFn: () => searchEventPhotos(eventId, query),
  })

/** Riders and horses that start in a class */
export const classStartsQueryOptions = (classSectionId: string) =>
  queryOptions({
    queryKey: eventKeys.classStarts(classSectionId),
    queryFn: () => fetchClassSectionStarts(classSectionId),
  })

/**
 * After photos change: the events list (photo counts), and these events'
 * galleries and search results. The events themselves did not change.
 */
export function invalidateEventPhotos(
  client: QueryClient,
  eventIds: Iterable<string>
) {
  void client.invalidateQueries({ queryKey: eventKeys.lists() })
  new Set(eventIds).forEach((eventId) => {
    void client.invalidateQueries({ queryKey: eventKeys.galleries(eventId) })
    void client.invalidateQueries({ queryKey: eventKeys.searches(eventId) })
  })
}
