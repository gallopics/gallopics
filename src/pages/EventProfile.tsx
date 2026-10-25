import { useCallback, useMemo, useState } from "react"
import { useLocation, useNavigate, useParams } from "react-router"
import { useMutation, useQuery } from "@tanstack/react-query"
import {
  CalendarDays,
  Clock,
  MapPin,
  Pencil,
  Trash2,
  UploadCloud,
} from "lucide-react"

import { notify } from "@/lib/notify"
import { cn } from "@/lib/utils"
import { useWorkspaceEvents } from "@/hooks/useWorkspaceData"
import { useAuth } from "@/context/AuthContext"
import {
  ApiError,
  type ApiPhoto,
  type PaginatedResponse,
} from "@/data/apiClient"
import {
  buildApiEventDetail,
  mapApiPhotoToPhoto,
  mapApiScheduleToDailySchedule,
} from "@/data/eventsApi"
import { PHOTOGRAPHERS } from "@/data/mockData"
import { eventDetails } from "@/data/mockEventDetails"
import type { EventData } from "@/data/mockEvents"
import {
  eventGalleryQueryOptions,
  eventQueryOptions,
  eventScheduleQueryOptions,
} from "@/data/queries/events"
import {
  deletePhotosMutationOptions,
  myPhotosQueryOptions,
} from "@/data/queries/photographer"
import type { ClassSection, EventDetail, Photo as EventPhoto } from "@/types"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Breadcrumbs, BreadcrumbsSkeleton } from "@/components/Breadcrumbs"
import { ConfirmDialog } from "@/components/ConfirmDialog"
import { DotList } from "@/components/DotList"
import { FilterBar, ResetFiltersButton } from "@/components/FilterBar"
import { Footer } from "@/components/Footer"
import { Header } from "@/components/Header"
import { ActionCluster, ActionSeparator } from "@/components/HeaderActions"
import { InfoChip } from "@/components/InfoChip"
import { ModernDropdown } from "@/components/ModernDropdown"
import { PageTabs } from "@/components/PageTabs"
import {
  GlassButton,
  PhotoCard,
  PhotoCardSkeleton,
} from "@/components/PhotoCard"
import { PhotoPreviewDialog } from "@/components/PhotoPreviewDialog"
import { ScopedSearchBar } from "@/components/ScopedSearchBar"
import { TitleHeader } from "@/components/TitleHeader"
import { PgSelectionPanel } from "@/pages/pg/PgSelectionPanel"

// develop: plain grid instead of masonry (Safari fix)
const photoGridClass =
  "grid w-full grid-cols-[repeat(auto-fill,minmax(220px,300px))] items-start justify-center gap-4 pb-8"

