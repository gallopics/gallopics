import { QueryClient } from "@tanstack/react-query"

import { ApiError } from "./apiClient"

const retryQuery = (failureCount: number, error: unknown) => {
  if (error instanceof ApiError && error.status >= 400 && error.status < 500) {
    // A brand-new Clerk token can be "not yet valid" for a second on the API's
    // clock: one retry (after 1s) gets past that. Other 4xx answers are final.
    return error.status === 401 && failureCount < 1
  }
  // Network errors and 5xx
  return failureCount < 2
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Data counts as fresh for a minute, so moving between pages reuses it
      // instead of asking the API again
      staleTime: 60_000,
      // Network errors and 5xx get two more tries; 4xx answers are final
      // (except one retry for 401, see above)
      retry: retryQuery,
    },
  },
})
