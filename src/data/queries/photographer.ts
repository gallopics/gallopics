import {
  mutationOptions,
  queryOptions,
  type QueryClient,
} from "@tanstack/react-query"

import { formatLabel } from "@/lib/utils"
import type { PgEvent, Photo } from "@/context/PhotographerContext"

import { api, resolveApiAssetUrl, type ApiPhoto } from "../apiClient"
import { formatEventPeriod, type ApiEvent } from "../eventsApi"
import { invalidateEventPhotos } from "./events"
import { publicPhotographerKeys } from "./photos"

const PHOTOS_PAGE_SIZE = 100

export const getApiPhotoTag = (photo: ApiPhoto, type: string) =>
  photo.tags.find((tag) => tag.type === type)?.value

export const getApiPhotoClassId = (photo: ApiPhoto) =>
  photo.equipe_class_section_id ||
  photo.class_id ||
  photo.class_section_id ||
  photo.event_class_id ||
  ""

export const getApiPhotoClassName = (photo: ApiPhoto) =>
  photo.class_name || photo.event_class_name || ""

/** A photographer's photo as the studio shows it */
function mapApiPhotoToPgPhoto(photo: ApiPhoto): Photo {
  return {
    id: photo.id,
    // Always the preview URL: it falls back to the original if there is no preview
    url:
      resolveApiAssetUrl(`/api/v1/photographer/photos/${photo.id}/preview`) ||
      "",
    eventId: photo.event_id,
    status: photo.status === "ready" ? "uploadedUnpublished" : "processing",
    soldCount: 0,
    rider: getApiPhotoTag(photo, "rider"),
    riderId: photo.equipe_rider_id || undefined,
    horse: getApiPhotoTag(photo, "horse"),
    horseId: photo.equipe_horse_id || undefined,
    timestamp: new Date(photo.created_at).toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
    }),
    width: 600,
    height: 800,
    fileName: photo.storage_key_original?.split("/").pop(),
    photoCode: "",
    uploadDate: photo.created_at,
    batch: "",
    classId: getApiPhotoClassId(photo),
    className: getApiPhotoClassName(photo),
    isDuplicate: false,
    storedLocation: "Uncategorised",
    priceStandard: 499,
    priceHigh: 999,
    priceCommercial: 1500,
  }
}

async function fetchAllMyPhotos() {
  const photos: ApiPhoto[] = []
  for (let page = 1; ; page += 1) {
    const data = await api.getMyPhotosPage(page, PHOTOS_PAGE_SIZE)
    photos.push(...data.items)
    if (photos.length >= data.total || data.items.length === 0) break
  }
  return photos.map(mapApiPhotoToPgPhoto)
}

/** A booked event as the studio pages show it (`select` for `bookings`) */
export const toWorkspaceEvents = (bookings: ApiEvent[]): PgEvent[] =>
  bookings.map((event) => ({
    id: event.id,
    title: event.name || "Untitled Event",
    date: event.start_date || new Date().toISOString(),
    endDate: event.end_date || event.start_date,
    dateRange: event.start_date
      ? formatEventPeriod(event.start_date, event.end_date)
      : "",
    location: event.city || "",
    coverImage: event.cover_image || event.coverImage || "",
    status: "open",
    isRegistered: true,
    photosCount: 0,
    publishedCount: 0,
    soldCount: 0,
    logo: "",
    venueName: event.venue_name || "",
    disciplines: event.discipline ? [formatLabel(event.discipline)] : [],
    city: event.city || "",
    assignedPhotographers: [],
    applicationsWelcomed: true,
    canUploadPhotos: true,
  }))

