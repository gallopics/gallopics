import { ImageOff } from "lucide-react"

import { ALL_FOLDERS, UNCATEGORISED } from "@/lib/photoFolders"
import { cn } from "@/lib/utils"
import type { PgEvent, Photo } from "@/context/PhotographerContext"
import { getPhotoDateTime } from "@/data/eventsApi"
import type { Photo as CardPhoto } from "@/types"
import { Checkbox } from "@/components/ui/checkbox"
import { EmptyState } from "@/components/EmptyState"
import { PhotoCard, PhotoCardSkeleton } from "@/components/PhotoCard"

// develop: plain grid instead of masonry (Safari fix)
export const photoGridClass =
  "grid w-full grid-cols-[repeat(auto-fill,minmax(220px,280px))] justify-center gap-4 pb-8"

/** What the empty grid says: no search hit, an empty folder or no uploads */
export function emptyGridText(
  searchTerm: string,
  folder: string,
  canUploadPhotos: boolean
) {
  if (searchTerm)
    return {
      title: "No results found",
      description: `No photos match "${searchTerm}"`,
    }
  const title = "No photos here"
  if (folder !== ALL_FOLDERS && folder !== UNCATEGORISED)
    return {
      title,
      description:
        "This folder is empty. Select photos and use Move to... to add them.",
    }
  return {
    title,
    description: canUploadPhotos
      ? "This folder is empty. Upload photos to get started."
      : "This event is read-only because the booking was cancelled.",
  }
}

/**
 * The studio's photo cards. With nothing selected a click selects one photo
 * (Shift/Ctrl/Cmd-click adds); once something is selected, any click on a
 * card adds or removes it, so taps can multi-select on touch screens.
 */
export function PhotoGrid({
  event,
  photos,
  isLoading,
  emptyText,
  selectedIds,
  onToggleSelect,
  onEdit,
  onDelete,
  onPreview,
}: {
  event: PgEvent
  photos: Photo[]
  isLoading: boolean
  emptyText: { title: string; description: string }
  selectedIds: Set<string>
  onToggleSelect: (photo: Photo, multiSelect: boolean) => void
  onEdit: (photo: Photo, tab: "tags" | "price") => void
  onDelete: (photo: Photo) => void
  onPreview: (src: string) => void
}) {
  const selectionMode = selectedIds.size > 0
  return (
    <>
      <div aria-busy={isLoading || undefined} className={photoGridClass}>
        {isLoading && (
          <>
            <span className="sr-only">Loading photos…</span>
            {Array.from({ length: 8 }).map((_, index) => (
              <PhotoCardSkeleton key={index} pg />
            ))}
          </>
        )}
        {photos.map((photo) => {
          const isSelected = selectedIds.has(photo.id)
          return (
            <div
              key={photo.id}
              id={`photo-${photo.id}`}
              className={cn(selectableCard, isSelected && selectedCard)}
              onClick={(e) =>
                onToggleSelect(
                  photo,
                  selectionMode || e.shiftKey || e.metaKey || e.ctrlKey
                )
              }
            >
              <PhotoCard
                photo={toCardPhoto(photo, event)}
                variant="pgUpload"
                pgMeta={{
                  fileName: photo.fileName,
                  uploadDate: photo.uploadDate,
                  timestamp: photo.timestamp,
                  prices: photo.prices,
                }}
                onRemove={() => onDelete(photo)}
                onEdit={() => onEdit(photo, "tags")}
                onEditPrice={() => onEdit(photo, "price")}
                onPreview={() => onPreview(photo.url)}
                selectionMode={selectionMode}
              />
              {/* Shown on hover (always while selecting, and always on touch screens) */}
              <div
                className={cn(
                  "absolute top-2.5 left-2.5 z-10 transition-opacity duration-200 group-hover:opacity-100 pointer-coarse:opacity-100",
                  isSelected || selectionMode ? "opacity-100" : "opacity-0"
                )}
                onClick={(e) => e.stopPropagation()}
              >
                <Checkbox
                  checked={isSelected}
                  onCheckedChange={() => onToggleSelect(photo, true)}
                  aria-label="Select photo"
                  className="size-4.5 rounded-sm border-white/60 bg-white/90 shadow-sm"
                />
              </div>
            </div>
          )
        })}
      </div>

      {!isLoading && photos.length === 0 && (
        <EmptyState
          icon={<ImageOff />}
          title={emptyText.title}
          description={emptyText.description}
        />
      )}
    </>
  )
}

/**
 * The card's photo. The pgUpload card doesn't show the event, place or
 * date fields; they're filled only because the shared type needs them.
 */
const toCardPhoto = (photo: Photo, event: PgEvent): CardPhoto => ({
  id: photo.id,
  src: photo.url,
  rider: photo.rider || "",
  horse: photo.horse || "",
  event: event.title,
  eventId: photo.eventId,
  ...getPhotoDateTime({
    taken_at: photo.takenAt,
    created_at: photo.uploadDate,
  }),
  city: event.city || "",
  countryCode: "",
  width: photo.width,
  height: photo.height,
  className: photo.className || "",
  arena: event.venueName || "",
  photographer: event.assignedPhotographers?.[0]?.name,
  prices: photo.prices,
  ownPrices: photo.ownPrices,
})

const selectableCard =
  "group relative cursor-pointer rounded-lg transition-shadow duration-200"

// Old .pg-card-selected: brand ring + dimmed photo
const selectedCard =
  "z-5 ring-2 ring-primary/40 [&_img]:brightness-82 [&_img]:grayscale-40"
