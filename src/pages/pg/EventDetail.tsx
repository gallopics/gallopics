import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useLocation, useNavigate, useParams } from "react-router"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import {
  AlertCircle,
  Archive,
  ArrowLeft,
  Globe,
  ImageOff,
  Info,
  Pencil,
  Trash2,
  UploadCloud,
  X,
} from "lucide-react"

import { hasCustomPrices } from "@/constants/qualityTiers"
import {
  ALL_FOLDERS,
  getFolderValue,
  UNCATEGORISED,
  UNCATEGORISED_LABEL,
} from "@/lib/photoFolders"
import { cn } from "@/lib/utils"
import { useDeletePhotosWithUndo } from "@/hooks/useDeletePhotosWithUndo"
import { useWorkspacePhotos } from "@/hooks/useWorkspaceData"
import { useAuth } from "@/context/AuthContext"
import type { Photo } from "@/context/PhotographerContext"
import { useWorkspace } from "@/context/WorkspaceContext"
import type { ApiPhotoFolder } from "@/data/apiClient"
import { eventQueryOptions } from "@/data/queries/events"
import {
  bookingsQueryOptions,
  foldersQueryOptions,
  myPhotosQueryOptions,
  resolveCachedDuplicate,
  toPgEvent,
  toWorkspaceEvents,
} from "@/data/queries/photographer"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { ConfirmDialog } from "@/components/ConfirmDialog"
import { EmptyState } from "@/components/EmptyState"
import { FilterChip } from "@/components/FilterChip"
import { ActionCluster } from "@/components/HeaderActions"
import { PhotoCard, PhotoCardSkeleton } from "@/components/PhotoCard"
import { PhotoPreviewDialog } from "@/components/PhotoPreviewDialog"
import { ScopedSearchBar } from "@/components/ScopedSearchBar"
import { TitleHeader } from "@/components/TitleHeader"
import { WorkspaceTabs } from "@/components/WorkspaceTabs"
import { EventDetailsDialog } from "@/pages/pg/components/EventDetailsDialog"
import { PhotoFolderBar } from "@/pages/pg/components/PhotoFolderBar"
import { PgSelectionPanel } from "@/pages/pg/PgSelectionPanel"

// Tab type
type TabType = "uploads" | "published" | "archive"

// Uploads filter: a folder value (ALL_FOLDERS, UNCATEGORISED, a folder id) or the duplicates view
const DUPLICATES = "duplicates"
type PublishedFolderType = "selling_photos" | "unsold"

const NO_FOLDERS: ApiPhotoFolder[] = []

/** Search in the photo grid: file name, photo code / ID and the tags */
const matchesPhotoSearch = (photo: Photo, term: string) =>
  [
    photo.fileName,
    photo.photoCode,
    photo.id,
    photo.rider,
    photo.horse,
    photo.className,
  ].some((value) => value?.toLowerCase().includes(term))

