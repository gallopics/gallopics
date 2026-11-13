import { useState } from "react"
import { Link } from "react-router"
import { Check, Pencil, Plus, Share2, Trash2 } from "lucide-react"

import {
  getDefaultCartTier,
  getPhotoPrice,
  hasCustomPrices,
  QUALITY_TIERS,
  type OwnPhotoPrices,
  type PhotoPrices,
} from "@/constants/qualityTiers"
import { cn } from "@/lib/utils"
import { useCart } from "@/context/CartContext"
import type { Photo } from "@/types"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { WatermarkedThumbnail } from "@/components/WatermarkedThumbnail"

/** pgUpload: the studio's own photos (edit/delete); pgSold: the Sales page */
type PhotoCardVariant = "default" | "pgUpload" | "pgSold"

interface PhotoCardProps {
  photo: Photo
  /**
   * Makes the whole card a real link (crawlable, opens in a new tab); the
   * buttons on the card stay above it. Replaces onClick.
   */
  href?: string
  /** Router state passed with href */
  linkState?: unknown
  onClick?: (photo: Photo) => void
  onAddToCart?: (photo: Photo) => void
  variant?: PhotoCardVariant
  /** Extra details for the photographer (pg*) variants */
  pgMeta?: {
    fileName?: string
    uploadDate?: string
    timestamp?: string
    /** The photo's prices in SEK; shown as "from … SEK" (opens Edit price) */
    prices?: PhotoPrices
    ownPrices?: OwnPhotoPrices
    soldCount?: number
  }
  onRemove?: () => void
  onEdit?: (photo: Photo) => void
  onPreview?: (photo: Photo) => void
  onEditPrice?: (photo?: Photo) => void
  selectable?: boolean
  showEdit?: boolean
  showCartActions?: boolean
  /** Hide the Share button (photographer manage view) */
  showShareActions?: boolean
}

/** Round white button floating over the photo */
export function GlassButton({
  className,
  ...props
}: React.ComponentProps<typeof Button>) {
  return (
    <Button
      variant="ghost"
      size="icon"
      className={cn(
        "size-9 bg-white/95 text-[#333] shadow-[0_1px_2px_rgba(0,0,0,0.05)] transition-all hover:scale-105 hover:bg-white hover:text-black hover:shadow-[0_4px_16px_rgba(0,0,0,0.08)] [&_svg:not([class*='size-'])]:size-4.5",
        className
      )}
      {...props}
    />
  )
}

const PG_VARIANTS: PhotoCardVariant[] = ["pgUpload", "pgSold"]

