import { useMemo, useState } from "react"
import { useNavigate, useSearchParams } from "react-router"
import { ArrowLeft, Check, Eye, ShoppingBag, Trash2 } from "lucide-react"

import { getDefaultCartTier } from "@/constants/qualityTiers"
import { useCart } from "@/context/CartContext"
import {
  api,
  type CheckoutLineItem,
  type CheckoutOrder,
} from "@/data/apiClient"
import { COMPETITIONS } from "@/data/mockData"
import type { CartItem, Photo } from "@/types"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { toast } from "@/components/ui/toast"
import { Breadcrumbs } from "@/components/Breadcrumbs"
import type { BreadcrumbItem } from "@/components/Breadcrumbs"
import { CheckoutPanel } from "@/components/CheckoutPanel"
import { Footer } from "@/components/Footer"
import { Header } from "@/components/Header"
import { PhotoCard } from "@/components/PhotoCard"

/** "Recently viewed" photo row (desktop only) */
function RecentlyViewed({
  photos,
  onOpen,
  onAddToCart,
}: {
  photos: Photo[]
  onOpen: (photo: Photo) => void
  onAddToCart: (photo: Photo) => void
}) {
  if (photos.length === 0) return null

  return (
    <div className="mt-8 hidden border-t border-black/6 pt-6 md:block">
      <div className="mb-5 flex items-center gap-2">
        <Eye className="size-4.5 text-muted-foreground opacity-70" />
        <h2 className="text-sm font-semibold tracking-[0.02em] text-muted-foreground">
          Recently viewed
        </h2>
      </div>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {photos.map((photo) => (
          <PhotoCard
            key={photo.id}
            photo={photo}
            onClick={() => onOpen(photo)}
            onAddToCart={() => onAddToCart(photo)}
          />
        ))}
      </div>
    </div>
  )
}

