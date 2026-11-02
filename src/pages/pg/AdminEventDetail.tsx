import { useMemo, useState } from "react"
import { useLocation, useNavigate, useParams } from "react-router"
import { useQuery } from "@tanstack/react-query"
import { AlertCircle, ArrowLeft, ImageOff, Info } from "lucide-react"

import { ApiError } from "@/data/apiClient"
import { mapApiEventToEventData, mapApiPhotoToPhoto } from "@/data/eventsApi"
import {
  eventAllPhotosQueryOptions,
  eventQueryOptions,
} from "@/data/queries/events"
import { toPgEvent } from "@/data/queries/photographer"
import type { Photo } from "@/types"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { EmptyState } from "@/components/EmptyState"
import { FilterBar, ResetFiltersButton } from "@/components/FilterBar"
import { ActionCluster } from "@/components/HeaderActions"
import { ModernDropdown } from "@/components/ModernDropdown"
import { PhotoCard, PhotoCardSkeleton } from "@/components/PhotoCard"
import { PhotoPreviewDialog } from "@/components/PhotoPreviewDialog"
import { SearchInput } from "@/components/SearchInput"
import { TitleHeader } from "@/components/TitleHeader"
import { EventDetailsDialog } from "@/pages/pg/components/EventDetailsDialog"

const ALL_PHOTOGRAPHERS = ""

const photoGridClass =
  "grid w-full grid-cols-[repeat(auto-fill,minmax(220px,280px))] justify-center gap-4 pb-8"

/** Search in the grid: rider, horse, class, photographer and photo ID */
const matchesPhotoSearch = (photo: Photo, term: string) =>
  [
    photo.rider,
    photo.horse,
    photo.className,
    photo.photographer,
    photo.id,
  ].some((value) => value?.toLowerCase().includes(term))

/**
 * An event as admins see it: every public photo of every photographer, read
 * only. Photographers manage their own photos on the studio's event page.
 */
