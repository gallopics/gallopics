import {
  mutationOptions,
  queryOptions,
  type QueryClient,
} from "@tanstack/react-query"

import {
  LINKED_PRICES,
  toApiPrices,
  toSekOwnPrices,
  toSekPrices,
  type OwnPhotoPrices,
} from "@/constants/qualityTiers"
import { assetUrl, formatLabel } from "@/lib/utils"
import type { PgEvent, Photo } from "@/context/PhotographerContext"

import {
  api,
  getApiPhotoPreviewUrl,
  type ApiPhoto,
  type ApiPhotoFolder,
} from "../apiClient"
import {
  formatEventPeriod,
  getPhotoTag,
  mapApiEventToEventData,
  normalizeCountry,
  type ApiEvent,
} from "../eventsApi"
import { eventKeys, invalidateEventPhotos } from "./events"
import { photoKeys, publicPhotographerKeys } from "./photos"

const PHOTOS_PAGE_SIZE = 100

export const defaultPricesQueryOptions = () =>
  queryOptions({
    queryKey: photographerKeys.defaultPrices(),
    queryFn: () => api.getMyDefaultPrices(),
  })

export const saveDefaultPricesMutationOptions = () =>
  mutationOptions({
    mutationFn: (prices: Partial<OwnPhotoPrices>) =>
      api.updateMyDefaultPrices(toApiPrices(prices)),
    onSuccess: async (data, _variables, _result, { client }) => {
      client.setQueryData(photographerKeys.defaultPrices(), data)
      await Promise.all([
        client.invalidateQueries({ queryKey: photographerKeys.photos() }),
        client.invalidateQueries({ queryKey: photoKeys.all }),
        client.invalidateQueries({ queryKey: eventKeys.all }),
        client.invalidateQueries({ queryKey: publicPhotographerKeys.all }),
      ])
    },
  })

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
    url: getApiPhotoPreviewUrl(photo),
    eventId: photo.event_id,
    status: photo.status === "ready" ? "uploadedUnpublished" : "processing",
    soldCount: 0,
    rider: getPhotoTag(photo, "rider"),
    riderId: photo.equipe_rider_id || undefined,
    horse: getPhotoTag(photo, "horse"),
    horseId: photo.equipe_horse_id || undefined,
    timestamp: new Date(photo.created_at).toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
    }),
    width: 600,
    height: 800,
    fileName: photo.file_name || undefined,
    uploadDate: photo.created_at,
    folderId: photo.folder_id || undefined,
    classId: getApiPhotoClassId(photo),
    className: getApiPhotoClassName(photo),
    prices: toSekPrices(photo.prices),
    ownPrices: toSekOwnPrices(photo.own_prices ?? LINKED_PRICES),
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