export function Cart() {
  const { cart, addToCart, removeFromCart, total, clearCart } = useCart()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [isSuccess, setIsSuccess] = useState(false)
  const [capturedOrderId, setCapturedOrderId] = useState<string | null>(null)
  const [purchasedItems, setPurchasedItems] = useState<CartItem[]>([])
  const [downloadError, setDownloadError] = useState<string | null>(null)
  const [downloadingPhotoId, setDownloadingPhotoId] = useState<string | null>(
    null
  )

  const handleAddToCart = (photo: Photo) => {
    // Default to high quality tier
    const tier = getDefaultCartTier()
    const exists = cart.some(
      (item) => item.photoId === photo.id && item.quality === tier.id
    )

    if (exists) {
      toast.add({ title: "Already in cart", type: "info" })
    } else {
      addToCart(photo, tier.id, tier.label, tier.price)
      toast.add({ title: "Added to cart", type: "success" })
    }
  }

  const fromPath = searchParams.get("from")

  const breadcrumbs = useMemo<BreadcrumbItem[]>(() => {
    const items: BreadcrumbItem[] = []

    if (fromPath) {
      const decoded = decodeURIComponent(fromPath)
      // Handle /event/:id
      if (decoded.includes("/event/")) {
        const eventId = decoded.split("/event/")[1]?.split("?")[0]
        const event = COMPETITIONS.find((c) => c.id === eventId)
        if (event) {
          items.push({ label: event.name, onClick: () => navigate(decoded) })
        } else {
          items.push({ label: "Events", onClick: () => navigate("/") })
        }
      }
      // Handle /photo/:id
      else if (decoded.includes("/photo/")) {
        items.push({
          label: "Photo detail",
          onClick: () => navigate(decoded),
        })
      }
      // Handle /photographer/:id
      else if (decoded.includes("/photographer/")) {
        items.push({ label: "Photographer", onClick: () => navigate(decoded) })
      } else {
        items.push({ label: "Events", onClick: () => navigate("/") })
      }
    } else {
      items.push({ label: "Events", onClick: () => navigate("/") })
    }

    items.push({ label: "Cart", active: true })
    return items
  }, [fromPath, navigate])

  const handlePay = (order?: CheckoutOrder) => {
    setPurchasedItems(cart)
    setCapturedOrderId(order?.id ?? null)
    setDownloadError(null)
    setIsSuccess(true)
    clearCart()
  }

  const handleDownload = async (item: CartItem) => {
    if (!capturedOrderId) {
      setDownloadError(
        "Download is not ready yet. Please try again in a moment."
      )
      return
    }

    setDownloadingPhotoId(item.photoId)
    setDownloadError(null)

    try {
      const download = await api.createPhotoDownload(
        item.photoId,
        capturedOrderId
      )
      window.location.assign(download.url)
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Could not prepare the download."
      setDownloadError(message)
    } finally {
      setDownloadingPhotoId(null)
    }
  }

  const checkoutLineItems = useMemo<CheckoutLineItem[]>(
    () =>
      cart.map((item) => {
        const amount = Math.round(item.price * 100)
        return {
          name: `${item.photo.rider} / ${item.photo.horse} - ${item.qualityLabel}`,
          quantity: 1,
          unit_price: amount,
          total_amount: amount,
          reference: item.photoId,
          type: "digital",
          tax_rate: 0,
          total_tax_amount: 0,
          photo_id: item.photoId,
          quality: item.quality,
        }
      }),
    [cart]
  )

  // develop: recently viewed came from mock photos; empty until there is an API for it
  const recentPhotos = useMemo<Photo[]>(() => [], [])

  const recentlyViewed = (
    <RecentlyViewed
      photos={recentPhotos}
      onOpen={(photo) =>
        navigate(`/photo/${photo.id}?from=cart&eventId=${photo.eventId}`)
      }
      onAddToCart={handleAddToCart}
    />
  )

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <div>
        <Breadcrumbs items={breadcrumbs} />
        {!isSuccess && (
          <div className="border-b bg-card pb-6 max-md:pb-5">
            <div className="container">
              <h1 className="text-[1.75rem] leading-[1.2] font-extrabold text-foreground max-md:text-[1.375rem]">
                Cart
              </h1>
            </div>
          </div>
        )}
      </div>

      <main className="flex-1 pt-10 pb-20 max-md:pt-6 max-md:pb-15">
        <div className="container">
          {isSuccess ? (
            <div className="flex flex-col gap-15">
              <div className="flex justify-center py-15">
                <Card className="w-full max-w-125 gap-0 rounded-3xl px-10 py-15 text-center shadow-[0_10px_40px_rgba(0,0,0,0.05)]">
                  <div className="mx-auto mb-8 flex size-25 items-center justify-center rounded-full bg-success/10 text-success">
                    <Check className="size-16" />
                  </div>
                  <h1 className="mb-4 text-[2rem] font-extrabold">
                    Payment Successful!
                  </h1>
                  <p className="mb-10 leading-[1.6] text-muted-foreground">
                    Thank you for your purchase. Your Gallopics receipt has been
                    sent by email, and your download links are ready.
                  </p>
                  {capturedOrderId && (
                    <p className="mb-6 text-xs break-all text-muted-foreground">
                      Order ID: {capturedOrderId}
                    </p>
                  )}

                  {purchasedItems.length > 0 && (
                    <div className="mb-8 flex flex-col gap-3 text-left">
                      {purchasedItems.map((item) => (
                        <div
                          key={item.cartId}
                          className="flex items-center justify-between gap-4 rounded-xl border p-3"
                        >
                          <div className="min-w-0">
                            <div className="truncate text-sm font-semibold text-foreground">
                              {item.photo.rider} / {item.photo.horse}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {item.qualityLabel}
                            </div>
                          </div>
                          <Button
                            size="sm"
                            className="shrink-0 bg-black hover:bg-foreground"
                            onClick={() => handleDownload(item)}
                            disabled={downloadingPhotoId === item.photoId}
                          >
                            {downloadingPhotoId === item.photoId
                              ? "Preparing"
                              : "Download"}
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}

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
                </Card>
              </div>
              {recentlyViewed}
            </div>
          ) : cart.length === 0 ? (
            <div className="flex flex-col gap-15">
              <div className="mx-auto max-w-120 py-24 text-center">
                <div className="mb-6 flex justify-center text-border">
                  <ShoppingBag className="size-13" />
                </div>
                <h2 className="mb-3 text-2xl leading-normal font-bold text-foreground">
                  Your cart is empty
                </h2>
                <p className="mb-8 leading-relaxed text-muted-foreground">
                  Browse our events to find your best moments captured on
                  camera.
                </p>
                <Button
                  className="h-13 px-8 text-base leading-normal"
                  onClick={() => navigate("/")}
                >
                  Start browsing
                </Button>
              </div>
              {recentlyViewed}
            </div>
          ) : (
            <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-[1fr_360px]">
              <div>
                <Card className="mb-6 gap-0 rounded-3xl py-0">
                  {cart.map((item) => (
                    <div
                      key={item.cartId}
                      role="link"
                      tabIndex={0}
                      onClick={() =>
                        navigate(
                          `/photo/${item.photoId}?from=cart&eventId=${item.photo.eventId}`,
                          { state: { photo: item.photo } }
                        )
                      }
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && e.target === e.currentTarget)
                          e.currentTarget.click()
                      }}
                      className="flex cursor-pointer gap-6 border-b p-6 transition-all duration-200 outline-none last:border-b-0 hover:z-1 hover:-translate-y-0.5 hover:border-transparent hover:bg-muted hover:shadow-[0_4px_12px_rgba(0,0,0,0.04)] focus-visible:bg-muted max-sm:flex-col max-sm:gap-4"
                    >
                      <div className="h-22.5 w-30 shrink-0 overflow-hidden rounded-xl bg-muted max-sm:h-45 max-sm:w-full">
                        <img
                          src={item.photo.src}
                          alt={item.photo.rider}
                          className="size-full object-cover"
                        />
                      </div>
                      <div className="flex flex-1 justify-between max-sm:flex-col max-sm:gap-4">
                        <div className="flex flex-col gap-1">
                          <div className="text-xs font-bold tracking-[0.05em] text-muted-foreground">
                            #{item.photoId.toUpperCase()}
                          </div>
                          <h3 className="text-base font-bold text-foreground">
                            {item.photo.rider} / {item.photo.horse}
                          </h3>
                          <div className="text-[0.8125rem] text-muted-foreground">
                            {item.photo.event}
                          </div>
                          <Badge
                            variant="secondary"
                            className="mt-1 h-auto rounded-sm px-2 py-0.5 font-normal"
                          >
                            {item.qualityLabel}
                          </Badge>
                        </div>
                        <div
                          className="flex flex-col items-end justify-between max-sm:flex-row max-sm:items-center"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="text-lg font-bold text-foreground">
                            {item.price} SEK
                          </div>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            aria-label="Remove item"
                            className="rounded-lg text-destructive hover:bg-destructive/8 hover:text-destructive"
                            onClick={() => removeFromCart(item.cartId)}
                          >
                            <Trash2 className="size-4.5" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </Card>
                <Button
                  variant="ghost"
                  className="h-auto px-0 py-2 hover:bg-transparent"
                  onClick={() =>
                    fromPath
                      ? navigate(decodeURIComponent(fromPath))
                      : navigate(-1)
                  }
                >
                  <ArrowLeft className="size-4.5" />
                  Continue browsing
                </Button>

                {recentlyViewed}
              </div>

              <div className="max-lg:order-2 max-lg:mt-6">
                <Card className="sticky top-25 gap-0 rounded-3xl p-6 max-lg:static">
                  <CheckoutPanel
                    total={total}
                    lineItems={checkoutLineItems}
                    onPaymentSuccess={handlePay}
                    onPay={() => handlePay()}
                  />
                </Card>
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer minimal />
    </div>
  )
}
