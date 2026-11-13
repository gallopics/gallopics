import { useMemo, useState } from "react"
import { Link, useLocation, useNavigate, useParams } from "react-router"
import { useQuery } from "@tanstack/react-query"
import {
  AlertCircle,
  ArrowLeft,
  ImageOff,
  Info,
  Pencil,
  Trash2,
  UploadCloud,
} from "lucide-react"

import { ALL_FOLDERS, getFolderValue, UNCATEGORISED } from "@/lib/photoFolders"
import { shortPhotoId } from "@/lib/shortPhotoId"
import { cn } from "@/lib/utils"
import { useDeletePhotosWithUndo } from "@/hooks/useDeletePhotosWithUndo"
import { useWorkspacePhotos } from "@/hooks/useWorkspaceData"
import { useAuth } from "@/context/AuthContext"
import type { PgEvent, Photo } from "@/context/PhotographerContext"
import { useWorkspace } from "@/context/WorkspaceContext"
import type { ApiPhotoFolder } from "@/data/apiClient"
import { eventQueryOptions } from "@/data/queries/events"
import {
  bookingsQueryOptions,
  foldersQueryOptions,
  myPhotosQueryOptions,
  toPgEvent,
  toWorkspaceEvents,
} from "@/data/queries/photographer"
import type { Photo as CardPhoto } from "@/types"
import { Button, buttonVariants } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { ConfirmDialog } from "@/components/ConfirmDialog"
import { EmptyState } from "@/components/EmptyState"
import { FilterChip } from "@/components/FilterChip"
import { ActionCluster } from "@/components/HeaderActions"
import { PhotoCard, PhotoCardSkeleton } from "@/components/PhotoCard"
import { PhotoPreviewDialog } from "@/components/PhotoPreviewDialog"
import {
  ScopedSearchBar,
  type ScopedSearchOption,
} from "@/components/ScopedSearchBar"
import { TitleHeader } from "@/components/TitleHeader"
import { WorkspaceTabs } from "@/components/WorkspaceTabs"
import { EventDetailsDialog } from "@/pages/pg/components/EventDetailsDialog"
import { PhotoFolderBar } from "@/pages/pg/components/PhotoFolderBar"
import { NO_TAG } from "@/pages/pg/photo-details/detailsForm"
import { PhotoDetailsSheet } from "@/pages/pg/photo-details/PhotoDetailsSheet"

const NO_FOLDERS: ApiPhotoFolder[] = []

/** Statuses shown in the Uploads tab */
const UPLOAD_STATUSES: Photo["status"][] = [
  "uploading",
  "processing",
  "needsReview",
  "uploadedUnpublished",
]

type ClassContext = { id: string; name: string }

/** A class opened from the event page (?classSectionId / ?className); none matches all */
const matchesClass = (photo: Photo, { id, name }: ClassContext) =>
  (!id && !name) ||
  (!!id && photo.classId === id) ||
  (!!name && photo.className === name)

/** Search in the photo grid: file name, photo ID or code (as on Sales) and the tags */
const matchesPhotoSearch = (photo: Photo, term: string) =>
  [
    photo.fileName,
    photo.id,
    shortPhotoId(photo.id),
    photo.rider,
    photo.horse,
    photo.className,
  ].some((value) => value?.toLowerCase().includes(term))

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
  date: photo.uploadDate || "",
  time: photo.timestamp || "",
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

