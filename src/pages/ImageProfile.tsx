import { useEffect, useMemo, useState } from "react"
import {
  Link,
  useLocation,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router"
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog"
import { useQuery } from "@tanstack/react-query"
import { Check, ChevronLeft, ShoppingBag, X, Zap } from "lucide-react"

import {
  getPhotoPrice,
  QUALITY_TIERS,
  toSekPrices,
} from "@/constants/qualityTiers"
import { cn } from "@/lib/utils"
import { useCart } from "@/context/CartContext"
import {
  ApiError,
  getApiPhotoPreviewUrl,
  resolveApiAssetUrl,
  type ApiPhoto,
  type CheckoutItem,
} from "@/data/apiClient"
import { eventQueryOptions } from "@/data/queries/events"
import {
  photoQueryOptions,
  publicPhotographerQueryOptions,
} from "@/data/queries/photos"
import type { Photo } from "@/types"
import { Button, buttonVariants } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { Breadcrumbs, BreadcrumbsSkeleton } from "@/components/Breadcrumbs"
import type { BreadcrumbItem } from "@/components/Breadcrumbs"
import { CheckoutPanel } from "@/components/CheckoutPanel"
import { ContactSupportModal } from "@/components/ContactSupportModal"
import { Footer } from "@/components/Footer"
import { Header } from "@/components/Header"
import { InfoChip } from "@/components/InfoChip"
import { ModernDropdown } from "@/components/ModernDropdown"
import { PageState } from "@/components/PageState"
import { WatermarkedPhotoPreview } from "@/components/WatermarkedPhotoPreview"

/** One label/value row in the Details card */
function DetailRow({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="flex justify-between gap-4 text-sm leading-normal">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium text-foreground">{children}</span>
    </div>
  )
}

/** A public photo as the photo page shows it */
const toPagePhoto = (photo: ApiPhoto): Photo => ({
  id: photo.id,
  src: getApiPhotoPreviewUrl(photo),
  rider: photo.tags.find((tag) => tag.type === "rider")?.value || "Unassigned",
  horse:
    photo.tags.find((tag) => tag.type === "horse")?.value ||
    photo.class_name ||
    "Uploaded photo",
  event: photo.event_class_name || photo.class_name || "Event",
  eventId: photo.event_id,
  date: new Date(photo.created_at).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  }),
  width: 600,
  height: 800,
  className: photo.class_name || "Uploaded",
  time: new Date(photo.created_at).toLocaleTimeString().slice(0, 5),
  city: "Sweden",
  arena: photo.class_name || "Uploaded",
  countryCode: "se",
  photographer: photo.photographer_display_name || "Gallopics",
  photographerId: photo.photographer_id,
  prices: toSekPrices(photo.prices),
})

const isUuid = (value: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  )

export function ImageProfile() {
  const { id } = useParams()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const routePhoto =
    typeof location.state === "object" &&
    location.state !== null &&
    "photo" in location.state
      ? (location.state.photo as Photo)
      : null
  const isOwnerProfilePhoto =
    searchParams.get("owner") === "1" ||
    (typeof location.state === "object" &&
      location.state !== null &&
      "isOwnerProfile" in location.state &&
      location.state.isOwnerProfile === true)
  const photoQuery = useQuery({
    ...photoQueryOptions(id ?? ""),
    enabled: !!id,
    select: toPagePhoto,
  })
  const matchingRoutePhoto = routePhoto?.id === id ? routePhoto : null
  // An owner's processing photo may not be available from the public API yet.
  const hasOwnerPreview = isOwnerProfilePhoto && !!matchingRoutePhoto
  const photo =
    photoQuery.data ??
    (photoQuery.isPending || hasOwnerPreview ? matchingRoutePhoto : null)

  const notFound =
    photoQuery.error instanceof ApiError && photoQuery.error.status === 404
  // A failed refetch keeps the loaded photo; a 404 still means it is gone
  const hasPhotoError = photoQuery.isError && (!photoQuery.data || notFound)

  if (
    (hasPhotoError && !hasOwnerPreview) ||
    (!photo && !photoQuery.isPending)
  ) {
    return (
      <PageState
        title={notFound ? "Photo not found" : "Photo could not be loaded"}
        description={
          notFound
            ? "This photo is no longer available. Browse events to find another photo."
            : "We couldn't load this photo. Please try again."
        }
        onRetry={
          notFound
            ? undefined
            : () => {
                void photoQuery.refetch()
              }
        }
        retrying={photoQuery.isFetching}
      />
    )
  }

  if (!photo) {
    return <ImageProfileSkeleton showPurchase={!isOwnerProfilePhoto} />
  }

  return (
    <ImageProfileContent
      key={id}
      photo={photo}
      isOwnerProfilePhoto={isOwnerProfilePhoto}
      canPurchase={!!photoQuery.data}
    />
  )
}

