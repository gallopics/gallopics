import { useMemo, useState } from "react"
import { useLocation, useNavigate, useParams } from "react-router"
import { useQuery } from "@tanstack/react-query"
import { AlertCircle } from "lucide-react"

import { ALL_FOLDERS, getFolderValue, UNCATEGORISED } from "@/lib/photoFolders"
import { useDeletePhotosWithUndo } from "@/hooks/useDeletePhotosWithUndo"
import { useWorkspacePhotos } from "@/hooks/useWorkspaceData"
import { useAuth } from "@/context/AuthContext"
import type { Photo } from "@/context/PhotographerContext"
import { useWorkspace } from "@/context/WorkspaceContext"
import type { ApiPhotoFolder } from "@/data/apiClient"
import {
  bookingsQueryOptions,
  foldersQueryOptions,
  myPhotosQueryOptions,
  pgEventQueryOptions,
  toWorkspaceEvents,
} from "@/data/queries/photographer"
import { ConfirmDialog } from "@/components/ConfirmDialog"
import { EmptyState } from "@/components/EmptyState"
import { PhotoPreviewDialog } from "@/components/PhotoPreviewDialog"
import { EventDetailsDialog } from "@/pages/pg/components/EventDetailsDialog"
import { PhotoFolderBar } from "@/pages/pg/components/PhotoFolderBar"
import { PhotoDetailsSheet } from "@/pages/pg/photo-details/PhotoDetailsSheet"

import { EventDetailSkeleton } from "./EventDetailSkeleton"
import { EventHeader, UploadsTabRow } from "./EventHeader"
import { FilterSidebar } from "./FilterSidebar"
import {
  ALL_CHIP,
  buildChips,
  buildSearchOptions,
  matchesClass,
  matchesPhotoSearch,
  readClassContext,
  UPLOAD_STATUSES,
} from "./photoFilters"
import { emptyGridText, PhotoGrid } from "./PhotoGrid"
import { SelectionBar } from "./SelectionBar"

const NO_FOLDERS: ApiPhotoFolder[] = []

/** The studio's view of one event: its uploads, by folder, with tag filters */
export function EventDetail() {
  const { eventId } = useParams<{ eventId: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const { basePath } = useWorkspace()
  const deletePhotosWithUndo = useDeletePhotosWithUndo()
  const { isPhotographer } = useAuth()
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

  const bookedEvent = eventId
    ? bookingsQuery.data?.find((e) => e.id === eventId)
    : undefined
  const bookingsSettled = !isPhotographer || !bookingsQuery.isPending
  // Events the photographer has not booked (or admins open) come from the API
  const apiEventQuery = useQuery({
    ...pgEventQueryOptions(eventId ?? ""),
    enabled: !!eventId && !bookedEvent && bookingsSettled,
  })
  const event = bookedEvent || apiEventQuery.data
  const isLoadingEvent =
    !bookedEvent && (!bookingsSettled || apiEventQuery.isLoading)
  const eventPhotos = useMemo(
    () =>
      eventId
        ? workspacePhotos.filter((photo) => photo.eventId === eventId)
        : [],
    [eventId, workspacePhotos]
  )
  const canUploadPhotos = event?.canUploadPhotos !== false
  // The photographer's own public (ready) photos
  const publishedCount = eventPhotos.filter(
    (photo) => photo.status === "uploadedUnpublished"
  ).length
  const classContext = useMemo(
    () => readClassContext(location.search),
    [location.search]
  )
  const allPhotos = useMemo(
    () => eventPhotos.filter((photo) => matchesClass(photo, classContext)),
    [eventPhotos, classContext]
  )

  const [activeFolder, setActiveFolder] = useState<string>(ALL_FOLDERS)
  const [activeChip, setActiveChip] = useState(ALL_CHIP)
  const [searchTerm, setSearchTerm] = useState("")
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
  const chips = useMemo(() => buildChips(folderPhotos), [folderPhotos])
  const searchOptions = useMemo(
    () => buildSearchOptions(allPhotos),
    [allPhotos]
  )
  const displayedPhotos = useMemo(() => {
    const chip = chips.find((c) => c.id === activeChip)
    return chip ? folderPhotos.filter(chip.matches) : folderPhotos
  }, [folderPhotos, activeChip, chips])

  const handleFolderChange = (folder: string) => {
    if (folder === currentFolder) return
    setActiveFolder(folder)
    setActiveChip(ALL_CHIP)
    setSelectedIds(new Set())
    setIsPanelOpen(false)
  }

  // The search and the chips hide photos too: a selection made before them
  // would be edited or deleted unseen, so it's cleared like on a folder change
  const handleSearchChange = (term: string) => {
    if (term === searchTerm) return
    setSearchTerm(term)
    setSelectedIds(new Set())
  }
  const handleChipChange = (chipId: string) => {
    setActiveChip(chipId)
    setSelectedIds(new Set())
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
  if (!event && isLoadingEvent)
    // Booked events have no logo; once the bookings are in, this is an API event (with one)
    return <EventDetailSkeleton withLogo={bookingsSettled} />
  if (!event)
    return (
      <EmptyState
        icon={<AlertCircle />}
        title={apiEventQuery.error?.message || "Event not found"}
      />
    )

  const showFilters = chips.length > 1 || !!searchTerm

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

  return (
    <div>
      <EventHeader
        event={event}
        publishedCount={publishedCount}
        onInfo={() => setShowInfoModal(true)}
      />
      <UploadsTabRow
        count={uploadPhotos.length}
        canUpload={canUploadPhotos}
        onUpload={handleUpload}
      />

      <div className="container pt-6">
        {(uploadPhotos.length > 0 || folders.length > 0) && (
          <PhotoFolderBar
            eventId={event.id}
            folders={folders}
            photos={uploadPhotos}
            eventPhotos={eventPhotos}
            value={currentFolder}
            onChange={handleFolderChange}
          />
        )}
        <div className="flex items-start gap-8 max-md:flex-col max-md:items-stretch max-md:gap-0">
          {showFilters && (
            <FilterSidebar
              chips={chips}
              activeChip={activeChip}
              onChange={handleChipChange}
            />
          )}
          <div className="min-w-0 flex-1">
            <SelectionBar
              showSearch={showFilters}
              searchOptions={searchOptions}
              searchTerm={searchTerm}
              onSearchChange={handleSearchChange}
              selectedCount={selectedIds.size}
              shownCount={displayedPhotos.length}
              onEdit={() => {
                setEditedIds(undefined)
                setIsPanelOpen(true)
              }}
              onDelete={() => askDelete(selectedIds)}
              onClear={() => {
                setSelectedIds(new Set())
                setIsPanelOpen(false)
              }}
              onSelectAll={() =>
                setSelectedIds(
                  (prev) =>
                    new Set([...prev, ...displayedPhotos.map((p) => p.id)])
                )
              }
            />
            <PhotoGrid
              event={event}
              photos={displayedPhotos}
              isLoading={isLoadingPhotos}
              emptyText={emptyGridText(
                searchTerm,
                currentFolder,
                canUploadPhotos
              )}
              selectedIds={selectedIds}
              onToggleSelect={handleToggleSelect}
              onEdit={openEditor}
              onDelete={(photo) => askDelete(new Set([photo.id]))}
              onPreview={setPreviewSrc}
            />
          </div>
        </div>
      </div>

      {/* Always mounted for the slide animation */}
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