export function AdminEventDetail() {
  const { eventId = "" } = useParams<{ eventId: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const fromTab = (location.state as { fromTab?: string } | null)?.fromTab

  const [photographer, setPhotographer] = useState(ALL_PHOTOGRAPHERS)
  const [searchTerm, setSearchTerm] = useState("")
  const [previewPhoto, setPreviewPhoto] = useState<Photo | null>(null)
  const [showInfoModal, setShowInfoModal] = useState(false)

  const eventQuery = useQuery({
    ...eventQueryOptions(eventId),
    enabled: !!eventId,
  })
  const photosQuery = useQuery({
    ...eventAllPhotosQueryOptions(eventId),
    enabled: !!eventQuery.data,
  })

  const event = useMemo(
    () => (eventQuery.data ? toPgEvent(eventId, eventQuery.data) : null),
    [eventId, eventQuery.data]
  )
  const photos = useMemo(() => {
    if (!eventQuery.data || !photosQuery.data) return []
    const eventData = mapApiEventToEventData(eventQuery.data)
    return photosQuery.data.map((photo) => mapApiPhotoToPhoto(photo, eventData))
  }, [eventQuery.data, photosQuery.data])

  const photographerOptions = useMemo(
    () => [
      { label: "All photographers", value: ALL_PHOTOGRAPHERS },
      ...Array.from(
        new Set(photos.map((photo) => photo.photographer || "Unknown"))
      )
        .sort((a, b) => a.localeCompare(b))
        .map((name) => ({ label: name, value: name })),
    ],
    [photos]
  )

  const term = searchTerm.trim().toLowerCase()
  const visiblePhotos = photos.filter(
    (photo) =>
      (!photographer || (photo.photographer || "Unknown") === photographer) &&
      (!term || matchesPhotoSearch(photo, term))
  )

  const goBack = () =>
    navigate("/admin/events", fromTab ? { state: { tab: fromTab } } : undefined)

  if (eventQuery.isPending) return <AdminEventDetailSkeleton />

  if (!event) {
    const isNotFound =
      eventQuery.error instanceof ApiError &&
      (eventQuery.error.status === 404 || eventQuery.error.status === 422)
    return (
      <EmptyState
        icon={<AlertCircle />}
        title={isNotFound ? "Event not found" : "Event could not be loaded"}
        description={isNotFound ? undefined : eventQuery.error?.message}
      >
        <Button variant="outline" onClick={goBack}>
          Back to events
        </Button>
      </EmptyState>
    )
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <TitleHeader
        compact
        variant="workspace"
        title={
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon-sm"
              className="size-6.5"
              onClick={goBack}
              title="Back to events"
              aria-label="Back to events"
            >
              <ArrowLeft className="size-4.5" />
            </Button>
            {event.title}
            <Button
              variant="ghost"
              size="icon-sm"
              className="size-6.5"
              onClick={() => setShowInfoModal(true)}
              aria-label="Event details"
            >
              <Info className="size-4.5" />
            </Button>
          </div>
        }
        topSubtitle={event.dateRange}
        avatar={event.logo}
        avatarShape="square"
        rightContent={
          <ActionCluster>
            <div className="flex flex-col items-start rounded-xl bg-muted px-4 py-2 whitespace-nowrap text-muted-foreground">
              <span className="text-[0.6875rem] leading-[1.2] font-semibold opacity-80">
                Published
              </span>
              <span className="text-sm leading-[1.2] font-bold text-foreground">
                {photosQuery.data ? photos.length : "–"}
              </span>
            </div>
          </ActionCluster>
        }
      />

      <div className="container">
        <FilterBar
          searchWidth="fixed"
          filters={
            <>
              <ModernDropdown
                value={photographer}
                options={photographerOptions}
                onChange={setPhotographer}
                variant="pill"
                label="Photographer"
                disabled={photos.length === 0}
              />
              <ResetFiltersButton
                disabled={!photographer && !searchTerm}
                onClick={() => {
                  setPhotographer(ALL_PHOTOGRAPHERS)
                  setSearchTerm("")
                }}
              />
            </>
          }
          search={
            <SearchInput
              value={searchTerm}
              onChange={setSearchTerm}
              placeholder="Search riders, horses, classes, photo ID..."
            />
          }
          meta={<>Showing {visiblePhotos.length} photos</>}
        />

        {photosQuery.isPending ? (
          <div aria-busy="true" className={photoGridClass}>
            <span className="sr-only">Loading photos…</span>
            {Array.from({ length: 8 }).map((_, index) => (
              <PhotoCardSkeleton key={index} />
            ))}
          </div>
        ) : photosQuery.isError ? (
          <EmptyState
            icon={<AlertCircle />}
            title="Photos could not be loaded"
            description={photosQuery.error.message}
          >
            <Button variant="outline" onClick={() => photosQuery.refetch()}>
              Try again
            </Button>
          </EmptyState>
        ) : visiblePhotos.length === 0 ? (
          <EmptyState
            icon={<ImageOff />}
            title={photos.length ? "No results found" : "No photos yet"}
            description={
              photos.length
                ? "No photos match the filters."
                : "No photographer has published photos for this event yet."
            }
          />
        ) : (
          <div className={photoGridClass}>
            {visiblePhotos.map((photo) => (
              <PhotoCard
                key={photo.id}
                photo={photo}
                onClick={setPreviewPhoto}
                showCartActions={false}
                showShareActions={false}
              />
            ))}
          </div>
        )}
      </div>

      <PhotoPreviewDialog
        src={previewPhoto?.src}
        onClose={() => setPreviewPhoto(null)}
      />

      <EventDetailsDialog
        event={event}
        open={showInfoModal}
        onOpenChange={setShowInfoModal}
      />
    </div>
  )
}

/** First load: header and photo cards as placeholders */
function AdminEventDetailSkeleton() {
  return (
    <div aria-busy="true" className="min-h-screen bg-background">
      <span className="sr-only">Loading event…</span>
      <TitleHeader
        compact
        variant="workspace"
        title={<Skeleton className="h-[0.8em] w-56 rounded-sm bg-border" />}
        topSubtitle={<Skeleton className="h-[0.8em] w-24 rounded-sm" />}
        avatar={<Skeleton className="size-full rounded-md" />}
        avatarShape="square"
      />
      <div aria-hidden="true" className="container pt-24">
        <div className={photoGridClass}>
          {Array.from({ length: 8 }).map((_, index) => (
            <PhotoCardSkeleton key={index} />
          ))}
        </div>
      </div>
    </div>
  )
}