/** What the empty grid says: no search hit, an empty folder or no uploads */
function emptyGridText(
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

export function EventDetail() {
  const { eventId } = useParams<{ eventId: string }>()
  const navigate = useNavigate()

  const location = useLocation()
  const fromTab = (location.state as { fromTab?: string } | null)?.fromTab
  const { basePath } = useWorkspace()
  const { isPhotographer } = useAuth()
  const deletePhotosWithUndo = useDeletePhotosWithUndo()
  const bookingsQuery = useQuery({
    ...bookingsQueryOptions(),
    enabled: isPhotographer,
    select: toWorkspaceEvents,
  })
  const workspacePhotos = useWorkspacePhotos()
  // First load of the photos only (refetches keep showing them)
  const { isPending: isPhotosPending } = useQuery({
    ...myPhotosQueryOptions(),
    enabled: isPhotographer,
  })
  const isLoadingPhotos = isPhotographer && isPhotosPending
  // The photographer's own folders in this event (private)
  const { data: folders = NO_FOLDERS } = useQuery({
    ...foldersQueryOptions(eventId ?? ""),
    enabled: isPhotographer && !!eventId,
  })

  const contextEvent = eventId
    ? bookingsQuery.data?.find((e) => e.id === eventId)
    : undefined
  const bookingsSettled = !isPhotographer || !bookingsQuery.isPending
  // Events the photographer has not booked (or admins open) come from the API
  const apiEventQuery = useQuery({
    ...eventQueryOptions(eventId ?? ""),
    enabled: !!eventId && !contextEvent && bookingsSettled,
  })
  const apiEvent = useMemo(
    () =>
      eventId && apiEventQuery.data
        ? toPgEvent(eventId, apiEventQuery.data)
        : null,
    [apiEventQuery.data, eventId]
  )
  const isLoadingApiEvent =
    !contextEvent && (!bookingsSettled || apiEventQuery.isLoading)
  const apiEventError = apiEventQuery.error?.message ?? null
  const event = contextEvent || apiEvent || undefined
  const canUploadPhotos = event?.canUploadPhotos !== false
  const allEventPhotos = useMemo(
    () =>
      eventId
        ? workspacePhotos.filter((photo) => photo.eventId === eventId)
        : [],
    [eventId, workspacePhotos]
  )
  // The photographer's own public (ready) photos
  const publishedCount = allEventPhotos.filter(
    (photo) => photo.status === "uploadedUnpublished"
  ).length
  const classContext = useMemo(() => {
    const params = new URLSearchParams(location.search)
    return {
      id: params.get("classSectionId") || params.get("classId") || "",
      equipeClassSectionId: params.get("equipeClassSectionId") || "",
      name: params.get("className") || "",
      arenaName: params.get("arenaName") || "",
    }
  }, [location.search])
  const allPhotos = useMemo(
    () => allEventPhotos.filter((photo) => matchesClass(photo, classContext)),
    [allEventPhotos, classContext]
  )

  const [activeFolder, setActiveFolder] = useState<string>(ALL_FOLDERS)
  const [activeChip, setActiveChip] = useState<string>("all")
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [isPanelOpen, setIsPanelOpen] = useState(false)
  const [activePanelTab, setActivePanelTab] = useState<"tags" | "price">("tags")
  // The photo a card's edit button opened; unset, the panel edits the
  // selection. Kept after closing, so the slide-out still shows it.
  const [editedIds, setEditedIds] = useState<Set<string>>()
  const panelIds = editedIds ?? selectedIds
  // The photos to delete: the selection or one card. Kept after closing, so
  // the dialog's title doesn't change while it fades out.
  const [deleteIds, setDeleteIds] = useState<Set<string>>(new Set())
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [previewSrc, setPreviewSrc] = useState<string>()
  const [showInfoModal, setShowInfoModal] = useState(false)

  const uploadPhotos = useMemo(
    () => allPhotos.filter((p) => UPLOAD_STATUSES.includes(p.status)),
    [allPhotos]
  )

  // A folder deleted elsewhere (e.g. another tab) falls back to All
  const currentFolder =
    [ALL_FOLDERS, UNCATEGORISED].includes(activeFolder) ||
    folders.some((folder) => folder.id === activeFolder)
      ? activeFolder
      : ALL_FOLDERS

  // Photos in the Uploads tab: all of them or one folder, then the search
  const folderPhotos = useMemo(() => {
    let photos =
      currentFolder === ALL_FOLDERS
        ? uploadPhotos
        : uploadPhotos.filter((p) => getFolderValue(p) === currentFolder)
    const term = searchTerm.toLowerCase().trim()
    if (term) photos = photos.filter((p) => matchesPhotoSearch(p, term))
    return photos
  }, [currentFolder, searchTerm, uploadPhotos])

  // Tag filters from the photos in view
  const folderChips = useMemo(() => {
    const uniqueClasses = Array.from(
      new Set(folderPhotos.map((p) => p.className).filter(Boolean))
    ) as string[]
    const uniqueRiders = Array.from(
      new Set(folderPhotos.map((p) => p.rider).filter((r) => r && r !== NO_TAG))
    ) as string[]
    const uniqueHorses = Array.from(
      new Set(folderPhotos.map((p) => p.horse).filter((h) => h && h !== NO_TAG))
    ) as string[]

    const allChips: {
      id: string
      label: string
      count: number
      filterFn: (photo: Photo) => boolean
    }[] = [
      {
        id: "all",
        label: "All",
        count: folderPhotos.length,
        filterFn: () => true,
      },
    ]

    uniqueClasses.sort().forEach((cls) => {
      allChips.push({
        id: `class-${cls}`,
        label: cls,
        count: folderPhotos.filter((p) => p.className === cls).length,
        filterFn: (p: Photo) => p.className === cls,
      })
    })

    uniqueRiders.sort().forEach((rider) => {
      allChips.push({
        id: `rider-${rider}`,
        label: rider.toUpperCase(),
        count: folderPhotos.filter((p) => p.rider === rider).length,
        filterFn: (p: Photo) => p.rider === rider,
      })
    })

    uniqueHorses.sort().forEach((horse) => {
      allChips.push({
        id: `horse-${horse}`,
        label: horse,
        count: folderPhotos.filter((p) => p.horse === horse).length,
        filterFn: (p: Photo) => p.horse === horse,
      })
    })

    return allChips
  }, [folderPhotos])

  // Riders and horses offered by the search
  const searchOptions = useMemo(() => {
    if (!allPhotos.length) return []
    const options: ScopedSearchOption[] = []
    const uniqueRiders = new Set<string>()
    const uniqueHorses = new Set<string>()

    allPhotos.forEach((p) => {
      if (p.rider && p.rider !== NO_TAG && !uniqueRiders.has(p.rider)) {
        uniqueRiders.add(p.rider)
        options.push({
          label: p.rider,
          value: p.rider,
          type: "rider",
          subtitle: p.horse,
        })
      }
      if (p.horse && p.horse !== NO_TAG && !uniqueHorses.has(p.horse)) {
        uniqueHorses.add(p.horse)
        options.push({
          label: p.horse,
          value: p.horse,
          type: "horse",
          subtitle: p.rider,
        })
      }
    })
    return options
  }, [allPhotos])

  // folderPhotos are already searched; here only the chip
  const displayedPhotos = useMemo(() => {
    const chip = folderChips.find((c) => c.id === activeChip)
    if (!chip || activeChip === "all") return folderPhotos

    return folderPhotos.filter(chip.filterFn)
  }, [folderPhotos, activeChip, folderChips])

  const handleFolderChange = (folder: string) => {
    if (folder === currentFolder) return
    setActiveFolder(folder)
    setActiveChip("all")
    setSelectedIds(new Set())
    setIsPanelOpen(false)
  }

  // A plain click selects only this photo (or clears it); Shift/Ctrl/Cmd adds or removes it
  const handleToggleSelect = (photo: Photo, multiSelect: boolean) => {
    setSelectedIds((prev) => {
      if (!multiSelect)
        return prev.has(photo.id) && prev.size === 1
          ? new Set()
          : new Set([photo.id])
      const next = new Set(prev)
      if (next.has(photo.id)) next.delete(photo.id)
      else next.add(photo.id)
      return next
    })
  }

  const handleClearSelection = () => {
    setSelectedIds(new Set())
    setIsPanelOpen(false)
  }

  const handleSelectAll = () =>
    setSelectedIds(
      (prev) => new Set([...prev, ...displayedPhotos.map((p) => p.id)])
    )

  /** Edit one photo from its card, without touching the selection */
  const openEditor = (photo: Photo, tab: "tags" | "price") => {
    setEditedIds(new Set([photo.id]))
    setActivePanelTab(tab)
    setIsPanelOpen(true)
  }

  const askDelete = (ids: Set<string>) => {
    setDeleteIds(ids)
    setIsDeleteOpen(true)
  }

  const handleConfirmDelete = () => {
    const previousSelection = selectedIds
    setIsDeleteOpen(false)
    setIsPanelOpen(false)
    setSelectedIds(
      (prev) => new Set([...prev].filter((id) => !deleteIds.has(id)))
    )
    // Undo puts them back and restores the selection; the API delete waits for the toast
    deletePhotosWithUndo(
      allPhotos.filter((p) => deleteIds.has(p.id)),
      `${deleteIds.size} photo${deleteIds.size > 1 ? "s" : ""} deleted`,
      () => setSelectedIds(previousSelection)
    )
  }

  // Guard after all hooks — safe to return early now
  if (!event && isLoadingApiEvent)
    // Booked events have no logo; once the bookings are in, this is an API event (with one)
    return <EventDetailSkeleton withLogo={bookingsSettled} />
  if (!event)
    return (
      <EmptyState
        icon={<AlertCircle />}
        title={apiEventError || "Event not found"}
      />
    )

  const showFilters = folderChips.length > 1 || !!searchTerm
  const emptyGrid = emptyGridText(searchTerm, currentFolder, canUploadPhotos)

  const handleUpload = () => {
    // The class opened on the event page, so the upload is tagged with it
    const params = new URLSearchParams(
      Object.entries({
        eventId: event.id,
        from: "event",
        classSectionId: classContext.id,
        equipeClassSectionId: classContext.equipeClassSectionId,
        className: classContext.name,
        arenaName: classContext.arenaName,
      }).filter(([, value]) => value)
    )
    navigate(`${basePath}/upload?${params.toString()}`)
  }

  // Checkbox shown on hover (always when selected, and always on touch screens) in the card's corner
  const renderSelectBox = (photo: Photo, isSelected: boolean) => (
    <div
      className={cn(
        "absolute top-2.5 left-2.5 z-10 transition-opacity duration-200 group-hover:opacity-100 pointer-coarse:opacity-100",
        isSelected ? "opacity-100" : "opacity-0"
      )}
      onClick={(e) => e.stopPropagation()}
    >
      <Checkbox
        checked={isSelected}
        onCheckedChange={() => handleToggleSelect(photo, true)}
        aria-label="Select photo"
        className="size-4.5 rounded-sm border-white/60 bg-white/90 shadow-sm"
      />
    </div>
  )

  return (
    <div>
      <TitleHeader
        compact
        variant="workspace"
        className="border-b-0"
        title={
          <div className="flex items-center gap-2">
            <Link
              to={`${basePath}/events`}
              state={{ tab: fromTab }}
              className={cn(
                buttonVariants({ variant: "ghost", size: "icon-sm" }),
                "size-6.5"
              )}
              title="Back to events"
              aria-label="Back to events"
            >
              <ArrowLeft className="size-4.5" />
            </Link>
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
        // Indented past the back button, so the date lines up with the title
        topSubtitle={<span className="pl-8.5">{event.dateRange}</span>}
        avatar={event.logo}
        avatarShape="square"
        rightContent={
          <ActionCluster>
            {basePath === "/pg" && (
              <Link
                to={`/event/${event.id}`}
                className={buttonVariants({ variant: "outline" })}
              >
                View public page
              </Link>
            )}
            <div className="flex flex-col items-start rounded-xl bg-muted px-4 py-2 whitespace-nowrap text-muted-foreground">
              <span className="text-[0.6875rem] leading-[1.2] font-semibold opacity-80">
                Published
              </span>
              <span className="text-sm leading-[1.2] font-bold text-foreground">
                {publishedCount}
              </span>
            </div>
          </ActionCluster>
        }
      />

      {/* Tabs row */}
      <div className="border-b bg-card/95 backdrop-blur-sm">
        <div className="container flex items-center">
          <WorkspaceTabs
            // old .tab-btn: 14px 24px padding, 14px/21px, 2px underline overlapping the row border
            triggerClassName="-mb-px group-data-[variant=line]/tabs-list:h-auto group-data-[variant=line]/tabs-list:px-6 group-data-[variant=line]/tabs-list:pt-3.5 group-data-[variant=line]/tabs-list:pb-4 group-data-[variant=line]/tabs-list:leading-normal"
            tabs={[
              {
                value: "uploads",
                label: (
                  <>
                    Uploads
                    <span className="inline-flex h-4.5 min-w-5 items-center justify-center rounded-full border border-transparent bg-background px-1.5 text-xs font-bold text-muted-foreground in-data-active:border-primary/20 in-data-active:bg-primary/10 in-data-active:text-primary">
                      {uploadPhotos.length}
                    </span>
                  </>
                ),
              },
            ]}
            value="uploads"
            onChange={() => undefined}
          />

          {/* Brand pill at the old 36px height; hidden when the booking was cancelled */}
          {canUploadPhotos && (
            <Button
              size="sm"
              className="ml-auto text-sm"
              onClick={handleUpload}
            >
              <UploadCloud />
              Upload
            </Button>
          )}
        </div>
      </div>

      <div className="container pt-6">
        {(uploadPhotos.length > 0 || folders.length > 0) && (
          <PhotoFolderBar
            eventId={event.id}
            folders={folders}
            photos={uploadPhotos}
            eventPhotos={allEventPhotos}
            value={currentFolder}
            onChange={handleFolderChange}
          />
        )}
        {/* Phones: the tag filters become one scrolling row above the photos */}
        <div className="flex items-start gap-8 max-md:flex-col max-md:items-stretch max-md:gap-0">
          {/* Left sidebar: tag filters */}
          {showFilters && (
            <div className="w-55 shrink-0 self-start pt-3 max-md:w-full">
              <div className="flex w-full flex-col items-stretch gap-2 pr-2 max-md:flex-row max-md:overflow-x-auto max-md:pr-0 max-md:pb-1">
                {folderChips.map((chip) => (
                  <FilterChip
                    key={chip.id}
                    // Full-width rows, count on the right; long names wrap to two lines
                    className="h-auto min-h-9 w-full justify-between rounded-xl py-1.5 text-left whitespace-normal max-md:w-auto max-md:max-w-60 max-md:shrink-0"
                    label={
                      <span
                        className="flex min-w-0 items-center gap-1.5"
                        title={String(chip.label)}
                      >
                        <span className="line-clamp-2 leading-[1.3]">
                          {chip.label}
                        </span>
                      </span>
                    }
                    isActive={activeChip === chip.id}
                    onClick={() =>
                      setActiveChip(activeChip === chip.id ? "all" : chip.id)
                    }
                    variant="filterCount"
                    count={chip.count}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Right content column */}
          <div className="min-w-0 flex-1">
            {/* The selection actions also show without the filter row */}
            {(showFilters || selectedIds.size > 0) && (
              <div
                className={cn(
                  // Wraps when the search and the counts don't fit on one row
                  "mb-3 flex flex-wrap items-center justify-between gap-x-6 gap-y-3 py-3 max-md:gap-x-3",
                  // Padding (and a matching negative margin) keeps the search off the bar's edge
                  selectedIds.size > 0 &&
                    "sticky top-(--site-header-height) z-30 -mx-3 bg-background px-3 shadow-sm"
                )}
              >
                {showFilters && (
                  <div
                    className={cn(
                      "max-w-150 flex-[1_1_16rem] max-md:basis-full",
                      selectedIds.size > 0 && "max-md:hidden"
                    )}
                  >
                    <ScopedSearchBar
                      placeholder="Search riders, horses, photo ID..."
                      options={searchOptions}
                      currentValue={searchTerm}
                      onSelect={(val) =>
                        setSearchTerm(val === "All" ? "" : val)
                      }
                      onSearchChange={(val) => setSearchTerm(val)}
                      variant="v2"
                    />
                  </div>
                )}

                <div className="ml-auto flex items-center">
                  {selectedIds.size > 0 ? (
                    <div className="flex items-center gap-2">
                      <span className="mr-4 text-[0.8125rem] font-semibold whitespace-nowrap text-foreground">
                        {selectedIds.size} selected
                      </span>

                      <Button
                        variant="outline"
                        size="icon"
                        className={roundButton}
                        onClick={() => {
                          setEditedIds(undefined)
                          setIsPanelOpen(true)
                        }}
                        title="Edit selection"
                        aria-label="Edit selection"
                      >
                        <Pencil className="size-4.5" />
                      </Button>

                      <Button
                        variant="destructive"
                        size="icon"
                        className={roundDanger}
                        onClick={() => askDelete(selectedIds)}
                        title="Delete selection"
                        aria-label="Delete selection"
                      >
                        <Trash2 className="size-4.5" />
                      </Button>

                      <Separator
                        orientation="vertical"
                        className="mr-2 ml-4 h-6 data-vertical:self-center"
                      />

                      <Button
                        variant="ghost"
                        size="sm"
                        className="px-3"
                        onClick={handleClearSelection}
                      >
                        Clear
                      </Button>
                    </div>
                  ) : (
                    <>
                      <div className="mr-4 flex h-6 items-center text-sm font-medium text-muted-foreground">
                        Showing {displayedPhotos.length} photos
                      </div>

                      <div className="flex shrink-0 items-center gap-2 border-l pl-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="px-3 text-foreground"
                          onClick={handleSelectAll}
                        >
                          Select all
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* develop: plain grid instead of masonry (Safari fix) */}
            <div
              aria-busy={isLoadingPhotos || undefined}
              className={photoGridClass}
            >
              {isLoadingPhotos && (
                <>
                  <span className="sr-only">Loading photos…</span>
                  {Array.from({ length: 8 }).map((_, index) => (
                    <PhotoCardSkeleton key={index} pg />
                  ))}
                </>
              )}
              {displayedPhotos.map((photo) => {
                const isSelected = selectedIds.has(photo.id)

                return (
                  <div
                    key={photo.id}
                    id={`photo-${photo.id}`}
                    className={cn(selectableCard, isSelected && selectedCard)}
                    onClick={(e) =>
                      handleToggleSelect(
                        photo,
                        e.shiftKey || e.metaKey || e.ctrlKey
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
                      onRemove={() => askDelete(new Set([photo.id]))}
                      onEdit={() => openEditor(photo, "tags")}
                      onEditPrice={() => openEditor(photo, "price")}
                      onPreview={() => setPreviewSrc(photo.url)}
                    />
                    {renderSelectBox(photo, isSelected)}
                  </div>
                )
              })}
            </div>

            {!isLoadingPhotos && displayedPhotos.length === 0 && (
              <EmptyState
                icon={<ImageOff />}
                title={emptyGrid.title}
                description={emptyGrid.description}
              />
            )}
          </div>
        </div>
      </div>

      {/* Selection panel — always mounted for the slide animation */}
      <PhotoDetailsSheet
        isOpen={isPanelOpen}
        selectedIds={panelIds}
        allPhotos={allPhotos}
        activeTab={activePanelTab}
        onClose={() => setIsPanelOpen(false)}
        // Moved photos may have left the folder on screen: unselect them
        onMoved={() =>
          setSelectedIds(
            (prev) => new Set([...prev].filter((id) => !panelIds.has(id)))
          )
        }
      />

      <PhotoPreviewDialog
        src={previewSrc}
        onClose={() => setPreviewSrc(undefined)}
      />

      <ConfirmDialog
        open={isDeleteOpen}
        onCancel={() => setIsDeleteOpen(false)}
        onConfirm={handleConfirmDelete}
        title={`Delete photo${deleteIds.size > 1 ? "s" : ""}?`}
        description="This will remove the selected photo(s) from the event. You can undo it for a few seconds afterwards."
        confirmLabel="Delete"
      />

      <EventDetailsDialog
        event={event}
        open={showInfoModal}
        onOpenChange={setShowInfoModal}
      />
    </div>
  )
}

// develop: plain grid instead of masonry (Safari fix)
const photoGridClass =
  "grid w-full grid-cols-[repeat(auto-fill,minmax(220px,280px))] justify-center gap-4 pb-8"

/** First load: compact header, tabs row and photo cards as placeholders */
function EventDetailSkeleton({ withLogo }: { withLogo: boolean }) {
  // Bars sit inline in text lines, so each line keeps its real height
  const bar = "inline-block h-[0.8em] rounded-sm bg-border align-middle"

  return (
    <div aria-busy="true">
      <TitleHeader
        compact
        variant="workspace"
        className="border-b-0"
        title={
          <div aria-hidden="true" className="flex items-center gap-2">
            {/* Back and info buttons */}
            <Skeleton className="size-6.5 rounded-full" />
            <Skeleton className="h-[0.8em] w-48 rounded-sm bg-border" />
            <Skeleton className="size-6.5 rounded-full" />
          </div>
        }
        topSubtitle={
          <>
            <span className="sr-only">Loading event…</span>
            <Skeleton aria-hidden="true" className={cn(bar, "ml-8.5 w-24")} />
          </>
        }
        avatar={
          withLogo ? (
            <Skeleton aria-hidden="true" className="size-full rounded-md" />
          ) : undefined
        }
        avatarShape="square"
        rightContent={
          <ActionCluster>
            {/* "Published" count */}
            <Skeleton aria-hidden="true" className="h-11.5 w-21" />
          </ActionCluster>
        }
      />

      <div aria-hidden="true" className="border-b bg-card/95">
        <div className="container flex items-center">
          <div className="-mb-px px-6 pt-3.5 pb-4 text-sm leading-normal">
            <Skeleton className={cn(bar, "w-20")} />
          </div>
        </div>
      </div>

      <div aria-hidden="true" className="container pt-6">
        <div className={photoGridClass}>
          {Array.from({ length: 8 }).map((_, index) => (
            <PhotoCardSkeleton key={index} pg />
          ))}
        </div>
      </div>
    </div>
  )
}

const selectableCard =
  "group relative cursor-pointer rounded-lg transition-shadow duration-200"

// Old .pg-card-selected: brand ring + dimmed photo
const selectedCard =
  "z-5 ring-2 ring-primary/40 [&_img]:brightness-82 [&_img]:grayscale-40"

// Old round 40px header buttons in the selection bar
const roundButton = "size-10 text-muted-foreground"

const roundDanger = "size-10 border-destructive/20 hover:border-destructive"