export function EventDetail() {
  const { eventId } = useParams<{ eventId: string }>()
  const navigate = useNavigate()

  const location = useLocation()
  const fromTab = (location.state as any)?.fromTab
  const { basePath } = useWorkspace()
  const { isPhotographer } = useAuth()
  const queryClient = useQueryClient()
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
    (photo) =>
      photo.status === "uploadedUnpublished" || photo.status === "published"
  ).length
  const selectedClassContext = useMemo(() => {
    const state = location.state as
      | {
          selectedClassId?: string
          selectedEquipeClassSectionId?: string
          selectedClassName?: string
          selectedArenaName?: string
        }
      | null
      | undefined
    const params = new URLSearchParams(location.search)

    return {
      id:
        state?.selectedClassId ||
        params.get("classSectionId") ||
        params.get("classId") ||
        "",
      equipeClassSectionId:
        state?.selectedEquipeClassSectionId ||
        params.get("equipeClassSectionId") ||
        "",
      name: state?.selectedClassName || params.get("className") || "",
      arenaName: state?.selectedArenaName || params.get("arenaName") || "",
    }
  }, [location.search, location.state])

  const hasSelectedClassContext = Boolean(
    selectedClassContext.id || selectedClassContext.name
  )

  const handleBack = useCallback(() => {
    if (hasSelectedClassContext && eventId) {
      navigate(`/event/${eventId}`, {
        state: {
          from: "/pg/events",
          fromTab: fromTab || "my",
          eventTab: "classes",
        },
      })
      return
    }

    navigate(`${basePath}/events`, { state: { tab: fromTab } })
  }, [basePath, eventId, fromTab, hasSelectedClassContext, navigate])

  const matchesSelectedClass = useCallback(
    (photo: Photo) => {
      if (!hasSelectedClassContext) return true

      return Boolean(
        (selectedClassContext.id &&
          photo.classId === selectedClassContext.id) ||
        (selectedClassContext.name &&
          photo.className === selectedClassContext.name)
      )
    },
    [
      hasSelectedClassContext,
      selectedClassContext.id,
      selectedClassContext.name,
    ]
  )

  const allPhotos = useMemo(
    () => allEventPhotos.filter(matchesSelectedClass),
    [allEventPhotos, matchesSelectedClass]
  )

  // State
  const [activeTab, setActiveTab] = useState<TabType>("uploads")
  const [activeFolder, setActiveFolder] = useState<string>(ALL_FOLDERS)
  const [activePublishedFolder] =
    useState<PublishedFolderType>("selling_photos")
  const [activeChip, setActiveChip] = useState<string>("all")
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [isPanelOpen, setIsPanelOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [previewPhoto, setPreviewPhoto] = useState<any | null>(null)
  const [showInfoModal, setShowInfoModal] = useState(false)

  const processedDupIds = useRef<Set<string>>(new Set())

  // Deep link effect: Scroll to duplicate group
  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const dupId = params.get("dup")

    if (dupId && !processedDupIds.current.has(dupId)) {
      processedDupIds.current.add(dupId)

      // Force switch to duplicate view
      if (activeTab !== "uploads") setActiveTab("uploads")
      if (activeFolder !== DUPLICATES) setActiveFolder(DUPLICATES)

      // Wait for render/transition
      setTimeout(() => {
        const el = document.getElementById(`dup-group-${dupId}`)
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "center" })
          el.classList.add("highlight-duplicate-group")
          setTimeout(() => {
            el.classList.remove("highlight-duplicate-group")
            // Clear the param after highlight so navigation isn't locked
            // We use the current location to avoid stale closures, but params are from render
            const currentParams = new URLSearchParams(window.location.search)
            currentParams.delete("dup")
            navigate({ search: currentParams.toString() }, { replace: true })
          }, 2000)
        }
      }, 300)
    }
  }, [location.search, activeFolder, activeTab, navigate])

  // Reset active chip to 'all' when switching folders/buckets
  useEffect(() => {
    setActiveChip("all")
  }, [activeFolder])

  // Reset selection when switching tabs
  useEffect(() => {
    setSelectedIds(new Set())
    setIsPanelOpen(false)
    setActiveChip("all")
  }, [activeTab])

  // Photos by tab
  const uploadPhotos = useMemo(
    () =>
      allPhotos.filter((p) =>
        [
          "uploading",
          "processing",
          "needsReview",
          "uploadedUnpublished",
        ].includes(p.status)
      ),
    [allPhotos]
  )

  const publishedPhotosRaw = useMemo(() => {
    return allPhotos.filter((p) => p.status === "published")
  }, [allPhotos])

  const publishedPhotosByBucket = useMemo(() => {
    if (activePublishedFolder === "selling_photos") {
      return publishedPhotosRaw.filter((p) => p.soldCount > 0)
    }
    return publishedPhotosRaw.filter((p) => p.soldCount === 0)
  }, [publishedPhotosRaw, activePublishedFolder])

  const publishedFolderCounts = useMemo(() => {
    const selling = publishedPhotosRaw.filter((p) => p.soldCount > 0)
    return {
      selling_photos: selling.length,
      totalSales: selling.reduce((sum, p) => sum + p.soldCount, 0),
      unsold: publishedPhotosRaw.filter((p) => p.soldCount === 0).length,
    }
  }, [publishedPhotosRaw])

  const publishedChips = useMemo(() => {
    const photos = publishedPhotosByBucket

    const allChips = [
      { id: "all", label: "All", count: photos.length, filterFn: () => true },
      {
        id: "generic",
        label: "Generic",
        count: photos.filter((p) => p.isGeneric).length,
        filterFn: (p: Photo) => p.isGeneric,
      },
      {
        id: "default-prices",
        label: "Default prices",
        count: photos.filter((p) => !hasCustomPrices(p.prices)).length,
        filterFn: (p: Photo) => !hasCustomPrices(p.prices),
      },
      {
        id: "own-prices",
        label: "Own prices",
        count: photos.filter((p) => hasCustomPrices(p.prices)).length,
        filterFn: (p: Photo) => hasCustomPrices(p.prices),
      },
    ]

    return allChips
  }, [publishedPhotosByBucket])

  const filteredPublishedPhotos = useMemo(() => {
    let photos = publishedPhotosByBucket

    // Apply search filter if search term exists
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim()
      photos = photos.filter((p) => matchesPhotoSearch(p, term))
    }

    const chip = publishedChips.find((c) => c.id === activeChip)
    if (!chip || activeChip === "all") return photos
    return photos.filter(chip.filterFn)
  }, [publishedPhotosByBucket, activeChip, publishedChips, searchTerm])

  const archivedPhotosRaw = useMemo(() => {
    return allPhotos.filter((p) => p.status === "archived")
  }, [allPhotos])

  const archivedPhotosByBucket = useMemo(() => {
    if (activePublishedFolder === "selling_photos") {
      return archivedPhotosRaw.filter((p) => p.soldCount > 0)
    }
    return archivedPhotosRaw.filter((p) => p.soldCount === 0)
  }, [archivedPhotosRaw, activePublishedFolder])

  const archivedChips = useMemo(() => {
    const photos = archivedPhotosByBucket

    const allChips = [
      { id: "all", label: "All", count: photos.length, filterFn: () => true },
      {
        id: "generic",
        label: "Generic",
        count: photos.filter((p) => p.isGeneric).length,
        filterFn: (p: Photo) => p.isGeneric,
      },
      {
        id: "default-prices",
        label: "Default prices",
        count: photos.filter((p) => !hasCustomPrices(p.prices)).length,
        filterFn: (p: Photo) => !hasCustomPrices(p.prices),
      },
      {
        id: "own-prices",
        label: "Own prices",
        count: photos.filter((p) => hasCustomPrices(p.prices)).length,
        filterFn: (p: Photo) => hasCustomPrices(p.prices),
      },
    ]

    return allChips
  }, [archivedPhotosByBucket])

  const filteredArchivedPhotos = useMemo(() => {
    let photos = archivedPhotosByBucket

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim()
      photos = photos.filter((p) => matchesPhotoSearch(p, term))
    }

    const chip = archivedChips.find((c) => c.id === activeChip)
    if (!chip || activeChip === "all") return photos
    return photos.filter(chip.filterFn)
  }, [archivedPhotosByBucket, activeChip, archivedChips, searchTerm])

  const tabCounts = useMemo(() => {
    return {
      uploads: uploadPhotos.length,
      published: allPhotos.filter((p) => p.status === "published").length,
      archive: allPhotos.filter((p) => p.status === "archived").length,
    }
  }, [uploadPhotos, allPhotos])

  // Compute valid duplicates (Cross-reference all uploads)
  // Only groups with 2+ instances are considered valid duplicates
  const validDuplicateIds = useMemo(() => {
    const groups = new Map<string, Photo[]>()
    uploadPhotos.forEach((p) => {
      if (p.isDuplicate && !p.duplicateResolved) {
        const key = p.duplicateGroupId || p.url
        if (!groups.has(key)) groups.set(key, [])
        groups.get(key)!.push(p)
      }
    })

    const validIds = new Set<string>()
    for (const photos of groups.values()) {
      if (photos.length >= 2) {
        photos.forEach((p) => validIds.add(p.id))
      }
    }
    return validIds
  }, [uploadPhotos])

  // A folder deleted elsewhere (e.g. another tab) falls back to All
  const currentFolder =
    [ALL_FOLDERS, UNCATEGORISED, DUPLICATES].includes(activeFolder) ||
    folders.some((folder) => folder.id === activeFolder)
      ? activeFolder
      : ALL_FOLDERS

  // Photos in the Uploads tab: all of them, one folder or the duplicates
  const folderPhotos = useMemo(() => {
    let photos: Photo[] =
      currentFolder === DUPLICATES
        ? uploadPhotos.filter((p) => validDuplicateIds.has(p.id))
        : currentFolder === ALL_FOLDERS
          ? uploadPhotos
          : uploadPhotos.filter((p) => getFolderValue(p) === currentFolder)

    // Apply search filter if search term exists
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim()
      photos = photos.filter((p) => matchesPhotoSearch(p, term))
    }

    return photos
  }, [currentFolder, searchTerm, uploadPhotos, validDuplicateIds])

  // Determine if we're in duplicates folder
  const isDuplicatesFolder = currentFolder === DUPLICATES

  // Build chips for inside folder (NOT for duplicates folder)
  const folderChips = useMemo(() => {
    if (isDuplicatesFolder) return []

    // Dynamically extract unique tags from currently displayed folder photos
    const uniqueClasses = Array.from(
      new Set(folderPhotos.map((p) => p.className).filter(Boolean))
    ) as string[]
    const uniqueRiders = Array.from(
      new Set(folderPhotos.map((p) => p.rider).filter((r) => r && r !== "None"))
    ) as string[]
    const uniqueHorses = Array.from(
      new Set(folderPhotos.map((p) => p.horse).filter((h) => h && h !== "None"))
    ) as string[]

    const allChips: any[] = []

    // Add dynamic Class chips
    uniqueClasses.sort().forEach((cls) => {
      allChips.push({
        id: `class-${cls}`,
        label: cls,
        count: folderPhotos.filter((p) => p.className === cls).length,
        filterFn: (p: Photo) => p.className === cls,
      })
    })

    // Add dynamic Rider chips
    uniqueRiders.sort().forEach((rider) => {
      allChips.push({
        id: `rider-${rider}`,
        label: rider.toUpperCase(),
        count: folderPhotos.filter((p) => p.rider === rider).length,
        filterFn: (p: Photo) => p.rider === rider,
      })
    })

    // Add dynamic Horse chips
    uniqueHorses.sort().forEach((horse) => {
      allChips.push({
        id: `horse-${horse}`,
        label: horse,
        count: folderPhotos.filter((p) => p.horse === horse).length,
        filterFn: (p: Photo) => p.horse === horse,
      })
    })

    return allChips
  }, [folderPhotos, isDuplicatesFolder])

  // Search Options for Autocomplete
  const searchOptions = useMemo(() => {
    if (!allPhotos.length) return []
    const options: any[] = []
    const uniqueRiders = new Set<string>()
    const uniqueHorses = new Set<string>()

    allPhotos.forEach((p) => {
      if (p.rider && p.rider !== "None" && !uniqueRiders.has(p.rider)) {
        uniqueRiders.add(p.rider)
        options.push({
          label: p.rider,
          value: p.rider,
          type: "rider",
          subtitle: p.horse,
        })
      }
      if (p.horse && p.horse !== "None" && !uniqueHorses.has(p.horse)) {
        uniqueHorses.add(p.horse)
        options.push({
          label: p.horse,
          value: p.horse,
          type: "horse",
          subtitle: p.rider,
        })
      }

      // ADDED: Photo Search Functionality (Search by ID/Code)
      if (p.photoCode) {
        options.push({
          label: `#${p.photoCode}`,
          value: p.photoCode,
          type: "photo",
          // Format: "IMG_2024.jpg • Rider Name"
          subtitle: `${p.fileName}${p.rider ? ` • ${p.rider}` : ""}`,
        })
      }
    })
    return options
  }, [allPhotos])

  // Get filtered photos based on active chip AND search term
  // folderPhotos are already searched; here only the chip
  const filteredFolderPhotos = useMemo(() => {
    // Duplicates folder shows all duplicates (no chip filtering)
    if (isDuplicatesFolder) return folderPhotos

    const chip = folderChips.find((c) => c.id === activeChip)
    if (!chip || activeChip === "all") return folderPhotos

    return folderPhotos.filter(chip.filterFn)
  }, [folderPhotos, activeChip, folderChips, isDuplicatesFolder])

  // Get display photos based on current tab
  const displayedPhotos = useMemo(() => {
    if (activeTab === "uploads") return filteredFolderPhotos
    if (activeTab === "published") return filteredPublishedPhotos
    if (activeTab === "archive") return filteredArchivedPhotos
    return []
  }, [
    activeTab,
    filteredFolderPhotos,
    filteredPublishedPhotos,
    filteredArchivedPhotos,
  ])

  // Group duplicates by duplicateGroupId (or URL if missing)
  const duplicateGroups = useMemo(() => {
    if (!isDuplicatesFolder) return new Map<string, Photo[]>()

    const groups = new Map<string, Photo[]>()
    displayedPhotos.forEach((p) => {
      const key = p.duplicateGroupId || p.url
      if (!groups.has(key)) groups.set(key, [])
      groups.get(key)!.push(p)
    })

    // Logic already filtered by strict validDuplicateIds, but grouping here ensures structure
    // No extra filtering needed for size < 2 if validDuplicateIds already enforces it,
    // but keeping the loop or just relying on validDuplicateIds is fine.
    // We'll trust validDuplicateIds.
    return groups
  }, [displayedPhotos, isDuplicatesFolder])

  // Folder name on duplicate cards
  const folderNames = useMemo(
    () => new Map(folders.map((folder) => [folder.id, folder.name])),
    [folders]
  )
  const getFolderName = (photo: Photo) =>
    (photo.folderId && folderNames.get(photo.folderId)) || UNCATEGORISED_LABEL

  const handleFolderChange = (folder: string) => {
    if (folder === currentFolder) return
    setActiveFolder(folder)
    setSelectedIds(new Set())
    setIsPanelOpen(false)
  }

  // Reset chip selection when folder changes
  useEffect(() => {
    setActiveChip("all")
  }, [activeFolder])

  // Selection handlers
  const handleToggleSelect = (photo: Photo, multiSelect: boolean) => {
    const newSelected = new Set(multiSelect ? selectedIds : [])

    if (multiSelect) {
      if (newSelected.has(photo.id)) newSelected.delete(photo.id)
      else newSelected.add(photo.id)
    } else {
      if (newSelected.has(photo.id) && newSelected.size === 1) {
        newSelected.clear()
      } else {
        newSelected.clear()
        newSelected.add(photo.id)
      }
    }

    setSelectedIds(newSelected)

    if (newSelected.size === 0) {
      // Panel closed logic handled manually or by clear
    }
  }

  const handleClearSelection = () => {
    setSelectedIds(new Set())
    setIsPanelOpen(false)
  }

  // Duplicate actions
  const handleRemove = (photoId: string) => {
    resolveCachedDuplicate(queryClient, photoId, "remove")
  }

  // Legacy handler for MasonryGrid fallback
  const handleKeep = (photoId: string) => {
    resolveCachedDuplicate(queryClient, photoId, "keep")
  }

  // Manage handler for cards in other views
  const handleManageDuplicate = (groupId?: string) => {
    if (!groupId) return
    navigate(`?dup=${groupId}`, { replace: true })
  }

  // Map PG Photo to UI Photo for PhotoCard
  const mapToUiPhoto = (photo: Photo) => ({
    id: photo.id,
    src: photo.url,
    rider: photo.rider || "Unknown",
    house: photo.horse || "Unknown",
    horse: photo.horse || "Unknown", // Fix typo fallback
    event: event?.title || "Event",
    eventId: photo.eventId,
    date: photo.uploadDate || new Date().toISOString(),
    time: photo.timestamp || "12:00",
    city: event?.city || "Location",
    countryCode: "SE",
    width: photo.width,
    height: photo.height,
    className: photo.className || "photo-grid-item",
    arena: event?.venueName || "Arena 1",
    isDuplicate: validDuplicateIds.has(photo.id),
    duplicateGroupId: photo.duplicateGroupId,
    photographer: event?.assignedPhotographers?.[0]?.name,
    prices: photo.prices,
  })

  // Selection Helpers
  const isAllSelected =
    displayedPhotos.length > 0 &&
    displayedPhotos.every((p) => selectedIds.has(p.id))

  const handleSelectAll = () => {
    const newSet = new Set(selectedIds)
    displayedPhotos.forEach((p) => newSet.add(p.id))
    setSelectedIds(newSet)
  }

  const handleEditPhoto = (photo: Photo) => {
    // Exclusive select + Open Panel
    setSelectedIds(new Set([photo.id]))
    setIsPanelOpen(true)
  }

  const [confirmModal, setConfirmModal] = useState<{
    type: "delete"
    isOpen: boolean
  }>({ type: "delete", isOpen: false })
  const [activePanelTab, setActivePanelTab] = useState<"tags" | "price">("tags")

  const handleEditPrice = (photo: Photo) => {
    setSelectedIds(new Set([photo.id]))
    setActivePanelTab("price")
    setIsPanelOpen(true)
  }

  const handleDeleteSelection = () => {
    if (selectedIds.size === 0) return
    setConfirmModal({ type: "delete", isOpen: true })
  }

  const handleConfirmAction = () => {
    const selectedPhotos = allPhotos.filter((p) => selectedIds.has(p.id))
    const previousSelection = new Set(selectedIds)

    setConfirmModal({ ...confirmModal, isOpen: false })
    setIsPanelOpen(false)

    if (confirmModal.type === "delete") {
      setSelectedIds(new Set())
      // Undo puts them back and reselects them; the API delete waits for the toast
      deletePhotosWithUndo(
        selectedPhotos,
        `${selectedIds.size} photo${selectedIds.size > 1 ? "s" : ""} deleted`,
        () => setSelectedIds(previousSelection)
      )
    }
  }

  // Override edit photo to default to tags
  const handleEditPhotoOverride = (photo: Photo) => {
    handleEditPhoto(photo)
    setActivePanelTab("tags")
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

  const showFilters =
    (activeTab === "uploads" &&
      !isDuplicatesFolder &&
      (folderChips.length > 1 || !!searchTerm)) ||
    (activeTab === "published" && publishedChips.length > 0) ||
    (activeTab === "archive" && archivedChips.length > 0)

  const activeChips =
    activeTab === "uploads"
      ? folderChips
      : activeTab === "published"
        ? publishedChips
        : archivedChips

  const handleUpload = () => {
    const params = new URLSearchParams({ eventId: event.id, from: "event" })
    if (selectedClassContext.id) {
      params.set("classSectionId", selectedClassContext.id)
    }
    if (selectedClassContext.equipeClassSectionId) {
      params.set(
        "equipeClassSectionId",
        selectedClassContext.equipeClassSectionId
      )
    }
    if (selectedClassContext.name) {
      params.set("className", selectedClassContext.name)
    }
    if (selectedClassContext.arenaName) {
      params.set("arenaName", selectedClassContext.arenaName)
    }
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
            <Button
              variant="ghost"
              size="icon-sm"
              className="size-6.5"
              onClick={handleBack}
              title={
                hasSelectedClassContext ? "Back to classes" : "Back to events"
              }
              aria-label={
                hasSelectedClassContext ? "Back to classes" : "Back to events"
              }
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
                      {tabCounts.uploads}
                    </span>
                  </>
                ),
              },
            ]}
            value={activeTab}
            onChange={setActiveTab}
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
        {activeTab === "uploads" &&
          (uploadPhotos.length > 0 || folders.length > 0) && (
            <PhotoFolderBar
              eventId={event.id}
              folders={folders}
              photos={uploadPhotos}
              eventPhotos={allEventPhotos}
              value={currentFolder}
              onChange={handleFolderChange}
            />
          )}
        <div className="flex items-start gap-8">
          {/* Left sidebar: tag filters */}
          {showFilters && (
            <div className="w-55 shrink-0 self-start pt-3">
              <div className="flex w-full flex-col items-stretch gap-2 pr-2">
                {activeChips.map((chip) => (
                  <FilterChip
                    key={chip.id}
                    // Full-width rows, count on the right; long names wrap to two lines
                    className="h-auto min-h-9 w-full justify-between rounded-xl py-1.5 text-left whitespace-normal"
                    label={
                      <span
                        className="flex min-w-0 items-center gap-1.5"
                        title={String(chip.label)}
                      >
                        {chip.color && (
                          <span
                            className="size-2 shrink-0 rounded-full"
                            style={{ background: chip.color }}
                          />
                        )}
                        <span className="line-clamp-2 leading-[1.3]">
                          {chip.label}
                        </span>
                      </span>
                    }
                    isActive={activeChip === chip.id}
                    onClick={() => setActiveChip(chip.id)}
                    variant="filterCount"
                    accent={chip.id === "missing-tags" ? "red" : undefined}
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
              <div className="mb-3 flex items-center justify-between gap-6 py-3">
                {showFilters && (
                  <div className="max-w-150 flex-1">
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
                        onClick={() => setIsPanelOpen(true)}
                        title="Edit selection"
                        aria-label="Edit selection"
                      >
                        <Pencil className="size-4.5" />
                      </Button>

                      {activeTab === "uploads" || activeTab === "archive" ? (
                        <Button
                          variant="destructive"
                          size="icon"
                          className={roundDanger}
                          onClick={handleDeleteSelection}
                          title="Delete selection"
                          aria-label="Delete selection"
                        >
                          <Trash2 className="size-4.5" />
                        </Button>
                      ) : null}

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
                        {isAllSelected ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="px-3 text-foreground"
                            onClick={() => setSelectedIds(new Set())}
                          >
                            <X className="size-3.5" />
                            Clear
                          </Button>
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="px-3 text-foreground"
                            onClick={handleSelectAll}
                          >
                            Select all
                          </Button>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            {activeTab === "uploads" && isDuplicatesFolder ? (
              // Duplicates view (grouped)
              <div className="pb-25">
                {Array.from(duplicateGroups.entries()).map(
                  ([groupId, photos]) => {
                    const firstPhoto = photos[0]

                    return (
                      <div
                        key={groupId}
                        id={`dup-group-${groupId}`}
                        className="mb-8 rounded-xl border-2 border-transparent bg-card p-5 shadow-[0_1px_3px_rgba(0,0,0,0.05)] transition-all duration-500 [&.highlight-duplicate-group]:border-primary [&.highlight-duplicate-group]:shadow-[0_0_0_4px] [&.highlight-duplicate-group]:shadow-primary/15"
                      >
                        <div className="mb-4 flex items-center gap-2 text-base font-semibold">
                          Duplicate: {firstPhoto.fileName}{" "}
                          <span className="font-normal text-muted-foreground">
                            ({photos.length} instances)
                          </span>
                        </div>
                        <div className="flex gap-4 overflow-x-auto pb-2">
                          {photos.map((photo) => {
                            const isSelected = selectedIds.has(photo.id)
                            return (
                              <div
                                key={photo.id}
                                className="relative w-65 shrink-0"
                              >
                                <div
                                  className={cn(
                                    selectableCard,
                                    isSelected && selectedCard
                                  )}
                                  onClick={(e) =>
                                    handleToggleSelect(
                                      photo,
                                      e.shiftKey || e.metaKey || e.ctrlKey
                                    )
                                  }
                                >
                                  <PhotoCard
                                    photo={mapToUiPhoto(photo)}
                                    onClick={() => {}}
                                    variant="pgDuplicate"
                                    pgMeta={{
                                      fileName: photo.fileName,
                                      photoCode: photo.photoCode,
                                      uploadDate: photo.uploadDate,
                                      timestamp: photo.timestamp,
                                      folderName: getFolderName(photo),
                                    }}
                                    onKeep={() => handleKeep(photo.id)}
                                    onRemove={() => handleRemove(photo.id)}
                                  />
                                  {renderSelectBox(photo, isSelected)}
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )
                  }
                )}
                {duplicateGroups.size === 0 && (
                  <div className="py-16 text-center text-sm text-muted-foreground">
                    No duplicates found.
                  </div>
                )}
              </div>
            ) : (
              // develop: plain grid instead of masonry (Safari fix)
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
                  const uiPhoto = mapToUiPhoto(photo)
                  const isSelected = selectedIds.has(photo.id)

                  const cardVariant =
                    activeTab === "uploads"
                      ? isDuplicatesFolder
                        ? "pgDuplicate"
                        : "pgUpload"
                      : activeTab === "published"
                        ? "pgPublished"
                        : "pgArchived"

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
                        photo={uiPhoto}
                        onClick={() => {}}
                        variant={cardVariant}
                        pgMeta={{
                          fileName: photo.fileName,
                          photoCode: photo.photoCode,
                          uploadDate: photo.uploadDate,
                          timestamp: photo.timestamp,
                          prices: isDuplicatesFolder ? undefined : photo.prices,
                          folderName: getFolderName(photo),
                          soldCount:
                            activeTab === "published" || activeTab === "archive"
                              ? photo.soldCount
                              : 0,
                          totalBucketSales:
                            activeTab === "published" &&
                            activePublishedFolder === "selling_photos"
                              ? publishedFolderCounts.totalSales
                              : 0,
                        }}
                        onKeep={
                          isDuplicatesFolder
                            ? () => handleKeep(photo.id)
                            : undefined
                        }
                        onRemove={() => {
                          if (isDuplicatesFolder) {
                            handleRemove(photo.id)
                          } else if (activeTab !== "published") {
                            setSelectedIds(new Set([photo.id]))
                            setConfirmModal({ type: "delete", isOpen: true })
                          }
                        }}
                        onManageDuplicate={() =>
                          handleManageDuplicate(photo.duplicateGroupId)
                        }
                        onEdit={() => handleEditPhotoOverride(photo)}
                        onEditPrice={() => handleEditPrice(photo)}
                        onPreview={() => setPreviewPhoto(uiPhoto)}
                      />
                      {renderSelectBox(photo, isSelected)}
                    </div>
                  )
                })}
              </div>
            )}

            {activeTab === "uploads" &&
              !isDuplicatesFolder &&
              !isLoadingPhotos &&
              displayedPhotos.length === 0 && (
                <EmptyState
                  icon={<ImageOff />}
                  title={searchTerm ? "No results found" : "No photos here"}
                  description={
                    searchTerm
                      ? `No photos match "${searchTerm}"`
                      : currentFolder !== ALL_FOLDERS &&
                          currentFolder !== UNCATEGORISED
                        ? "This folder is empty. Select photos and use Move to... to add them."
                        : canUploadPhotos
                          ? "This folder is empty. Upload photos to get started."
                          : "This event is read-only because the booking was cancelled."
                  }
                />
              )}
            {activeTab === "published" && displayedPhotos.length === 0 && (
              <EmptyState
                icon={<Globe />}
                title={
                  searchTerm ? "No results found" : "Nothing published yet"
                }
                description={
                  searchTerm
                    ? `No published photos match "${searchTerm}"`
                    : "Publish photos from the Uploads tab to make them available for buyers."
                }
              />
            )}
            {activeTab === "archive" && displayedPhotos.length === 0 && (
              <EmptyState
                icon={<Archive />}
                title={searchTerm ? "No results found" : "Archive is empty"}
                description={
                  searchTerm
                    ? `No archived photos match "${searchTerm}"`
                    : "Unpublished photos will appear here."
                }
              />
            )}
          </div>
        </div>
      </div>

      {/* Selection panel — always mounted for the slide animation */}
      <PgSelectionPanel
        isOpen={isPanelOpen}
        selectedIds={selectedIds}
        allPhotos={allPhotos}
        activeTab={activePanelTab}
        currentTab={activeTab}
        onClose={() => setIsPanelOpen(false)}
        // Moved photos may have left the folder on screen
        onMoved={() => setSelectedIds(new Set())}
      />

      <PhotoPreviewDialog
        src={previewPhoto?.src}
        onClose={() => setPreviewPhoto(null)}
      />

      <ConfirmDialog
        open={confirmModal.isOpen}
        onCancel={() => setConfirmModal({ ...confirmModal, isOpen: false })}
        onConfirm={handleConfirmAction}
        title={`Delete photo${selectedIds.size > 1 ? "s" : ""}?`}
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
            <Skeleton aria-hidden="true" className={cn(bar, "w-24")} />
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