/** An event from the events API as the studio pages show it */
export const toPgEvent = (
  eventId: string,
  event: ApiEvent,
  canUploadPhotos = false
): PgEvent => {
  const eventData = mapApiEventToEventData(event)

  return {
    id: eventData.id || eventId,
    title: eventData.name,
    date: eventData.startDate || eventData.period,
    endDate: eventData.endDate || eventData.startDate,
    dateRange: eventData.period,
    location: `${eventData.city}, ${eventData.country}`,
    coverImage: eventData.coverImage,
    status: "open",
    isRegistered: true,
    photosCount: eventData.photoCount || 0,
    publishedCount: 0,
    soldCount: 0,
    logo:
      eventData.logo ||
      eventData.coverImage ||
      assetUrl("images/events/default.png"),
    venueName: event.venue_name || "",
    disciplines: [eventData.discipline].filter(Boolean),
    city: event.city || "",
    organiser: event.organizer_name || "",
    county: event.district || "",
    country: eventData.country,
    assignedPhotographers: eventData.photographer
      ? [eventData.photographer]
      : [],
    applicationsWelcomed: eventData.status !== "disabled",
    canUploadPhotos,
  }
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
    organiser: event.organizer_name || "",
    county: event.district || "",
    country: normalizeCountry(event.country),
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
  /** Local removals pending Undo or a reset of the photo cache */
  hiddenPhotos: () => [...photographerKeys.all, "hidden-photos"] as const,
  defaultPrices: () => [...photographerKeys.all, "default-prices"] as const,
  highlights: () => [...photographerKeys.all, "highlights"] as const,
  /** Their own folders in one event */
  folders: (eventId: string) =>
    [...photographerKeys.all, "folders", eventId] as const,
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
 * All the photographer's photos. Uploads, saves and deletes update the list,
 * so it is not refetched in the background. Photos waiting for a delete (Undo
 * toast) stay out of a refetch.
 */
export const myPhotosQueryOptions = () =>
  queryOptions({
    queryKey: photographerKeys.photos(),
    queryFn: async ({ client }) => {
      if (client.getQueryData(photographerKeys.photos()) === undefined)
        client.removeQueries({ queryKey: photographerKeys.hiddenPhotos() })
      const photos = await fetchAllMyPhotos()
      const hidden = new Set(
        client.getQueryData<string[]>(photographerKeys.hiddenPhotos())
      )
      return photos.filter((photo) => !hidden.has(photo.id))
    },
    staleTime: Infinity,
  })

/** Folders by name, ignoring case and accents */
const sortFolders = (folders: ApiPhotoFolder[]) =>
  [...folders].sort((a, b) =>
    a.name.localeCompare(b.name, undefined, { sensitivity: "base" })
  )

/** The photographer's own folders in one event */
export const foldersQueryOptions = (eventId: string) =>
  queryOptions({
    queryKey: photographerKeys.folders(eventId),
    // Sorted like the folders added later (see setCachedFolder)
    queryFn: async () => sortFolders(await api.listMyFolders(eventId)),
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

/** The tags the API stores for a photo */
const buildTags = (photo: Photo) => {
  const tags: Array<{ type: string; value: string }> = []
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

/** Put the photos the API returned after a save into the cached list */
function setSavedPhotos(client: QueryClient, saved: ApiPhoto[]) {
  const byId = new Map(saved.map((photo) => [photo.id, photo]))
  updateCachedPhotos(client, (prev) =>
    prev.map((p) => {
      const photo = byId.get(p.id)
      return photo ? mapApiPhotoToPgPhoto(photo) : p
    })
  )
}

/** After a failed save, some photos may still have changed on the server */
const refetchMyPhotos = (client: QueryClient) =>
  void client.invalidateQueries({ queryKey: photographerKeys.photos() })

export function hideCachedPhotos(client: QueryClient, photoIds: string[]) {
  const key = photographerKeys.hiddenPhotos()
  const hidden = new Set(client.getQueryData<string[]>(key))
  photoIds.forEach((id) => hidden.add(id))
  client.setQueryDefaults(key, { gcTime: Infinity })
  client.setQueryData(key, [...hidden])
  updateCachedPhotos(client, (prev) => prev.filter((p) => !hidden.has(p.id)))
}

function unhidePhotoIds(client: QueryClient, photoIds: Set<string>) {
  client.setQueryData<string[]>(photographerKeys.hiddenPhotos(), (prev) =>
    prev?.filter((id) => !photoIds.has(id))
  )
}

/** Put photos back in the list (Undo); local only */
export function restoreCachedPhotos(client: QueryClient, photos: Photo[]) {
  const ids = new Set(photos.map((p) => p.id))
  unhidePhotoIds(client, ids)
  updateCachedPhotos(client, (prev) => [
    ...prev.filter((p) => !ids.has(p.id)),
    ...photos,
  ])
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
      hideCachedPhotos(client, photoIds)
      return { removed }
    },
    onError: (error, _variables, result, { client }) => {
      unhidePhotoIds(client, new Set(result?.removed.map((photo) => photo.id)))
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
    mutationFn: async (
      { photoIds, details }: { photoIds: string[]; details: Partial<Photo> },
      { client }
    ) => {
      const photos = getCachedPhotos(client).filter(
        (p) => photoIds.includes(p.id) && isUuid(p.id)
      )
      // Finish every write before the caller starts restoring a partial save.
      const results = await Promise.allSettled(
        photos.map((photo) =>
          api.updatePhoto(photo.id, {
            tags: buildTags({ ...photo, ...details }),
          })
        )
      )
      const failed = results.find((result) => result.status === "rejected")
      if (failed) throw failed.reason
      return results.flatMap((result) =>
        result.status === "fulfilled" ? [result.value] : []
      )
    },
    onSuccess: (saved, _variables, _result, { client }) => {
      setSavedPhotos(client, saved)
      invalidateEventPhotos(
        client,
        saved.map((photo) => photo.event_id)
      )
    },
    onError: (_error, _variables, _result, { client }) =>
      refetchMyPhotos(client),
  })

/** Most photos the API takes in one bulk update (prices, folder) */
const BULK_UPDATE_SIZE = 1000

/** A price update that failed after earlier batches were saved */
export class PhotoPricesSaveError extends Error {
  /** Photos whose new prices were saved before the failure */
  readonly savedPhotoIds: string[]

  constructor(savedPhotoIds: string[], cause: unknown) {
    super("Unable to save all prices", { cause })
    this.savedPhotoIds = savedPhotoIds
  }
}

/** Set prices (SEK) for photos at once; tiers left out keep their price */
export const savePhotoPricesMutationOptions = () =>
  mutationOptions({
    mutationKey: [...photographerKeys.photos(), "prices"],
    mutationFn: async ({
      photoIds,
      prices,
    }: {
      photoIds: string[]
      prices: Partial<OwnPhotoPrices>
    }) => {
      const ids = photoIds.filter(isUuid)
      const apiPrices = toApiPrices(prices)
      const updated: ApiPhoto[] = []
      for (let i = 0; i < ids.length; i += BULK_UPDATE_SIZE) {
        const batch = ids.slice(i, i + BULK_UPDATE_SIZE)
        try {
          updated.push(...(await api.updatePhotoPrices(batch, apiPrices)))
        } catch (error) {
          throw new PhotoPricesSaveError(
            updated.map((photo) => photo.id),
            error
          )
        }
      }
      return updated
    },
    onSuccess: (updated, _variables, _result, { client }) => {
      setSavedPhotos(client, updated)
      invalidateEventPhotos(
        client,
        updated.map((photo) => photo.event_id)
      )
      // The public photo page shows them too
      void client.invalidateQueries({ queryKey: photoKeys.all })
    },
    onError: (_error, _variables, _result, { client }) =>
      refetchMyPhotos(client),
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

// Moves and folder deletes run one after another, so an Undo lands after its move
const FOLDER_SCOPE = { id: "photo-folders" }

const setCachedFolder = (client: QueryClient, folder: ApiPhotoFolder) =>
  client.setQueryData<ApiPhotoFolder[]>(
    photographerKeys.folders(folder.event_id),
    (prev) =>
      prev && sortFolders([...prev.filter((f) => f.id !== folder.id), folder])
  )

export const createFolderMutationOptions = () =>
  mutationOptions({
    mutationKey: [...photographerKeys.all, "folders", "create"],
    mutationFn: ({ eventId, name }: { eventId: string; name: string }) =>
      api.createFolder(eventId, name),
    onSuccess: (folder, _variables, _result, { client }) =>
      setCachedFolder(client, folder),
  })

export const renameFolderMutationOptions = () =>
  mutationOptions({
    mutationKey: [...photographerKeys.all, "folders", "rename"],
    mutationFn: ({ folderId, name }: { folderId: string; name: string }) =>
      api.renameFolder(folderId, name),
    onSuccess: (folder, _variables, _result, { client }) =>
      setCachedFolder(client, folder),
  })

/** Gone at once with its photos back in Uncategorised; both return if the API refuses */
export const deleteFolderMutationOptions = () =>
  mutationOptions({
    mutationKey: [...photographerKeys.all, "folders", "delete"],
    scope: FOLDER_SCOPE,
    mutationFn: (folder: ApiPhotoFolder) => api.deleteFolder(folder.id),
    onMutate: async (folder, { client }) => {
      const key = photographerKeys.folders(folder.event_id)
      await client.cancelQueries({ queryKey: key })
      const movedIds = new Set(
        getCachedPhotos(client)
          .filter((p) => p.folderId === folder.id)
          .map((p) => p.id)
      )
      client.setQueryData<ApiPhotoFolder[]>(key, (prev) =>
        prev?.filter((f) => f.id !== folder.id)
      )
      updateCachedPhotos(client, (prev) =>
        prev.map((p) =>
          movedIds.has(p.id) ? { ...p, folderId: undefined } : p
        )
      )
      return { movedIds }
    },
    onError: (error, folder, result, { client }) => {
      setCachedFolder(client, folder)
      const movedIds = result?.movedIds ?? new Set<string>()
      updateCachedPhotos(client, (prev) =>
        prev.map((p) =>
          movedIds.has(p.id) ? { ...p, folderId: folder.id } : p
        )
      )
      console.error("Failed to delete folder:", error)
    },
  })

/** Photos into a folder (null = Uncategorised) at once; back where they were if the API refuses */
export const movePhotosToFolderMutationOptions = () =>
  mutationOptions({
    mutationKey: [...photographerKeys.photos(), "folder"],
    scope: FOLDER_SCOPE,
    mutationFn: async ({
      photoIds,
      folderId,
    }: {
      photoIds: string[]
      folderId: string | null
    }) => {
      const ids = photoIds.filter(isUuid)
      for (let i = 0; i < ids.length; i += BULK_UPDATE_SIZE) {
        await api.movePhotosToFolder(
          ids.slice(i, i + BULK_UPDATE_SIZE),
          folderId
        )
      }
    },
    onMutate: async ({ photoIds, folderId }, { client }) => {
      await client.cancelQueries({ queryKey: photographerKeys.photos() })
      const ids = new Set(photoIds)
      const previous = new Map(
        getCachedPhotos(client)
          .filter((p) => ids.has(p.id))
          .map((p) => [p.id, p.folderId])
      )
      updateCachedPhotos(client, (prev) =>
        prev.map((p) =>
          ids.has(p.id) ? { ...p, folderId: folderId ?? undefined } : p
        )
      )
      return { previous }
    },
    onError: (error, _variables, result, { client }) => {
      const previous = result?.previous ?? new Map<string, string | undefined>()
      updateCachedPhotos(client, (prev) =>
        prev.map((p) =>
          previous.has(p.id) ? { ...p, folderId: previous.get(p.id) } : p
        )
      )
      // An earlier batch may have moved before one was refused
      if (previous.size > BULK_UPDATE_SIZE) {
        void client.invalidateQueries({ queryKey: photographerKeys.photos() })
      }
      console.error("Failed to move photos:", error)
    },
  })
