import { queryOptions } from "@tanstack/react-query"

import { api } from "../apiClient"

export const checkoutKeys = {
  all: ["checkout"] as const,
  order: (sessionId: string) => [...checkoutKeys.all, sessionId] as const,
}

/** The order behind a Stripe Checkout Session */
export const checkoutOrderQueryOptions = (sessionId: string) =>
  queryOptions({
    queryKey: checkoutKeys.order(sessionId),
    queryFn: () => api.getCheckoutOrder(sessionId),
  })