export function EventProfile() {
  const { eventId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { user, isPhotographer } = useAuth()
  const deletePhoto = useMutation(deletePhotosMutationOptions())
  const workspaceEvents = useWorkspaceEvents()
  const fromPath =
    typeof location.state === "object" &&
    location.state !== null &&
    "from" in location.state &&
    typeof location.state.from === "string"
      ? location.state.from
      : "/"
  const fromTab =
    typeof location.state === "object" &&
    location.state !== null &&
    "fromTab" in location.state &&
    typeof location.state.fromTab === "string"
      ? location.state.fromTab
      : undefined
  const initialEventTab =
    typeof location.state === "object" &&
    location.state !== null &&
    "eventTab" in location.state &&
    location.state.eventTab === "classes"
      ? "classes"
      : "uploads"
  const workspaceEvent = eventId
    ? workspaceEvents.find((event) => event.id === eventId)
    : undefined
  const isPhotographerMyEventView =
    (fromPath === "/pg/events" && fromTab === "my") ||
    ((user?.role === "pg" || user?.role === "admin") &&
      Boolean(workspaceEvent?.isRegistered))
  const navigateBackToEvents = () => {
    navigate(fromPath, fromTab ? { state: { tab: fromTab } } : undefined)
  }

  const localEventDetail = eventDetails.find((e) => e.meetingId === eventId)
  const eventQuery = useQuery({
    ...eventQueryOptions(eventId ?? ""),
    enabled: !!eventId && !localEventDetail,
  })
  const apiEvent = eventQuery.data
  // Optional: without a schedule the event gets a placeholder one
  const scheduleQuery = useQuery({
    ...eventScheduleQueryOptions(apiEvent?.id ?? ""),
    enabled: !!apiEvent,
  })
  const apiEventDetail = useMemo<EventDetail | null>(
    () =>
      apiEvent
        ? buildApiEventDetail(
            apiEvent,
            scheduleQuery.data &&
              mapApiScheduleToDailySchedule(scheduleQuery.data)
          )
        : null,
    [apiEvent, scheduleQuery.data]
  )
  const isLoadingEvent =
    !localEventDetail &&
    !!eventId &&
    (eventQuery.isPending || (!!eventQuery.data && scheduleQuery.isPending))
  const eventLoadError = eventQuery.error?.message ?? null
  const eventDetail = localEventDetail || apiEventDetail
  const eventPhotographer = useMemo(
    () => PHOTOGRAPHERS.find((p) => p.primaryEventId === eventId),
    [eventId]
  )

  const [searchQuery, setSearchQuery] = useState("")
  const [eventClass, setEventClass] = useState("All")
  const [activeEventTab, setActiveEventTab] = useState<"uploads" | "classes">(
    initialEventTab
  )
  const [photoToDelete, setPhotoToDelete] = useState<EventPhoto | null>(null)
  const [photoToEditId, setPhotoToEditId] = useState<string | null>(null)
  const [previewPhoto, setPreviewPhoto] = useState<EventPhoto | null>(null)
  const eventReturnState = useMemo(
    () => ({
      from: fromPath,
      fromTab,
      eventTab: activeEventTab,
    }),
    [activeEventTab, fromPath, fromTab]
  )

  // Public photos, unless the photographer manages their own event here
  const showsPublicPhotos =
    !!eventDetail && !isPhotographerMyEventView && !localEventDetail
  const toPublicPhotos = useCallback(
    (page: PaginatedResponse<ApiPhoto>) => {
      if (!eventDetail) return []
      const eventForPhotos: EventData = {
        id: eventDetail.meetingId,
        name: eventDetail.meeting.name,
        coverImage: eventDetail.meeting.coverImage,
        period: `${eventDetail.meeting.period.startDate} – ${eventDetail.meeting.period.endDate}`,
        startDate: eventDetail.meeting.period.startDate,
        endDate: eventDetail.meeting.period.endDate,
        flag: eventDetail.meeting.country.code === "SE" ? "🇸🇪" : "",
        city: eventDetail.meeting.city,
        discipline: eventDetail.meeting.disciplines[0] || "Equestrian",
        country: eventDetail.meeting.country.name,
        photoCount: eventDetail.meeting.photoCount,
        logo: eventDetail.meeting.logo,
        photographer: eventDetail.meeting.photographer || null,
        status: "active",
      }
      return page.items.map((photo) =>
        mapApiPhotoToPhoto(photo, eventForPhotos)
      )
    },
    [eventDetail]
  )
  const publicPhotosQuery = useQuery({
    ...eventGalleryQueryOptions(eventDetail?.meetingId ?? "", 100),
    enabled: showsPublicPhotos,
    select: toPublicPhotos,
  })
  const photos = useMemo(
    () => (showsPublicPhotos ? (publicPhotosQuery.data ?? []) : []),
    [publicPhotosQuery.data, showsPublicPhotos]
  )
  const loading = showsPublicPhotos && publicPhotosQuery.isPending

  // The photographer's own photos, only for their own event
  const myPhotosQuery = useQuery({
    ...myPhotosQueryOptions(),
    enabled: isPhotographer && isPhotographerMyEventView,
  })
  const myEventPhotos = useMemo(
    () =>
      eventId
        ? (myPhotosQuery.data ?? []).filter(
            (photo) => photo.eventId === eventId
          )
        : [],
    [eventId, myPhotosQuery.data]
  )

  const isResetDisabled = eventClass === "All" && searchQuery === ""

  // 1. Get List of all available Competitions for the event
  const allEventClasses = useMemo(() => {
    if (!eventDetail) return []
    const classes: ClassSection[] = []
    eventDetail.schedule.forEach((day) =>
      day.arenas.forEach((arena) =>
        arena.competitions.forEach((comp) => classes.push(comp))
      )
    )
    return classes
  }, [eventDetail])

  const classesByDay = useMemo(() => {
    if (!eventDetail) return []

    return eventDetail.schedule.map((day) => ({
      date: day.date,
      classes: day.arenas.flatMap((arena) =>
        arena.competitions.map((competition) => ({
          ...competition,
          arenaName: arena.name,
        }))
      ),
    }))
  }, [eventDetail])

  const classOptions = useMemo(() => {
    const unique = Array.from(
      new Set(allEventClasses.map((c) => c.name))
    ).sort()
    return [
      { label: "All Classes", value: "All" },
      ...unique.map((c) => ({ label: c, value: c })),
    ]
  }, [allEventClasses])

  const uploadedPhotos = useMemo<EventPhoto[]>(() => {
    if (!isPhotographerMyEventView || !eventId || !eventDetail) return []

    return myEventPhotos.map((photo) => ({
      id: photo.id,
      src: photo.url,
      rider: photo.rider || "Unassigned",
      horse:
        photo.horse || photo.className || photo.fileName || "Uploaded photo",
      event: eventDetail.meeting.name,
      eventId,
      date: photo.uploadDate || eventDetail.meeting.period.startDate,
      width: photo.width,
      height: photo.height,
      className: photo.className || "Uploaded",
      time: photo.timestamp || "",
      city: eventDetail.meeting.city,
      arena: photo.className || "Uploaded",
      countryCode: eventDetail.meeting.country.code.toLowerCase(),
      photographer: eventDetail.meeting.photographer?.name || "Gallopics",
      photographerId: eventDetail.meeting.photographer?.id,
    }))
  }, [eventDetail, eventId, isPhotographerMyEventView, myEventPhotos])

  const uploadPhotos = isPhotographerMyEventView ? uploadedPhotos : photos

  const combinedOptions = useMemo(() => {
    const uniqueRiders = Array.from(
      new Set(uploadPhotos.map((p) => p.rider).filter(Boolean))
    ).sort()
    const uniqueHorses = Array.from(
      new Set(uploadPhotos.map((p) => p.horse).filter(Boolean))
    ).sort()

    const riderOptions = uniqueRiders.map((r) => {
      const photo = uploadPhotos.find((p) => p.rider === r)
      return {
        label: r,
        value: r,
        type: "rider" as const,
        subtitle: photo?.horse,
      }
    })

    const horseOptions = uniqueHorses.map((h) => {
      const photo = uploadPhotos.find((p) => p.horse === h)
      return {
        label: h,
        value: h,
        type: "horse" as const,
        subtitle: photo?.rider,
      }
    })

    return [...riderOptions, ...horseOptions]
  }, [uploadPhotos])

  // 3. Absolute Totals for Header (Stable)
  const totalRiders = useMemo(
    () => new Set(uploadPhotos.map((p) => p.rider).filter(Boolean)).size,
    [uploadPhotos]
  )
  const totalHorses = useMemo(
    () => new Set(uploadPhotos.map((p) => p.horse).filter(Boolean)).size,
    [uploadPhotos]
  )
  const displayedPhotoCount = uploadPhotos.length

  // 4. Final Photo Filtering
  const activePhotos = useMemo(() => {
    if (!uploadPhotos.length) return []
    return uploadPhotos.filter((p) => {
      const matchClass =
        eventClass === "All" ||
        p.arena === eventClass ||
        p.className === eventClass

      // Search Query Logic: Matches either Rider OR Horse
      let matchSearch = true
      if (searchQuery && searchQuery.trim().length > 0) {
        const q = searchQuery.toLowerCase()
        matchSearch =
          p.rider.toLowerCase().includes(q) || p.horse.toLowerCase().includes(q)
      }

      return matchClass && matchSearch
    })
  }, [uploadPhotos, searchQuery, eventClass])

  const handleConfirmDeletePhoto = async () => {
    if (!photoToDelete) return

    try {
      await deletePhoto.mutateAsync({ photoIds: [photoToDelete.id] })
    } catch (error) {
      // 409: the API refuses to delete a sold photo and says why
      notify(
        error instanceof ApiError && error.status === 409
          ? error.message
          : "Could not delete photo. Please try again.",
        "error"
      )
    } finally {
      setPhotoToDelete(null)
    }
  }

  if (isLoadingEvent) return <EventProfileSkeleton />

  if (!eventDetail)
    return (
      <div className="container pt-[120px]">
        {eventLoadError || "Event not found"}
      </div>
    )

  const { meeting } = eventDetail

  const TODAY = new Date()
  TODAY.setHours(0, 0, 0, 0)
  const eventStart = new Date(meeting.period.startDate)
  const eventEnd = new Date(meeting.period.endDate)
  eventEnd.setHours(23, 59, 59, 999)
  const isLive = TODAY >= eventStart && TODAY <= eventEnd

  const formatShort = (date: string, withYear = false) =>
    new Date(date).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      ...(withYear && { year: "numeric" }),
    })

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <Breadcrumbs
        items={[
          { label: "Events", onClick: navigateBackToEvents },
          { label: meeting.name, active: true },
        ]}
      />

      <TitleHeader
        title={meeting.name}
        avatar={meeting.logo || undefined}
        avatarShape="square"
        avatarMobileRow
        topSubtitle={`${formatShort(meeting.period.startDate)} - ${formatShort(meeting.period.endDate, true)}`}
        subtitle={
          <DotList stackOnMobile className="text-base">
            {isLive && (
              <Badge className="h-auto rounded-sm bg-[#FF0000] px-2 py-0.5 text-[10px] leading-none font-bold tracking-wide text-white uppercase">
                Live
              </Badge>
            )}
            <>
              {meeting.country.code === "SE" && <span>🇸🇪</span>}
              <span>{meeting.city}</span>
            </>
            {meeting.venueName}
            {meeting.disciplines.join(", ")}
          </DotList>
        }
        stats={
          <DotList className="text-[0.8125rem]">
            <>{totalRiders} riders</>
            <>{totalHorses} horses</>
            <>{displayedPhotoCount} photos</>
          </DotList>
        }
        rightContent={
          <ActionCluster>
            {eventPhotographer && (
              <>
                <InfoChip
                  label="Photographer"
                  name={`${eventPhotographer.firstName} ${eventPhotographer.lastName}`}
                  variant="photographer"
                  avatarUrl={undefined}
                  onClick={() =>
                    navigate(
                      `/photographer/${eventPhotographer.id}?from=event&eventId=${eventId}`
                    )
                  }
                />
                <ActionSeparator />
              </>
            )}
            {/* develop: share button hidden */}
          </ActionCluster>
        }
      />

      <section className="min-h-100 pt-6 pb-16">
        <div className="container">
          <PageTabs
            tabs={[
              { id: "uploads", label: "Uploads" },
              { id: "classes", label: "Classes" },
            ]}
            activeTab={activeEventTab}
            onChange={(tabId) =>
              setActiveEventTab(tabId === "classes" ? "classes" : "uploads")
            }
          />

          {activeEventTab === "uploads" ? (
            <div>
              <FilterBar
                filters={
                  <>
                    <ModernDropdown
                      value={eventClass}
                      options={classOptions}
                      onChange={setEventClass}
                      label="Class"
                      placeholder="Class"
                      variant="pill"
                    />
                    <ResetFiltersButton
                      disabled={isResetDisabled}
                      onClick={() => {
                        setEventClass("All")
                        setSearchQuery("")
                      }}
                    />
                  </>
                }
                search={
                  <ScopedSearchBar
                    placeholder="Search by riders or horses..."
                    options={combinedOptions}
                    currentValue={searchQuery}
                    onSelect={(val) => setSearchQuery(val)}
                    onSearchChange={(val) => setSearchQuery(val)}
                    variant="v2"
                  />
                }
              />

              <div aria-busy={loading || undefined} className={photoGridClass}>
                {loading && <span className="sr-only">Loading photos…</span>}
                {loading
                  ? Array.from({ length: 12 }).map((_, index) => (
                      <PhotoCardSkeleton key={`event-skeleton-${index}`} />
                    ))
                  : activePhotos.map((photo) => (
                      <div key={photo.id} className="group/item relative">
                        <PhotoCard
                          photo={photo}
                          // Manage view: edit/delete replace the share and cart buttons
                          showCartActions={!isPhotographerMyEventView}
                          showShareActions={false}
                          onClick={(p) => {
                            if (isPhotographerMyEventView) {
                              setPreviewPhoto(p)
                              return
                            }
                            navigate(
                              `/photo/${p.id}?from=epro&eventId=${meeting.id}`,
                              { state: { photo: p, eventReturnState } }
                            )
                          }}
                        />
                        {isPhotographerMyEventView && (
                          <div className="absolute top-3 right-3 z-40 flex flex-col gap-2">
                            <GlassButton
                              title="Edit rider and horse"
                              aria-label="Edit rider and horse"
                              onClick={(e) => {
                                e.stopPropagation()
                                setPhotoToEditId(photo.id)
                              }}
                            >
                              <Pencil />
                            </GlassButton>
                            <GlassButton
                              title="Delete photo"
                              aria-label="Delete photo"
                              onClick={(e) => {
                                e.stopPropagation()
                                setPhotoToDelete(photo)
                              }}
                              className="hover:bg-destructive/12 hover:text-destructive"
                            >
                              <Trash2 />
                            </GlassButton>
                          </div>
                        )}
                      </div>
                    ))}
              </div>
            </div>
          ) : (
            <div className="mb-8 pt-6">
              <div className="mb-4">
                <h2 className="text-xl leading-[1.2] font-semibold text-foreground">
                  Classes
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {allEventClasses.length} classes scheduled for this event
                </p>
              </div>

              <div className="grid gap-3.5">
                {classesByDay.map((day) => (
                  <div
                    key={day.date}
                    className="grid grid-cols-[160px_minmax(0,1fr)] items-start gap-4 border-t py-4 last:border-b max-[900px]:grid-cols-1 max-[900px]:gap-2.5"
                  >
                    <div className="inline-flex min-h-9.5 items-center gap-2 text-sm font-semibold text-foreground">
                      <CalendarDays className="size-4 shrink-0 text-muted-foreground" />
                      <span>
                        {new Date(`${day.date}T00:00:00`).toLocaleDateString(
                          "en-GB",
                          { weekday: "short", day: "numeric", month: "short" }
                        )}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 max-[900px]:grid-cols-1">
                      {day.classes.map((competition) => (
                        <button
                          key={competition.classSectionId}
                          type="button"
                          onClick={() => {
                            if (isPhotographerMyEventView) {
                              const params = new URLSearchParams({
                                classSectionId: competition.classSectionId,
                                className: competition.name,
                              })
                              if (competition.equipeClassSectionId) {
                                params.set(
                                  "equipeClassSectionId",
                                  competition.equipeClassSectionId
                                )
                              }
                              if (competition.arenaName) {
                                params.set("arenaName", competition.arenaName)
                              }

                              navigate(
                                `/pg/events/${meeting.id}?${params.toString()}`,
                                {
                                  state: {
                                    selectedClassId: competition.classSectionId,
                                    selectedEquipeClassSectionId:
                                      competition.equipeClassSectionId,
                                    selectedClassName: competition.name,
                                    selectedArenaName: competition.arenaName,
                                    fromTab,
                                    fromUpload: true,
                                  },
                                }
                              )
                              return
                            }

                            setEventClass(competition.name)
                            setActiveEventTab("uploads")
                          }}
                          className={cn(
                            "grid min-h-11.5 w-full cursor-pointer items-center gap-3 rounded-lg border bg-card px-3 py-2.5 text-left text-foreground transition-[border-color,background-color,box-shadow] duration-150 hover:border-primary/30 hover:bg-primary/8 max-[900px]:grid-cols-[66px_minmax(0,1fr)]",
                            isPhotographerMyEventView
                              ? "grid-cols-[72px_minmax(0,1fr)_minmax(96px,auto)_minmax(74px,auto)]"
                              : "grid-cols-[72px_minmax(0,1fr)_minmax(120px,auto)]",
                            eventClass === competition.name &&
                              "border-primary/30 bg-primary/8 shadow-[inset_0_0_0_1px_var(--primary)]"
                          )}
                        >
                          <span className="inline-flex items-center gap-1.5 text-xs whitespace-nowrap text-muted-foreground">
                            <Clock className="size-3.5 shrink-0" />
                            {competition.startTime}
                          </span>
                          <span className="min-w-0 truncate text-sm leading-[1.35] font-medium">
                            {competition.name}
                          </span>
                          <span className="inline-flex min-w-0 items-center gap-1.5 overflow-hidden text-xs text-ellipsis whitespace-nowrap text-muted-foreground max-[900px]:col-start-2">
                            <MapPin className="size-3.5 shrink-0" />
                            {competition.arenaName}
                          </span>
                          {isPhotographerMyEventView && (
                            <span className="inline-flex items-center gap-1.5 justify-self-end text-xs font-semibold whitespace-nowrap text-primary">
                              <UploadCloud className="size-3.5" />
                              Upload
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      <PhotoPreviewDialog
        src={previewPhoto?.src}
        onClose={() => setPreviewPhoto(null)}
      />

      {isPhotographerMyEventView && eventId && (
        <PgSelectionPanel
          isOpen={Boolean(photoToEditId)}
          selectedIds={
            photoToEditId ? new Set([photoToEditId]) : new Set<string>()
          }
          allPhotos={myEventPhotos}
          activeTab="tags"
          currentTab="uploads"
          onClose={() => setPhotoToEditId(null)}
        />
      )}

      <ConfirmDialog
        open={!!photoToDelete}
        onCancel={() => setPhotoToDelete(null)}
        onConfirm={handleConfirmDeletePhoto}
        busy={deletePhoto.isPending}
        title="Delete photo?"
        description="This will remove the photo from this event."
        confirmLabel={deletePhoto.isPending ? "Deleting..." : "Delete"}
      />

      <Footer minimal />
    </div>
  )
}

/** First load: the page layout with placeholders for the header, filters and photos */
function EventProfileSkeleton() {
  // Bars sit inline in text lines, so each line keeps its real height
  const bar = "inline-block h-[0.8em] rounded-sm bg-border align-middle"

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <div aria-busy="true">
        <BreadcrumbsSkeleton />

        <TitleHeader
          title={
            <>
              <span className="sr-only">Loading event…</span>
              <Skeleton
                aria-hidden="true"
                className={cn(bar, "w-80 max-w-full")}
              />
            </>
          }
          topSubtitle={
            <Skeleton aria-hidden="true" className={cn(bar, "w-28")} />
          }
          subtitle={
            // Like the DotList: one row, stacked on mobile
            <div
              aria-hidden="true"
              className="flex flex-wrap gap-x-4 text-base leading-[1.15] max-md:flex-col max-md:gap-1.5"
            >
              <div>
                <Skeleton className={cn(bar, "w-24")} />
              </div>
              <div>
                <Skeleton className={cn(bar, "w-20")} />
              </div>
            </div>
          }
          stats={
            <div aria-hidden="true" className="text-[0.8125rem]">
              <Skeleton className={cn(bar, "w-44")} />
            </div>
          }
          // The real header always has an (often empty) action row
          rightContent={<ActionCluster>{null}</ActionCluster>}
        />

        <section className="min-h-100 pt-6 pb-16">
          <div aria-hidden="true" className="container">
            {/* Uploads / Classes tabs */}
            <div className="flex gap-6 border-b text-base">
              <div className="px-1 py-3">
                <Skeleton className={cn(bar, "w-16")} />
              </div>
              <div className="px-1 py-3">
                <Skeleton className={cn(bar, "w-16")} />
              </div>
            </div>

            <FilterBar
              filters={
                <>
                  <Skeleton className="h-10 w-32 rounded-full bg-border" />
                  <Skeleton className="size-10 rounded-full bg-border max-md:mr-4" />
                </>
              }
              search={
                <Skeleton className="h-10 w-full rounded-full bg-border" />
              }
            />

            <div className={photoGridClass}>
              {Array.from({ length: 12 }).map((_, index) => (
                <PhotoCardSkeleton key={index} />
              ))}
            </div>
          </div>
        </section>
      </div>

      <Footer />
    </div>
  )
}
