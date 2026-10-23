import { queryOptions } from "@tanstack/react-query"

import { api } from "../apiClient"

export const adminKeys = {
  all: ["admin"] as const,
  photographers: () => [...adminKeys.all, "photographers"] as const,
}

/** All photographers, newest first */
export const adminPhotographersQueryOptions = () =>
  queryOptions({
    queryKey: adminKeys.photographers(),
    queryFn: () => api.getAdminPhotographers(),
  })