/** The signed-in photographer's own data (reads need the API role "photographer") */
export const photographerKeys = {
  all: ["photographer"] as const,
  /** Their photographer profile (any signed-in user; null until created) */
  profile: () => [...photographerKeys.all, "me"] as const,
  bookings: () => [...photographerKeys.all, "bookings"] as const,
  photos: () => [...photographerKeys.all, "photos"] as const,
  highlights: () => [...photographerKeys.all, "highlights"] as const,
  sales: () => [...photographerKeys.all, "sales"] as const,
  /** The saved Stripe Connect status */
  stripe: () => [...photographerKeys.all, "stripe"] as const,
  /** Re-read from Stripe */
  stripeLive: () => [...photographerKeys.stripe(), "live"] as const,
}

/** Events the photographer booked (raw API events) */
export const bookingsQueryOptions = () =>
  queryOptions({
    queryKey: photographerKeys.bookings(),
    queryFn: () => api.listMyEventBookings() as Promise<ApiEvent[]>,
  })

/**
 * All the photographer's photos. The studio also edits fields the API does not
 * store yet (batch, prices, duplicates), and those edits live only in this cache,
 * so it is never refetched in the background; uploads and deletes update it.
 */
export const myPhotosQueryOptions = () =>
  queryOptions({
    queryKey: photographerKeys.photos(),
    queryFn: () => fetchAllMyPhotos(),
    staleTime: Infinity,
  })

/** Ids of the photos shown on the public profile */
export const highlightsQueryOptions = () =>
  queryOptions({
    queryKey: photographerKeys.highlights(),
    queryFn: async () => (await api.getMyHighlights()).highlights,
  })

// --- Writes ---

const isUuid = (value: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  )

/** The tags the API stores for a photo (generic photos have none) */
const buildTags = (photo: Photo) => {
  const tags: Array<{ type: string; value: string }> = []
  if (photo.isGeneric) return tags
  if (photo.rider) tags.push({ type: "rider", value: photo.rider })
  if (photo.horse) tags.push({ type: "horse", value: photo.horse })
  if (photo.className) tags.push({ type: "class", value: photo.className })
  return tags
}

const getCachedPhotos = (client: QueryClient) =>
  client.getQueryData<Photo[]>(photographerKeys.photos()) ?? []

/** Edit the cached photo list (no-op until it has loaded) */
export function updateCachedPhotos(
  client: QueryClient,
  update: (photos: Photo[]) => Photo[]
) {
  client.setQueryData<Photo[]>(
    photographerKeys.photos(),
    (prev) => prev && update(prev)
  )
}

/** Put photos back in the list (Undo); local only */
export function restoreCachedPhotos(client: QueryClient, photos: Photo[]) {
  const ids = new Set(photos.map((p) => p.id))
  updateCachedPhotos(client, (prev) => [
    ...prev.filter((p) => !ids.has(p.id)),
    ...photos,
  ])
}

/** Keep or drop one copy of a duplicate; local only */
export function resolveCachedDuplicate(
  client: QueryClient,
  photoId: string,
  action: "keep" | "remove"
) {
  const photos = getCachedPhotos(client)
  const photo = photos.find((p) => p.id === photoId)
  if (!photo) return

  if (action === "remove") {
    // Removing this one may leave a single copy, which then is no duplicate
    const others = photos.filter(
      (p) => p.url === photo.url && p.isDuplicate && p.id !== photoId
    )
    const survivorId = others.length === 1 ? others[0].id : null
    updateCachedPhotos(client, (prev) =>
      prev
        .filter((p) => p.id !== photoId)
        .map((p) =>
          p.id === survivorId
            ? { ...p, isDuplicate: false, duplicateResolved: true }
            : p
        )
    )
  } else {
    // Keep this one and drop the other copies (same url)
    updateCachedPhotos(client, (prev) =>
      prev
        .filter(
          (p) => p.id === photoId || !(p.url === photo.url && p.isDuplicate)
        )
        .map((p) => (p.id === photoId ? { ...p, duplicateResolved: true } : p))
    )
  }
}

/**
 * Gone from the list at once; back if the API refuses. `hidden`: photos an
 * Undo toast already took out of the list (see useDeletePhotosWithUndo).
 */
