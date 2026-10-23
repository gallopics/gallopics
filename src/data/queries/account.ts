import { queryOptions } from "@tanstack/react-query"

import { api, ApiError } from "../apiClient"
import { photographerKeys } from "./photographer"

/** The signed-in user as our API knows them (role and approval live here) */
export const accountKeys = {
  me: ["me"] as const,
}

export const meQueryOptions = () =>
  queryOptions({
    queryKey: accountKeys.me,
    queryFn: () => api.getMe(),
  })

/** The user's photographer profile; null until they create one */
export const photographerProfileQueryOptions = () =>
  queryOptions({
    queryKey: photographerKeys.profile(),
    queryFn: async () => {
      try {
        return await api.getMyPhotographer()
      } catch (error) {
        if (error instanceof ApiError && error.status === 404) return null
        throw error
      }
    },
  })
