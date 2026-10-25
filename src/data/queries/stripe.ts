import { queryOptions } from "@tanstack/react-query"

import { api, type StripeConnectStatus } from "../apiClient"
import { photographerKeys } from "./photographer"

// The photographer's Stripe Connect account. Onboarding and dashboard links are
// single-use, so they are plain calls, never queries.

/** The saved status (no call to Stripe) */
export const stripeStatusQueryOptions = () =>
  queryOptions({
    queryKey: photographerKeys.stripe(),
    queryFn: () => api.getStripeConnectStatus(),
  })

/** Re-read from Stripe; also refreshes the saved status */
export const stripeLiveStatusQueryOptions = () =>
  queryOptions({
    queryKey: photographerKeys.stripeLive(),
    queryFn: async ({ client }) => {
      const status = await api.getStripeConnectStatus(true)
      client.setQueryData<StripeConnectStatus>(
        photographerKeys.stripe(),
        status
      )
      return status
    },
  })
