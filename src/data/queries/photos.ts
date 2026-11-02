import { queryOptions } from "@tanstack/react-query"

import { api } from "../apiClient"

/** Single public photos */
export const photoKeys = {
  all: ["photos"] as const,
  detail: (photoId: string) => [...photoKeys.all, photoId] as const,
}

export const photoQueryOptions = (photoId: string) =>
  queryOptions({
    queryKey: photoKeys.detail(photoId),
    queryFn: () => api.getPhoto(photoId),
  })

/** Public photographer profiles, by slug or id */
export const publicPhotographerKeys = {
  all: ["photographers"] as const,
  detail: (slugOrId: string) =>
    [...publicPhotographerKeys.all, slugOrId] as const,
}

export const publicPhotographerQueryOptions = (slugOrId: string) =>
  queryOptions({
    queryKey: publicPhotographerKeys.detail(slugOrId),
    queryFn: () => api.getPublicPhotographer(slugOrId),
  })