export function PhotoCard({
  photo,
  href,
  linkState,
  onClick,
  onAddToCart,
  variant = "default",
  pgMeta,
  onRemove,
  onEdit,
  onPreview,
  onEditPrice,
  showEdit = true,
  showCartActions = true,
  showShareActions = true,
}: PhotoCardProps) {
  const [isLoaded, setIsLoaded] = useState(false)
  const { addToCart, removeFromCartByPhotoId, isInCart } = useCart()

  const isAdded = isInCart(photo.id)
  const isPG = PG_VARIANTS.includes(variant)

  const handleToggleCart = (e: React.MouseEvent) => {
    e.stopPropagation()

    if (isAdded) {
      removeFromCartByPhotoId(photo.id)
    } else {
      const tier = getDefaultCartTier()
      addToCart(
        photo,
        tier.id,
        tier.label,
        getPhotoPrice(photo.prices, tier.id)
      )
      onAddToCart?.(photo)
    }
  }

  const stop =
    (fn?: () => void) =>
    (e: React.MouseEvent): void => {
      e.stopPropagation()
      fn?.()
    }

  return (
    <div
      // With href, the link below takes the clicks, focus and keyboard
      {...(href
        ? {}
        : {
            tabIndex: 0,
            onClick: () => onClick?.(photo),
            onKeyDown: (e: React.KeyboardEvent) => {
              if (e.key === "Enter" && e.target === e.currentTarget)
                onClick?.(photo)
            },
          })}
      className={cn(
        "group/photo relative mb-4 block w-full [transform:translate3d(0,0,0)] cursor-pointer break-inside-avoid overflow-hidden rounded-lg border border-black/4 bg-card mask-[radial-gradient(white,black)] shadow-[0_1px_2px_rgba(0,0,0,0.02)] transition-[translate,box-shadow] duration-200 ease-[cubic-bezier(0.2,0,0.2,1)] outline-none hover:shadow-[0_4px_16px_rgba(0,0,0,0.08)] focus-visible:ring-4 focus-visible:ring-ring/12",
        // Same focus ring when the card's link has keyboard focus
        href &&
          "has-[>a:focus-visible]:ring-4 has-[>a:focus-visible]:ring-ring/12",
        isPG && "hover:-translate-y-0.5"
      )}
    >
      {href && (
        // Covers the card (photo + details) under the buttons (z-30)
        <Link
          to={href}
          state={linkState}
          aria-label={
            [photo.rider, photo.horse].filter(Boolean).join(" on ") ||
            "View photo"
          }
          className="absolute inset-0 z-20 outline-none"
        />
      )}
      <div
        className="relative block w-full bg-muted"
        style={{ aspectRatio: `${photo.width}/${photo.height}` }}
        onClick={(e) => {
          if (onPreview) {
            e.stopPropagation()
            onPreview(photo)
          }
        }}
      >
        <WatermarkedThumbnail
          src={photo.src}
          alt={
            [photo.rider, photo.horse].filter(Boolean).join(" on ") ||
            "Event photo"
          }
          onLoad={() => setIsLoaded(true)}
          className={cn(
            // Tailwind v4 `scale-*` sets `scale`, not `transform`
            "transition-[opacity,scale] duration-500 ease-[cubic-bezier(0.2,0,0.2,1)] will-change-[scale] group-hover/photo:scale-[1.04]",
            isLoaded ? "opacity-100" : "opacity-0"
          )}
        />

        {variant === "default" && (
          <>
            {/* Darken slightly on hover */}
            <div className="pointer-events-none absolute inset-0 z-10 bg-[linear-gradient(to_bottom,rgba(0,0,0,0.02)_0%,rgba(0,0,0,0.1)_100%)] opacity-0 transition-opacity duration-300 group-hover/photo:opacity-100" />

            {/* Event info sliding up from the bottom (desktop) */}
            <div className="pointer-events-none absolute inset-x-0 bottom-0 z-25 translate-y-2.5 bg-[linear-gradient(to_top,rgba(0,0,0,0.8)_0%,rgba(0,0,0,0.4)_60%,transparent_100%)] px-2 pt-4 pb-2 opacity-0 transition-[translate,opacity] duration-300 ease-[cubic-bezier(0.2,0,0.2,1)] group-hover/photo:translate-y-0 group-hover/photo:opacity-100 max-md:hidden">
              <div className="mb-1 text-[0.8125rem] leading-[1.2] font-semibold text-white [text-shadow:0_1px_3px_rgba(0,0,0,0.3)]">
                {photo.event}
              </div>
              <div className="flex items-center gap-1.5 text-xs leading-normal text-white/85">
                <span>🇸🇪</span> {photo.city}
                <span className="text-[0.7em] opacity-60">•</span>
                {new Date(photo.date).toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "short",
                })}{" "}
                {photo.time}
              </div>
            </div>

            {/* Share + cart (top-right); on mobile only cart, always visible */}
            <div className="absolute top-3 right-3 z-30 flex -translate-y-1 flex-col gap-2 opacity-0 transition-[translate,opacity] duration-200 group-focus-within/photo:translate-y-0 group-focus-within/photo:opacity-100 group-hover/photo:translate-y-0 group-hover/photo:opacity-100 max-md:top-2 max-md:right-2 max-md:translate-y-0 max-md:opacity-100">
              {showShareActions && (
                <GlassButton
                  title="Share"
                  aria-label="Share"
                  onClick={stop()}
                  className="max-md:hidden"
                >
                  <Share2 />
                </GlassButton>
              )}
              {showCartActions && (
                <GlassButton
                  title={isAdded ? "Remove from cart" : "Add to cart"}
                  aria-label={isAdded ? "Remove from cart" : "Add to cart"}
                  onClick={handleToggleCart}
                  className={cn(
                    "max-md:size-11 max-md:bg-white/90 max-md:shadow-[0_2px_8px_rgba(0,0,0,0.1)]",
                    isAdded &&
                      "bg-success text-white shadow-none hover:bg-destructive hover:text-white max-md:bg-success"
                  )}
                >
                  {isAdded ? <Check /> : <Plus />}
                </GlassButton>
              )}
            </div>
          </>
        )}

        {/* Shown on hover; always on touch screens, which have no hover */}
        {variant === "pgUpload" && (
          <div className="pointer-events-none absolute top-3 right-3 z-30 flex flex-col gap-2 opacity-0 transition-all duration-200 group-hover/photo:pointer-events-auto group-hover/photo:opacity-100 pointer-coarse:pointer-events-auto pointer-coarse:opacity-100">
            {showEdit && (
              <GlassButton
                title="Edit details"
                aria-label="Edit details"
                onClick={stop(() => onEdit?.(photo))}
              >
                <Pencil />
              </GlassButton>
            )}
            <GlassButton
              title="Delete photo"
              aria-label="Delete photo"
              onClick={stop(onRemove)}
              className="hover:bg-destructive/12 hover:text-destructive"
            >
              <Trash2 />
            </GlassButton>
          </div>
        )}
      </div>

      <PhotoCardFooter
        photo={photo}
        variant={variant}
        pgMeta={pgMeta}
        onEditPrice={onEditPrice}
      />
    </div>
  )
}

