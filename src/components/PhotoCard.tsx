import { useState } from "react"
import { Check, Pencil, Plus, RotateCcw, Share2, Trash2 } from "lucide-react"

import { getDefaultCartTier } from "@/constants/qualityTiers"
import { cn } from "@/lib/utils"
import { useCart } from "@/context/CartContext"
import type { Photo } from "@/types"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { WatermarkedThumbnail } from "@/components/WatermarkedThumbnail"

type PhotoCardVariant =
  "default" | "pgUpload" | "pgDuplicate" | "pgPublished" | "pgArchived"

interface PhotoCardProps {
  photo: Photo
  onClick: (photo: Photo) => void
  onAddToCart?: (photo: Photo) => void
  variant?: PhotoCardVariant
  /** Extra details for the photographer (pg*) variants */
  pgMeta?: {
    fileName?: string
    photoCode?: string
    uploadDate?: string
    timestamp?: string
    priceStandard?: number
    priceHigh?: number
    priceCommercial?: number
    soldCount?: number
    totalBucketSales?: number
    /** pgDuplicate: other places this photo appears in */
    alsoIn?: string[]
    /** pgDuplicate: where this copy is stored */
    storedLocation?: string
  }
  onKeep?: () => void
  onRemove?: () => void
  onManageDuplicate?: () => void
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

const PG_VARIANTS: PhotoCardVariant[] = [
  "pgUpload",
  "pgDuplicate",
  "pgPublished",
  "pgArchived",
]

export function PhotoCard({
  photo,
  onClick,
  onAddToCart,
  variant = "default",
  pgMeta,
  onKeep,
  onRemove,
  onManageDuplicate,
  onEdit,
  onPreview,
  onEditPrice,
  showEdit = true,
  showCartActions = true,
  showShareActions = true,
}: PhotoCardProps) {
  const [isLoaded, setIsLoaded] = useState(false)
  const [dupHover, setDupHover] = useState(false)
  const { addToCart, removeFromCartByPhotoId, isInCart } = useCart()

  const isAdded = isInCart(photo.id)
  const isPG = PG_VARIANTS.includes(variant)
  const hasPgActions =
    variant === "pgUpload" ||
    variant === "pgPublished" ||
    variant === "pgArchived"

  const handleToggleCart = (e: React.MouseEvent) => {
    e.stopPropagation()

    if (isAdded) {
      removeFromCartByPhotoId(photo.id)
    } else {
      const tier = getDefaultCartTier()
      addToCart(photo, tier.id, tier.label, tier.price)
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
      tabIndex={0}
      onClick={() => onClick(photo)}
      onKeyDown={(e) => {
        if (e.key === "Enter" && e.target === e.currentTarget) onClick(photo)
      }}
      className={cn(
        "group/photo relative mb-4 block w-full [transform:translate3d(0,0,0)] cursor-pointer break-inside-avoid overflow-hidden rounded-lg border border-black/4 bg-card shadow-[0_1px_2px_rgba(0,0,0,0.02)] transition-[transform,box-shadow] duration-200 ease-[cubic-bezier(0.2,0,0.2,1)] outline-none hover:shadow-[0_4px_16px_rgba(0,0,0,0.08)] focus-visible:ring-4 focus-visible:ring-ring/12",
        isPG && "hover:-translate-y-0.5"
      )}
    >
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
          alt={`${photo.rider} on ${photo.horse}`}
          onLoad={() => setIsLoaded(true)}
          className={cn(
            "transition-[opacity,transform] duration-500 group-hover/photo:scale-[1.04]",
            isLoaded ? "opacity-100" : "opacity-0"
          )}
        />

        {variant !== "pgDuplicate" && photo.isDuplicate && (
          <Badge
            variant="destructive"
            onMouseEnter={() => setDupHover(true)}
            onMouseLeave={() => setDupHover(false)}
            onClick={stop(onManageDuplicate)}
            className="absolute right-2.5 bottom-2.5 z-30 h-auto min-w-15 cursor-pointer rounded-sm border-destructive/25 bg-[#fef2f2] px-2 py-0.75 text-[0.65rem] font-bold tracking-[0.02em] uppercase shadow-[0_1px_2px_rgba(0,0,0,0.05)]"
          >
            {dupHover ? "Manage" : "Duplicate"}
          </Badge>
        )}

        {variant === "default" && (
          <>
            {/* Darken slightly on hover */}
            <div className="pointer-events-none absolute inset-0 z-10 bg-[linear-gradient(to_bottom,rgba(0,0,0,0.02)_0%,rgba(0,0,0,0.1)_100%)] opacity-0 transition-opacity duration-300 group-hover/photo:opacity-100" />

            {/* Event info sliding up from the bottom (desktop) */}
            <div className="pointer-events-none absolute inset-x-0 bottom-0 z-25 translate-y-2.5 bg-[linear-gradient(to_top,rgba(0,0,0,0.8)_0%,rgba(0,0,0,0.4)_60%,transparent_100%)] px-2 pt-4 pb-2 opacity-0 transition-[transform,opacity] duration-300 group-hover/photo:translate-y-0 group-hover/photo:opacity-100 max-md:hidden">
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
            <div className="absolute top-3 right-3 z-30 flex -translate-y-1 flex-col gap-2 opacity-0 transition-[transform,opacity] duration-200 group-focus-within/photo:translate-y-0 group-focus-within/photo:opacity-100 group-hover/photo:translate-y-0 group-hover/photo:opacity-100 max-md:top-2 max-md:right-2 max-md:translate-y-0 max-md:opacity-100">
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

        {hasPgActions && (
          <div className="pointer-events-none absolute top-3 right-3 z-30 flex flex-col gap-2 opacity-0 transition-all duration-200 group-hover/photo:pointer-events-auto group-hover/photo:opacity-100">
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
              title={
                variant === "pgPublished" ? "Unpublish photo" : "Delete photo"
              }
              aria-label={
                variant === "pgPublished" ? "Unpublish photo" : "Delete photo"
              }
              onClick={stop(onRemove)}
              className="hover:bg-destructive/12 hover:text-destructive"
            >
              {variant === "pgPublished" ? <RotateCcw /> : <Trash2 />}
            </GlassButton>
          </div>
        )}

        {variant === "pgDuplicate" && (
          <div className="pointer-events-none absolute inset-x-3 bottom-3 flex translate-y-2 gap-2 opacity-0 transition-all duration-200 group-hover/photo:pointer-events-auto group-hover/photo:translate-y-0 group-hover/photo:opacity-100">
            <Button
              size="sm"
              variant="outline"
              onClick={stop(onKeep)}
              className="flex-1 rounded-lg border-black/10 bg-white/95 hover:border-black/10 hover:bg-white hover:shadow-[0_2px_8px_rgba(0,0,0,0.15)]"
            >
              Keep
            </Button>
            <Button
              size="sm"
              onClick={stop(onRemove)}
              className="flex-1 rounded-lg bg-destructive/90 text-white hover:bg-destructive hover:shadow-[0_2px_8px_rgba(239,68,68,0.3)]"
            >
              Remove
            </Button>
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
            {photo.rider}
          </h3>
          <span className="text-xs leading-normal text-muted-foreground">
            {photo.horse}
          </span>
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

  if (variant === "pgDuplicate") {
    return (
      <div className="flex w-full items-center justify-between gap-2 bg-card p-3">
        <span className="flex-1 truncate text-xs leading-[1.4] font-semibold">
          {pgMeta.fileName || "Untitled"}
        </span>
        {pgMeta.storedLocation && (
          <span className="shrink-0 rounded bg-muted px-1.5 py-0.5 text-[0.625rem] font-bold tracking-[0.02em] text-muted-foreground uppercase">
            {pgMeta.storedLocation}
          </span>
        )}
      </div>
    )
  }

  // Uploads, published, archived: file name + sold count + price bundle dot
  const web = pgMeta.priceStandard || 0
  const high = pgMeta.priceHigh || 0
  const commercial = pgMeta.priceCommercial || 0
  const soldCount = pgMeta.soldCount || 0
  const totalBucketSales = pgMeta.totalBucketSales || 0

  // Canonical tiers (499/999/1500) are purple, custom prices brand blue
  const isCanonical = web === 499 && high === 999 && commercial === 1500
  const bundleLabel = isCanonical ? "Canonical" : "Custom"
  const bundleClass = isCanonical
    ? "bg-[#a855f7]"
    : web > 0 || high > 0
      ? "bg-primary"
      : "bg-muted-foreground"

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
            title={`Sold: ${soldCount} · Total sales: ${totalBucketSales}`}
            className="h-auto rounded-sm border-success/20 bg-success/8 px-1.5 py-0.5 text-[0.6875rem] leading-none font-bold"
          >
            {soldCount}
          </Badge>
        )}
        <button
          type="button"
          aria-label="Edit price"
          title={`${bundleLabel}: Web ${web} / High ${high} / Commercial ${commercial}`}
          onClick={(e) => {
            e.stopPropagation()
            onEditPrice?.(photo)
          }}
          className={cn(
            "size-2 rounded-full transition-transform duration-200 ease-[cubic-bezier(0.175,0.885,0.32,1.275)] hover:scale-130",
            bundleClass
          )}
        />
      </div>
    </div>
  )
}

/** Loading placeholder shaped like a PhotoCard (for MasonryGrid) */
export function PhotoCardSkeleton() {
  return (
    <div className="mb-4 break-inside-avoid overflow-hidden rounded-lg border border-black/4 bg-card">
      <Skeleton className="aspect-3/4 rounded-none" />
      <div className="px-4 pt-2 pb-4">
        <Skeleton className="mb-1.5 h-4 w-[70%] rounded-sm bg-border" />
        <Skeleton className="h-3 w-[40%] rounded-sm bg-border" />
      </div>
    </div>
  )
}
