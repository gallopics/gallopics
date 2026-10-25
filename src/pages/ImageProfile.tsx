import { useEffect, useMemo, useState } from "react"
import {
  useLocation,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router"
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog"
import { useQuery } from "@tanstack/react-query"
import { Check, ChevronLeft, ShoppingBag, X, Zap } from "lucide-react"

import { getPriceByTierId, QUALITY_TIERS } from "@/constants/qualityTiers"
import { cn } from "@/lib/utils"
import { useCart } from "@/context/CartContext"
import {
  resolveApiAssetUrl,
  type ApiPhoto,
  type CheckoutItem,
} from "@/data/apiClient"
import { COMPETITIONS, HORSES, PHOTOGRAPHERS, RIDERS } from "@/data/mockData"
import {
  photoQueryOptions,
  publicPhotographerQueryOptions,
} from "@/data/queries/photos"
import type { Photo } from "@/types"
import { Button } from "@/components/ui/button"
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

const getPrice = (quality: string) => getPriceByTierId(quality)

/** A public photo as the photo page shows it */
const toPagePhoto = (photo: ApiPhoto): Photo => ({
  id: photo.id,
  src:
    resolveApiAssetUrl(`/api/v1/photographer/photos/${photo.id}/preview`) || "",
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
  price: photo.price,
})

const isUuid = (value: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  )

export function ImageProfile() {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const [selectedQuality, setSelectedQuality] = useState("web")
  const { cart, addToCart, removeFromCartByPhotoId } = useCart()
  const [showCheckout, setShowCheckout] = useState(false)
  const [isFullScreen, setIsFullScreen] = useState(false)
  const [isSupportModalOpen, setIsSupportModalOpen] = useState(false)

  const from = searchParams.get("from")
  const eventIdParam = searchParams.get("eventId")
  const routePhoto =
    typeof location.state === "object" &&
    location.state !== null &&
    "photo" in location.state
      ? (location.state.photo as Photo)
      : null
  const eventReturnState =
    typeof location.state === "object" &&
    location.state !== null &&
    "eventReturnState" in location.state
      ? (location.state.eventReturnState as Record<string, unknown>)
      : undefined
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
  const apiPhoto = photoQuery.data ?? null
  // First load only; a photo passed from the previous page shows at once
  const isLoadingPhoto = !!id && !routePhoto && photoQuery.isPending

  // develop: an empty placeholder instead of a mock photo when not found
  const photo = useMemo<Photo>(
    () =>
      apiPhoto ||
      routePhoto || {
        id: id || "",
        src: "",
        rider: "Unassigned",
        horse: "Uploaded photo",
        event: "Event",
        eventId: eventIdParam || "",
        date: "",
        width: 600,
        height: 800,
        className: "Uploaded",
        time: "",
        city: "",
        arena: "",
        countryCode: "se",
        discipline: "",
        photographer: "Gallopics",
        photographerId: "",
      },
    [apiPhoto, eventIdParam, id, routePhoto]
  )
  const { data: apiPhotographer = null } = useQuery({
    ...publicPhotographerQueryOptions(photo.photographerId ?? ""),
    enabled: !!photo.photographerId && isUuid(photo.photographerId),
  })
  const event = useMemo(
    () => COMPETITIONS.find((c) => c.id === photo.eventId),
    [photo.eventId]
  )
  const photographer = useMemo(() => {
    const p =
      PHOTOGRAPHERS.find((pg) => pg.primaryEventId === photo.eventId) ||
      PHOTOGRAPHERS[0]
    return p
  }, [photo.eventId])
  const displayedPhotographer = useMemo(() => {
    const hasMockPhotographer = Boolean(
      !isUuid(photo.photographerId || "") &&
      photo.photographer &&
      photo.photographer !== "Gallopics"
    )
    const fallbackName: string =
      hasMockPhotographer && photo.photographer
        ? photo.photographer
        : photo.photographer || "Gallopics"
    // develop: no local avatar images any more
    const fallbackAvatarUrl = undefined

    return {
      id:
        apiPhotographer?.slug ||
        apiPhotographer?.id ||
        photo.photographerId ||
        photographer.id,
      name: apiPhotographer?.display_name || fallbackName,
      avatarUrl:
        resolveApiAssetUrl(apiPhotographer?.avatar_url) || fallbackAvatarUrl,
    }
  }, [apiPhotographer, photo.photographer, photo.photographerId, photographer])

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
    if (!apiPhoto && !routePhoto) return
    if (!photo.id) return
    const saved = localStorage.getItem("gallopics_recent")
    let recent: string[] = saved ? JSON.parse(saved) : []

    // Move current to front, limit to 8
    recent = [photo.id, ...recent.filter((i) => i !== photo.id)].slice(0, 8)
    localStorage.setItem("gallopics_recent", JSON.stringify(recent))
  }, [photo.id])

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
  }, [from, eventIdParam, photo, navigate, showCheckout])

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

  if (isLoadingPhoto)
    return <ImageProfileSkeleton showPurchase={!isOwnerProfilePhoto} />

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
                    <InfoChip
                      label="Rider"
                      name={photo.rider}
                      variant="rider"
                      onClick={() => {
                        const riderData = RIDERS.find(
                          (r) => `${r.firstName} ${r.lastName}` === photo.rider
                        )
                        const rId = riderData ? riderData.id : "r1"
                        navigate(`/rider/${rId}?from=photo&photoId=${photo.id}`)
                      }}
                    />
                    <InfoChip
                      label="Horse"
                      name={photo.horse}
                      variant="horse"
                      onClick={() => {
                        const horseData = HORSES.find(
                          (h) => h.name === photo.horse
                        )
                        const hId = horseData ? horseData.id : "h1"
                        navigate(`/horse/${hId}?from=photo&photoId=${photo.id}`)
                      }}
                    />
                    <InfoChip
                      label="Photographer"
                      name={displayedPhotographer.name}
                      variant="photographer"
                      avatarUrl={displayedPhotographer.avatarUrl}
                      onClick={() =>
                        navigate(
                          `/photographer/${displayedPhotographer.id}?from=ipro&eventId=${photo.eventId}`
                        )
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
                        {getPrice(selectedQuality)} SEK
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
                          onClick={() => setShowCheckout(true)}
                        >
                          Buy now
                        </Button>
                        <Button
                          variant="outline"
                          size="lg"
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
                                getPrice(selectedQuality)
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
                        total={getPrice(selectedQuality)}
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
                    <Button
                      variant="link"
                      // wraps onto several lines like the old details row
                      className="h-auto border-0 p-0 text-right text-sm leading-normal whitespace-normal underline"
                      onClick={() => navigate(`/event/${photo.eventId}`)}
                    >
                      {photo.event}
                    </Button>
                  </DetailRow>
                  {/* Placeholder values below are hard-coded in the old app too */}
                  <DetailRow label="Club">Stockholms Ryttarförening</DetailRow>
                  <DetailRow label="Orientation">
                    {detectedPortrait ? "Portrait" : "Landscape"}
                  </DetailRow>
                  <DetailRow label="Class">1.20m</DetailRow>
                  <DetailRow label="Time">12 Jun 2026 • 14:24</DetailRow>
                  <DetailRow label="City">🇸🇪 {event?.city}</DetailRow>
                  <DetailRow label="Venue">Main Arena</DetailRow>
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
