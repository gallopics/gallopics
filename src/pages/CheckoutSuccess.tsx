import { useEffect, useRef, useState } from "react"
import { useNavigate, useSearchParams } from "react-router"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { Check, CircleAlert } from "lucide-react"

import { QUALITY_TIERS } from "@/constants/qualityTiers"
import { useCart } from "@/context/CartContext"
import { api, type CheckoutOrder } from "@/data/apiClient"
import { checkoutOrderQueryOptions } from "@/data/queries/checkout"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Spinner } from "@/components/ui/spinner"
import { Breadcrumbs } from "@/components/Breadcrumbs"
import { Footer } from "@/components/Footer"
import { Header } from "@/components/Header"

/** Stripe may confirm a moment after the redirect: ask again for up to ~20s */
const POLL_INTERVAL_MS = 2000
const MAX_POLLS = 10

type OrderItem = CheckoutOrder["items"][number]

/** Where Stripe Checkout sends the buyer after paying: confirmation + downloads */
export function CheckoutSuccess() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const sessionId = searchParams.get("session_id")
  const { cart, removeFromCart } = useCart()

  // Ask again every 2s while the payment is still pending, up to MAX_POLLS answers
  const queryClient = useQueryClient()
  const orderOptions = checkoutOrderQueryOptions(sessionId ?? "")
  const orderQuery = useQuery({
    ...orderOptions,
    enabled: !!sessionId,
    refetchInterval: (query) =>
      query.state.data?.status === "pending" &&
      query.state.dataUpdateCount < MAX_POLLS
        ? POLL_INTERVAL_MS
        : false,
  })
  const order = orderQuery.data ?? null
  const error = !sessionId
    ? "This payment link is not valid."
    : orderQuery.isError
      ? orderQuery.error.message || "Could not load your order."
      : null
  // Every answer re-renders (dataUpdatedAt changes), so the count is current
  const answers = orderQuery.dataUpdatedAt
    ? (queryClient.getQueryState(orderOptions.queryKey)?.dataUpdateCount ?? 0)
    : 0
  const timedOut = order?.status === "pending" && answers >= MAX_POLLS
  const [downloadError, setDownloadError] = useState<string | null>(null)
  const [downloadingPhotoId, setDownloadingPhotoId] = useState<string | null>(
    null
  )
  // The cart as it was on arrival, for the bought photos' names
  const [cartOnArrival] = useState(cart)
  const cartCleared = useRef(false)

  // Once paid, take the bought photos out of the cart (only once)
  useEffect(() => {
    if (!order?.paid || cartCleared.current) return
    cartCleared.current = true
    const bought = new Set(
      order.items.map((item) => `${item.photo_id}:${item.quality}`)
    )
    cart
      .filter((item) => bought.has(`${item.photoId}:${item.quality}`))
      .forEach((item) => removeFromCart(item.cartId))
  }, [order, cart, removeFromCart])

  const handleDownload = async (item: OrderItem) => {
    if (!order) return
    setDownloadingPhotoId(item.photo_id)
    setDownloadError(null)
    try {
      const download = await api.createPhotoDownload(
        item.photo_id,
        order.order_id
      )
      window.location.assign(download.url)
    } catch (err) {
      setDownloadError(
        err instanceof Error ? err.message : "Could not prepare the download."
      )
    } finally {
      setDownloadingPhotoId(null)
    }
  }

  const cartItemFor = (item: OrderItem) =>
    cartOnArrival.find(
      (cartItem) =>
        cartItem.photoId === item.photo_id && cartItem.quality === item.quality
    )

  const isPaid = order?.paid === true
  const isFailed =
    !!error ||
    order?.status === "cancelled" ||
    order?.status === "refunded" ||
    timedOut

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <Breadcrumbs
        items={[
          { label: "Events", onClick: () => navigate("/") },
          { label: "Confirmation", active: true },
        ]}
      />

      <main className="flex-1 pt-10 pb-20 max-md:pt-6 max-md:pb-15">
        <div className="container">
          <div className="flex justify-center py-15 max-md:py-6">
            <Card className="w-full max-w-125 gap-0 rounded-3xl px-10 py-15 text-center shadow-[0_10px_40px_rgba(0,0,0,0.05)] max-md:px-6 max-md:py-10">
              {isPaid && order ? (
                <>
                  <div className="mx-auto mb-8 flex size-25 items-center justify-center rounded-full bg-success/10 text-success">
                    <Check className="size-16" />
                  </div>
                  <h1 className="mb-4 text-[2rem] font-extrabold">
                    Payment Successful!
                  </h1>
                  <p className="mb-10 leading-[1.6] text-muted-foreground">
                    Thank you for your purchase. Your Gallopics receipt has been
                    sent to {order.customer_email || "your email"}, and your
                    download links are ready.
                  </p>
                  <p className="mb-6 text-xs break-all text-muted-foreground">
                    Order ID: {order.order_id}
                  </p>

                  <div className="mb-8 flex flex-col gap-3 text-left">
                    {order.items.map((item) => {
                      const cartItem = cartItemFor(item)
                      return (
                        <div
                          key={`${item.photo_id}:${item.quality}`}
                          className="flex items-center justify-between gap-4 rounded-xl border p-3"
                        >
                          <div className="min-w-0">
                            <div className="truncate text-sm font-semibold text-foreground">
                              {cartItem
                                ? `${cartItem.photo.rider} / ${cartItem.photo.horse}`
                                : item.name}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {QUALITY_TIERS.find(
                                (tier) => tier.id === item.quality
                              )?.label ?? item.quality}
                            </div>
                          </div>
                          <Button
                            size="sm"
                            className="shrink-0 bg-black hover:bg-foreground"
                            onClick={() => handleDownload(item)}
                            disabled={downloadingPhotoId === item.photo_id}
                          >
                            {downloadingPhotoId === item.photo_id
                              ? "Preparing"
                              : "Download"}
                          </Button>
                        </div>
                      )
                    })}
                  </div>

                  {downloadError && (
                    <div className="mb-6 rounded-xl border border-destructive bg-destructive/8 p-3 text-left text-sm text-destructive">
                      {downloadError}
                    </div>
                  )}

                  <div className="flex flex-col gap-4">
                    <Button
                      className="h-12 bg-black hover:bg-foreground"
                      onClick={() => navigate("/")}
                    >
                      Continue browsing
                    </Button>
                    <p className="text-[0.8125rem] text-muted-foreground opacity-70">
                      Download links are active for 24 hours.
                    </p>
                  </div>
                </>
              ) : isFailed ? (
                <>
                  <div className="mx-auto mb-8 flex size-25 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                    <CircleAlert className="size-14" />
                  </div>
                  <h1 className="mb-4 text-2xl font-extrabold">
                    {timedOut
                      ? "Still confirming your payment"
                      : "Payment not completed"}
                  </h1>
                  <p className="mb-10 leading-[1.6] text-muted-foreground">
                    {error ??
                      (timedOut
                        ? "This is taking longer than usual. If you paid, your receipt and download links will arrive by email shortly."
                        : "Your payment was not completed and you have not been charged.")}
                  </p>
                  <div className="flex flex-col gap-3">
                    {timedOut && (
                      <Button
                        className="h-12"
                        onClick={() => window.location.reload()}
                      >
                        Check again
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      className="h-12"
                      onClick={() => navigate("/cart")}
                    >
                      Back to cart
                    </Button>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center gap-4 py-10">
                  <Spinner className="size-8" />
                  <p className="text-muted-foreground">
                    Confirming your payment…
                  </p>
                </div>
              )}
            </Card>
          </div>
        </div>
      </main>

      <Footer minimal />
    </div>
  )
}