export const deletePhotosMutationOptions = () =>
  mutationOptions({
    mutationKey: [...photographerKeys.photos(), "delete"],
    mutationFn: ({ photoIds }: { photoIds: string[]; hidden?: Photo[] }) =>
      Promise.all(photoIds.map((id) => api.deletePhoto(id))),
    onMutate: async ({ photoIds, hidden }, { client }) => {
      await client.cancelQueries({ queryKey: photographerKeys.photos() })
      const removed =
        hidden ?? getCachedPhotos(client).filter((p) => photoIds.includes(p.id))
      updateCachedPhotos(client, (prev) =>
        prev.filter((p) => !photoIds.includes(p.id))
      )
      return { removed }
    },
    onError: (error, _variables, result, { client }) => {
      // Put back the ones that are still missing
      updateCachedPhotos(client, (prev) => {
        const remainingIds = new Set(prev.map((p) => p.id))
        const missing = (result?.removed ?? []).filter(
          (p) => !remainingIds.has(p.id)
        )
        return [...missing, ...prev]
      })
      // Others may have been deleted before one was refused (e.g. a sold photo)
      void client.invalidateQueries({ queryKey: photographerKeys.photos() })
      invalidateEventPhotos(
        client,
        (result?.removed ?? []).map((p) => p.eventId)
      )
      console.error("Failed to delete photos:", error)
    },
    onSuccess: (_data, _variables, result, { client }) => {
      invalidateEventPhotos(
        client,
        result.removed.map((p) => p.eventId)
      )
    },
  })

/**
 * Change photos' details at once. Only the tags (rider, horse, class) are saved
 * by the API so far; the other fields stay in the cache.
 */
export const savePhotoDetailsMutationOptions = () =>
  mutationOptions({
    mutationKey: [...photographerKeys.photos(), "update"],
    onMutate: async (
      { photoIds, details }: { photoIds: string[]; details: Partial<Photo> },
      { client }
    ) => {
      await client.cancelQueries({ queryKey: photographerKeys.photos() })
      updateCachedPhotos(client, (prev) =>
        prev.map((p) => (photoIds.includes(p.id) ? { ...p, ...details } : p))
      )
    },
    // Runs after onMutate, so the cached photos already have the new details
    mutationFn: async ({ photoIds }, { client }) => {
      const photos = getCachedPhotos(client).filter(
        (p) => photoIds.includes(p.id) && isUuid(p.id)
      )
      await Promise.all(
        photos.map((photo) =>
          api.updatePhoto(photo.id, { tags: buildTags(photo) })
        )
      )
      return photos.map((photo) => photo.eventId)
    },
    onSuccess: (eventIds, _variables, _result, { client }) => {
      invalidateEventPhotos(client, eventIds)
    },
  })

/** Shown at once; the old list comes back if the API refuses */
export const saveHighlightsMutationOptions = () =>
  mutationOptions({
    mutationKey: [...photographerKeys.highlights(), "update"],
    mutationFn: (ids: string[]) => api.updateMyHighlights(ids),
    onMutate: async (ids, { client }) => {
      const key = photographerKeys.highlights()
      await client.cancelQueries({ queryKey: key })
      const previousIds = client.getQueryData<string[]>(key) ?? []
      client.setQueryData<string[]>(key, ids)
      return { previousIds }
    },
    onError: (error, _ids, result, { client }) => {
      client.setQueryData<string[]>(
        photographerKeys.highlights(),
        result?.previousIds ?? []
      )
      console.error("Failed to update highlights:", error)
    },
    onSuccess: (response, _ids, _result, { client }) => {
      client.setQueryData<string[]>(
        photographerKeys.highlights(),
        response.highlights
      )
      // The public profile lists them too
      void client.invalidateQueries({ queryKey: publicPhotographerKeys.all })
    },
  })
