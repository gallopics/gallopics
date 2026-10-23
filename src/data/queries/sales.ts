import { queryOptions } from "@tanstack/react-query"

import { api } from "../apiClient"
import { photographerKeys } from "./photographer"

/** The signed-in photographer's sales, newest first */
export const salesQueryOptions = () =>
  queryOptions({
    queryKey: photographerKeys.sales(),
    queryFn: () => api.getMySales(),
  })