function ImageProfileContent({
  photo,
  isOwnerProfilePhoto,
  canPurchase,
}: {
  photo: Photo
  isOwnerProfilePhoto: boolean
  canPurchase: boolean
}) {
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const [selectedQuality, setSelectedQuality] = useState("web")
  const price = getPhotoPrice(photo.prices, selectedQuality)
  const { cart, addToCart, removeFromCartByPhotoId } = useCart()
  const [showCheckout, setShowCheckout] = useState(false)
  const [isFullScreen, setIsFullScreen] = useState(false)
  const [isSupportModalOpen, setIsSupportModalOpen] = useState(false)
  const from = searchParams.get("from")
  const eventIdParam = searchParams.get("eventId")
  const eventReturnState =
    typeof location.state === "object" &&
    location.state !== null &&
    "eventReturnState" in location.state
      ? (location.state.eventReturnState as Record<string, unknown>)
      : undefined
  const { data: apiPhotographer = null } = useQuery({
    ...publicPhotographerQueryOptions(photo.photographerId ?? ""),
    enabled: !!photo.photographerId && isUuid(photo.photographerId),
  })
  // Same cache entry as the page query, without the page mapping
  const { data: apiPhoto } = useQuery({
    ...photoQueryOptions(photo.id),
    enabled: canPurchase,
  })
  const eventQuery = useQuery({
    ...eventQueryOptions(photo.eventId),
    enabled: isUuid(photo.eventId),
  })
  const event = eventQuery.data
  const takenAt = apiPhoto?.taken_at ? new Date(apiPhoto.taken_at) : null
  const displayedPhotographer = {
    id: apiPhotographer?.slug || apiPhotographer?.id || photo.photographerId,
    name: apiPhotographer?.display_name || photo.photographer || "Gallopics",
    avatarUrl: resolveApiAssetUrl(apiPhotographer?.avatar_url) || undefined,
  }

  // The loaded image's real orientation; until then the photo's stated size
  const orientationKey = `${photo.id}:${photo.width}x${photo.height}`
  const [loadedOrientation, setLoadedOrientation] = useState<{
    key: string
    portrait: boolean
  } | null>(null)
  const detectedPortrait =
    loadedOrientation?.key === orientationKey
      ? loadedOrientation.portrait
      : photo.height > photo.width
  const setDetectedPortrait = (portrait: boolean) =>
    setLoadedOrientation({ key: orientationKey, portrait })

  // Check if current selection is in cart
  const isInCart = useMemo(() => {
    return cart.some(
      (item) => item.photoId === photo.id && item.quality === selectedQuality
    )
  }, [cart, photo.id, selectedQuality])

  const checkoutItems = useMemo<CheckoutItem[]>(
    () => [{ photo_id: photo.id, quality: selectedQuality }],
    [photo.id, selectedQuality]
  )

  // Track recently viewed (real photos only)
  useEffect(() => {
    if (!canPurchase) return
    if (!photo.id) return
    const saved = localStorage.getItem("gallopics_recent")
    let recent: string[] = saved ? JSON.parse(saved) : []

    // Move current to front, limit to 8
    recent = [photo.id, ...recent.filter((i) => i !== photo.id)].slice(0, 8)
    localStorage.setItem("gallopics_recent", JSON.stringify(recent))
  }, [photo.id, canPurchase])

  const breadcrumbs = useMemo<BreadcrumbItem[]>(() => {
    const items: BreadcrumbItem[] = []

    if (from === "epro" && eventIdParam) {
      items.push({
        label: photo.event,
        onClick: () =>
          navigate(
            `/event/${eventIdParam}`,
            eventReturnState ? { state: eventReturnState } : undefined
          ),
      })
    } else if (from === "ppro") {
      items.push({ label: "Back to photos", onClick: () => navigate(-1) })
    } else if (from === "cart") {
      items.push({ label: "Cart", onClick: () => navigate(-1) })
    } else {
      items.push({ label: "Events", onClick: () => navigate("/") })
    }

    if (showCheckout) {
      items.push({
        label: "Photo detail",
        onClick: () => setShowCheckout(false),
      })
      items.push({ label: "Checkout", active: true })
    } else {
      items.push({ label: "Photo detail", active: true })
    }

    return items
  }, [from, eventIdParam, photo, navigate, showCheckout, eventReturnState])

  // Quality Selector Options
  const qualityOptions = useMemo(() => {
    return QUALITY_TIERS.map((tier) => ({
      label: tier.label,
      value: tier.id,
      subtext:
        tier.id === "web"
          ? detectedPortrait
            ? "Portrait: 720×1080"
            : "Landscape: 1080×720"
          : tier.id === "high" || tier.id === "commercial"
            ? detectedPortrait
              ? "Portrait: 4000×6000"
              : "Landscape: 6000×4000"
            : "",
      description: tier.description,
    }))
  }, [detectedPortrait])

  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden max-md:relative max-md:w-full max-md:max-w-[100vw]">
      <Header />

      <Breadcrumbs items={breadcrumbs} />

      <main className="pt-6 pb-15 max-md:pt-3 max-md:pb-10">
        <div className="container">
          <div className="flex items-start gap-6 max-lg:flex-col">
            {/* Photo viewer */}
            <div className="min-w-0 flex-1">
              <Card className="gap-0 rounded-3xl py-0 shadow-[0_1px_2px_rgba(0,0,0,0.02)] max-md:rounded-xl">
                <button
                  type="button"
                  aria-label="View full screen"
                  onClick={() => setIsFullScreen(true)}
                  className="flex aspect-3/2 min-h-100 w-full cursor-zoom-in items-center justify-center bg-muted max-md:min-h-0 max-md:p-4"
                >
                  <WatermarkedPhotoPreview
                    src={photo.src || undefined}
                    alt={photo.rider}
                    onLoad={(e) => {
                      const img = e.currentTarget
                      setDetectedPortrait(img.naturalHeight > img.naturalWidth)
                    }}
                  />
                </button>

                <div className="flex w-full items-start justify-between gap-3 border-t border-black/5 px-6 py-4 max-md:px-4">
                  <div className="flex min-w-0 flex-1 flex-wrap items-start gap-2">
                    {/* No rider / horse pages yet: plain names */}
                    <InfoChip
                      label="Rider"
                      name={photo.rider}
                      variant="rider"
                    />
                    <InfoChip
                      label="Horse"
                      name={photo.horse}
                      variant="horse"
                    />
                    <InfoChip
                      label="Photographer"
                      name={displayedPhotographer.name}
                      variant="photographer"
                      avatarUrl={displayedPhotographer.avatarUrl}
                      href={
                        displayedPhotographer.id
                          ? `/photographer/${displayedPhotographer.id}?from=ipro&eventId=${photo.eventId}`
                          : undefined
                      }
                    />
                  </div>

                  {/* develop: prev/next and share hidden */}
                </div>
              </Card>
            </div>

            {/* Purchase + details */}
            <div className="sticky top-25 flex w-90 shrink-0 flex-col gap-4 max-lg:static max-lg:w-full">
              {!isOwnerProfilePhoto && (
                <Card className="gap-0 p-6 shadow-[0_1px_2px_rgba(0,0,0,0.02)] max-md:p-5">
                  {!showCheckout ? (
                    <>
                      <div className="mb-2 text-xs leading-normal font-medium text-muted-foreground">
                        #{photo.id.toUpperCase()}
                      </div>
                      <div className="mb-6 text-[2rem] leading-normal font-bold text-foreground">
                        {price} SEK
                      </div>

                      <Label className="mb-2 leading-normal">
                        Select quality
                      </Label>
                      <ModernDropdown
                        value={selectedQuality}
                        options={qualityOptions}
                        onChange={setSelectedQuality}
                        label="Quality"
                      />

                      <div className="mt-6 flex flex-col gap-3">
                        <Button
                          size="lg"
                          className="h-13 w-full text-base font-bold"
                          disabled={!canPurchase}
                          onClick={() => setShowCheckout(true)}
                        >
                          Buy now
                        </Button>
                        <Button
                          variant="outline"
                          size="lg"
                          disabled={!canPurchase}
                          className={cn(
                            // 54px like the old bordered button (Buy now is 52px)
                            "h-13.5 w-full text-base font-bold hover:border-[#ccc] hover:bg-[#fafafa]",
                            isInCart &&
                              "border-success bg-success/10 text-success hover:border-destructive hover:bg-destructive/8 hover:text-destructive"
                          )}
                          onClick={() => {
                            if (isInCart) {
                              removeFromCartByPhotoId(photo.id)
                              return
                            }
                            const selected = qualityOptions.find(
                              (o) => o.value === selectedQuality
                            )
                            if (selected) {
                              addToCart(
                                photo,
                                selectedQuality,
                                selected.label,
                                price
                              )
                            }
                          }}
                        >
                          {isInCart ? (
                            <>
                              <Check className="size-4.5" />
                              Added
                            </>
                          ) : (
                            <>
                              <ShoppingBag className="size-5" />
                              Add to cart
                            </>
                          )}
                        </Button>
                      </div>

                      <div className="mt-5 flex items-center justify-center gap-6 border-t border-muted pt-5">
                        <div className="flex items-center gap-1.5 text-xs leading-normal font-medium text-success">
                          <Check className="size-3.5" />
                          <span>Secure payment</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs leading-normal font-medium text-[#6366F1]">
                          <Zap className="size-3.5" />
                          <span>Instant download</span>
                        </div>
                      </div>

                      <p className="mt-4 text-xs leading-[1.4] text-muted-foreground">
                        Your receipt is sent by email after payment. Download
                        links are available immediately and valid for 24 hours.
                        Images are delivered as JPEG.
                      </p>

                      <Button
                        variant="link"
                        className="mt-4 h-auto w-full border-0 p-0 text-[0.8125rem] leading-normal font-normal text-muted-foreground hover:text-primary"
                        onClick={() => setIsSupportModalOpen(true)}
                      >
                        Questions? Contact support
                      </Button>
                    </>
                  ) : (
                    <div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="mb-4 -ml-2 px-2 font-normal"
                        onClick={() => setShowCheckout(false)}
                      >
                        <ChevronLeft />
                        Back to selection
                      </Button>
                      <CheckoutPanel
                        total={price}
                        items={checkoutItems}
                        cancelPath={location.pathname + location.search}
                      />
                    </div>
                  )}
                </Card>
              )}

              <Card className="gap-0 p-6 shadow-[0_1px_2px_rgba(0,0,0,0.02)] max-md:p-5">
                <h3 className="mb-4 text-base font-semibold">Details</h3>
                <div className="flex flex-col gap-3">
                  <DetailRow label="Event">
                    {/* A real link styled like the link Button */}
                    <Link
                      to={`/event/${photo.eventId}`}
                      data-slot="button"
                      // wraps onto several lines like the old details row
                      className={cn(
                        buttonVariants({
                          variant: "link",
                          className:
                            "h-auto border-0 p-0 text-right text-sm leading-normal whitespace-normal underline",
                        })
                      )}
                    >
                      {event?.name ??
                        (eventQuery.isPending && isUuid(photo.eventId) ? (
                          <Skeleton className="inline-block h-[0.8em] w-32 align-middle" />
                        ) : (
                          photo.event
                        ))}
                    </Link>
                  </DetailRow>
                  <DetailRow label="Orientation">
                    {detectedPortrait ? "Portrait" : "Landscape"}
                  </DetailRow>
                  {/* Rows without a real value are left out */}
                  {apiPhoto?.class_name && (
                    <DetailRow label="Class">{apiPhoto.class_name}</DetailRow>
                  )}
                  {takenAt && (
                    <DetailRow label="Time">
                      {takenAt.toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                      {" • "}
                      {takenAt.toLocaleTimeString("en-GB", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </DetailRow>
                  )}
                  {event?.city && (
                    <DetailRow label="City">{event.city}</DetailRow>
                  )}
                  {event?.venue_name && (
                    <DetailRow label="Venue">{event.venue_name}</DetailRow>
                  )}
                </div>
              </Card>
            </div>
          </div>
        </div>
      </main>

      <Footer minimal />

      {/* Full-screen preview */}
      <DialogPrimitive.Root open={isFullScreen} onOpenChange={setIsFullScreen}>
        <DialogPrimitive.Portal>
          <DialogPrimitive.Backdrop className="fixed inset-0 z-50 bg-black/95 duration-200 data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0" />
          <DialogPrimitive.Popup
            aria-label="Photo preview"
            className="fixed inset-0 z-50 flex touch-none items-center justify-center outline-none"
          >
            <DialogPrimitive.Close
              aria-label="Close preview"
              tabIndex={-1}
              className="absolute inset-0 cursor-default"
            />
            <DialogPrimitive.Close
              render={
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Close"
                  className="absolute top-[max(20px,env(safe-area-inset-top))] right-5 z-10 bg-white/15 text-white backdrop-blur-[10px] hover:bg-white/20 hover:text-white md:top-6 md:right-6 md:bg-white/10"
                />
              }
            >
              <X className="size-7" />
            </DialogPrimitive.Close>
            <WatermarkedPhotoPreview
              src={photo.src || undefined}
              alt={photo.rider}
              className="relative max-h-[95vh] max-w-[95vw] bg-transparent"
            />
          </DialogPrimitive.Popup>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>

      <ContactSupportModal
        isOpen={isSupportModalOpen}
        onClose={() => setIsSupportModalOpen(false)}
      />
    </div>
  )
}

// Bars sit inline in text lines, so each line keeps its real height
const bar = "inline-block h-[0.8em] rounded-sm bg-border align-middle"

/** First load: the photo, purchase and details cards as placeholders */
function ImageProfileSkeleton({ showPurchase }: { showPurchase: boolean }) {
  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden max-md:relative max-md:w-full max-md:max-w-[100vw]">
      <Header />

      <div aria-busy="true">
        <span className="sr-only">Loading photo…</span>
        <BreadcrumbsSkeleton />

        <main
          aria-hidden="true"
          className="pt-6 pb-15 max-md:pt-3 max-md:pb-10"
        >
          <div className="container">
            <div className="flex items-start gap-6 max-lg:flex-col">
              <div className="min-w-0 flex-1">
                <Card className="gap-0 rounded-3xl py-0 shadow-[0_1px_2px_rgba(0,0,0,0.02)] max-md:rounded-xl">
                  <Skeleton className="aspect-3/2 min-h-100 w-full rounded-none max-md:min-h-0" />
                  {/* Rider, horse and photographer chips */}
                  <div className="flex flex-wrap gap-2 border-t border-black/5 px-6 py-4 max-md:px-4">
                    <Skeleton className="h-12 w-36 rounded-full" />
                    <Skeleton className="h-12 w-36 rounded-full" />
                    <Skeleton className="h-12 w-40 rounded-full" />
                  </div>
                </Card>
              </div>

              <div className="flex w-90 shrink-0 flex-col gap-4 max-lg:w-full">
                {showPurchase && (
                  <Card className="gap-0 p-6 shadow-[0_1px_2px_rgba(0,0,0,0.02)] max-md:p-5">
                    <div className="mb-2 text-xs leading-normal">
                      <Skeleton className={cn(bar, "w-24")} />
                    </div>
                    <div className="mb-6 text-[2rem] leading-normal">
                      <Skeleton className={cn(bar, "w-36")} />
                    </div>
                    <div className="mb-2 text-[0.8125rem]">
                      <Skeleton className={cn(bar, "w-24")} />
                    </div>
                    {/* Quality dropdown (two-line option) and its hidden input */}
                    <Skeleton className="h-16.5 rounded-md" />
                    <div className="mt-6 flex flex-col gap-3">
                      <Skeleton className="h-13 rounded-full" />
                      <Skeleton className="h-13.5 rounded-full" />
                    </div>
                    <div className="mt-5 flex justify-center gap-6 border-t border-muted pt-5 text-xs leading-normal">
                      <div className="w-24">
                        <Skeleton className={cn(bar, "w-full")} />
                      </div>
                      <div className="w-24">
                        <Skeleton className={cn(bar, "w-full")} />
                      </div>
                    </div>
                    <div className="mt-4 text-xs leading-[1.4]">
                      <div>
                        <Skeleton className={cn(bar, "w-full")} />
                      </div>
                      <div>
                        <Skeleton className={cn(bar, "w-full")} />
                      </div>
                      <div>
                        <Skeleton className={cn(bar, "w-1/2")} />
                      </div>
                    </div>
                    <div className="mt-4 text-center text-[0.8125rem] leading-normal">
                      <Skeleton className={cn(bar, "w-40")} />
                    </div>
                  </Card>
                )}

                <Card className="gap-0 p-6 shadow-[0_1px_2px_rgba(0,0,0,0.02)] max-md:p-5">
                  <div className="mb-4 text-base">
                    <Skeleton className={cn(bar, "w-16")} />
                  </div>
                  <div className="flex flex-col gap-3">
                    {Array.from({ length: 7 }).map((_, index) => (
                      <div
                        key={index}
                        className="flex justify-between gap-4 text-sm leading-normal"
                      >
                        <div className="w-16">
                          <Skeleton className={cn(bar, "w-full")} />
                        </div>
                        <div className="w-28 text-right">
                          <Skeleton className={cn(bar, "w-full")} />
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            </div>
          </div>
        </main>
      </div>

      <Footer minimal />
    </div>
  )
}