function PhotoCardFooter({
  photo,
  variant,
  pgMeta,
  onEditPrice,
}: Pick<PhotoCardProps, "photo" | "pgMeta" | "onEditPrice"> & {
  variant: PhotoCardVariant
}) {
  if (!PG_VARIANTS.includes(variant)) {
    return (
      <div className="relative z-2 bg-card px-4 pt-2 pb-4">
        <div className="flex flex-col gap-0.5">
          <h3 className="text-[0.8125rem] leading-[1.2] font-semibold text-foreground">
            {photo.rider || photo.horse || "Event photo"}
          </h3>
          {photo.rider && photo.horse && (
            <span className="text-xs leading-normal text-muted-foreground">
              {photo.horse}
            </span>
          )}
        </div>
      </div>
    )
  }

  if (!pgMeta) return null

  const isMatchedValue = (value?: string) =>
    Boolean(
      value && !["unknown", "unassigned", "none"].includes(value.toLowerCase())
    )
  const matchedRider = isMatchedValue(photo.rider) ? photo.rider : undefined
  const matchedHorse = isMatchedValue(photo.horse) ? photo.horse : undefined

  // File name (or rider/horse) + sold count + lowest price
  const { prices } = pgMeta
  const soldCount = pgMeta.soldCount || 0
  const priceSummary =
    prices &&
    `${hasCustomPrices(pgMeta.ownPrices ?? photo.ownPrices) ? "Own prices" : "Default prices"}: ${QUALITY_TIERS.map(
      (tier) => `${tier.label} ${prices[tier.id]} SEK`
    ).join(" · ")}`

  return (
    <div className="flex w-full items-center justify-between bg-card p-3">
      {/* develop: matched rider (+ horse) instead of the file name */}
      <div className="flex min-w-0 flex-1 flex-col gap-px">
        <div className="truncate text-[0.8125rem] leading-[1.35] font-semibold text-foreground">
          {matchedRider || matchedHorse || pgMeta.fileName || "Untitled"}
        </div>
        {matchedRider && matchedHorse && (
          <div className="truncate text-xs leading-[1.35] text-muted-foreground">
            {matchedHorse}
          </div>
        )}
      </div>
      <div className="flex items-center gap-1.5 pl-2">
        {soldCount > 0 && (
          <Badge
            variant="success"
            title={`Sold: ${soldCount}`}
            className="h-auto rounded-sm border-success/20 bg-success/8 px-1.5 py-0.5 text-[0.6875rem] leading-none font-bold"
          >
            {soldCount}
          </Badge>
        )}
        {prices && (
          <button
            type="button"
            aria-label={`Edit price. ${priceSummary}`}
            title={priceSummary}
            disabled={!onEditPrice}
            onClick={(e) => {
              e.stopPropagation()
              onEditPrice?.(photo)
            }}
            className="rounded-sm bg-muted px-1.5 py-0.5 text-[0.6875rem] leading-none font-semibold whitespace-nowrap text-muted-foreground transition-colors outline-none hover:bg-border hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50 disabled:pointer-events-none"
          >
            from {Math.min(...Object.values(prices))} SEK
          </button>
        )}
      </div>
    </div>
  )
}

/** Loading placeholder shaped like a PhotoCard (for MasonryGrid and grids) */
export function PhotoCardSkeleton({
  pg = false,
  landscape = false,
}: {
  /** Studio card: one-line footer (file name / rider) */
  pg?: boolean
  /** 3:2 photo instead of 3:4 */
  landscape?: boolean
}) {
  return (
    <div
      aria-hidden="true"
      className="mb-4 break-inside-avoid overflow-hidden rounded-lg border border-black/4 bg-card"
    >
      <Skeleton
        className={cn("rounded-none", landscape ? "aspect-3/2" : "aspect-3/4")}
      />
      {/* Same text lines as the footer, so the card keeps its height */}
      {pg ? (
        <div className="p-3 text-[0.8125rem] leading-[1.35]">
          <Skeleton className="inline-block h-[1em] w-[60%] rounded-sm bg-border align-middle" />
        </div>
      ) : (
        <div className="flex flex-col gap-0.5 px-4 pt-2 pb-4">
          <div className="text-[0.8125rem] leading-[1.2]">
            <Skeleton className="inline-block h-[1em] w-[70%] rounded-sm bg-border align-middle" />
          </div>
          <div className="text-xs leading-normal">
            <Skeleton className="inline-block h-[1em] w-[40%] rounded-sm bg-border align-middle" />
          </div>
        </div>
      )}
    </div>
  )
}
