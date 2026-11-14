import { useCallback, useMemo, useState } from "react"
import {
  Link,
  useLocation,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router"
import { useQuery } from "@tanstack/react-query"
import { CalendarDays, Clock, MapPin } from "lucide-react"

import { formatDate, toDate } from "@/lib/dates"
import { cn } from "@/lib/utils"
import { useWorkspaceEvents } from "@/hooks/useWorkspaceData"
import { useAuth } from "@/context/AuthContext"
import { ApiError, type ApiPhoto } from "@/data/apiClient"
import {
  buildApiEventDetail,
  mapApiPhotoToPhoto,
  mapApiScheduleToDailySchedule,
} from "@/data/eventsApi"
import {
  eventAllPhotosQueryOptions,
  eventQueryOptions,
  eventScheduleQueryOptions,
} from "@/data/queries/events"
import type { ClassSection, EventData, EventDetail } from "@/types"
import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Breadcrumbs, BreadcrumbsSkeleton } from "@/components/Breadcrumbs"
import { DotList } from "@/components/DotList"
import { FilterBar, ResetFiltersButton } from "@/components/FilterBar"
import { Footer } from "@/components/Footer"
import { Header } from "@/components/Header"
import { ActionCluster, ActionSeparator } from "@/components/HeaderActions"
import { InfoChip } from "@/components/InfoChip"
import { ModernDropdown } from "@/components/ModernDropdown"
import { PageState } from "@/components/PageState"
import { PageTabs } from "@/components/PageTabs"
import { PhotoCard, PhotoCardSkeleton } from "@/components/PhotoCard"
import { ScopedSearchBar } from "@/components/ScopedSearchBar"
import { TitleHeader } from "@/components/TitleHeader"

// develop: plain grid instead of masonry (Safari fix)
const photoGridClass =
  "grid w-full grid-cols-[repeat(auto-fill,minmax(220px,300px))] items-start justify-center gap-4 pb-8"

export function EventProfile() {
  const { eventId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { isPhotographer } = useAuth()
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
  const canManagePhotos = isPhotographer && workspaceEvent?.isRegistered
  const navigateBackToEvents = () => {
    navigate(fromPath, fromTab ? { state: { tab: fromTab } } : undefined)
  }

  const eventQuery = useQuery({
    ...eventQueryOptions(eventId ?? ""),
    enabled: !!eventId,
  })
  const apiEvent = eventQuery.data
  // Optional: without a schedule the event gets a placeholder one
  const scheduleQuery = useQuery({
    ...eventScheduleQueryOptions(apiEvent?.id ?? ""),
    enabled: !!apiEvent,
  })
  const eventDetail = useMemo<EventDetail | null>(
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
    !!eventId &&
    (eventQuery.isPending || (!!eventQuery.data && scheduleQuery.isPending))
  // 422: the ID isn't a valid event ID at all (e.g. an old mock link)
  const isEventNotFound =
    eventQuery.error instanceof ApiError &&
    (eventQuery.error.status === 404 || eventQuery.error.status === 422)

  const [searchParams, setSearchParams] = useSearchParams()
  const searchQuery = searchParams.get("q") ?? ""
  const setSearchQuery = (value: string) => {
    setSearchParams(
      (params) => {
        if (value.trim()) params.set("q", value)
        else params.delete("q")
        return params
      },
      { replace: true }
    )
  }
  const [eventClass, setEventClass] = useState("All")
  const [activeEventTab, setActiveEventTab] = useState<"uploads" | "classes">(
    initialEventTab
  )
  const eventReturnState = useMemo(
    () => ({
      from: fromPath,
      fromTab,
      eventTab: activeEventTab,
    }),
    [activeEventTab, fromPath, fromTab]
  )

  const toPublicPhotos = useCallback(
    (apiPhotos: ApiPhoto[]) => {
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
      return apiPhotos.map((photo) => mapApiPhotoToPhoto(photo, eventForPhotos))
    },
    [eventDetail]
  )
  const publicPhotosQuery = useQuery({
    ...eventAllPhotosQueryOptions(eventDetail?.meetingId ?? ""),
    enabled: !!eventDetail,
    select: toPublicPhotos,
  })
  const photos = useMemo(
    () => publicPhotosQuery.data ?? [],
    [publicPhotosQuery.data]
  )
  const loading = !!eventDetail && publicPhotosQuery.isPending

  const isResetDisabled = eventClass === "All" && searchQuery === ""

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
    const counts = new Map<string, number>()
    photos.forEach((photo) => {
      if (photo.className && photo.className !== "Uploaded") {
        counts.set(photo.className, (counts.get(photo.className) ?? 0) + 1)
      }
    })
    return [
      { label: "All Classes", value: "All" },
      ...[...counts]
        .sort(([a], [b]) => a.localeCompare(b, undefined, { numeric: true }))
        .map(([name, count]) => ({ label: `${name} (${count})`, value: name })),
    ]
  }, [photos])

  const combinedOptions = useMemo(() => {
    const uniqueRiders = Array.from(
      new Set(photos.map((p) => p.rider).filter(Boolean))
    ).sort()
    const uniqueHorses = Array.from(
      new Set(photos.map((p) => p.horse).filter(Boolean))
    ).sort()

    const riderOptions = uniqueRiders.map((r) => {
      const photo = photos.find((p) => p.rider === r)
      return {
        label: r,
        value: r,
        type: "rider" as const,
        subtitle: photo?.horse,
      }
    })

    const horseOptions = uniqueHorses.map((h) => {
      const photo = photos.find((p) => p.horse === h)
      return {
        label: h,
        value: h,
        type: "horse" as const,
        subtitle: photo?.rider,
      }
    })

    return [...riderOptions, ...horseOptions]
  }, [photos])

  // 3. Absolute Totals for Header (Stable)
  const totalRiders = useMemo(
    () => new Set(photos.map((p) => p.rider).filter(Boolean)).size,
    [photos]
  )
  const totalHorses = useMemo(
    () => new Set(photos.map((p) => p.horse).filter(Boolean)).size,
    [photos]
  )
  const displayedPhotoCount = photos.length

  // 4. Final Photo Filtering
  const activePhotos = useMemo(() => {
    if (!photos.length) return []
    return photos.filter((p) => {
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
  }, [photos, searchQuery, eventClass])

  if (isLoadingEvent) return <EventProfileSkeleton />

  if (!eventDetail)
    return (
      <PageState
        title={
          isEventNotFound ? "Event not found" : "Event could not be loaded"
        }
        description={
          isEventNotFound
            ? "The event you're looking for isn't available."
            : "We couldn't load this event. Please try again."
        }
        onRetry={
          isEventNotFound
            ? undefined
            : () => {
                void eventQuery.refetch()
              }
        }
        retrying={eventQuery.isFetching}
      />
    )

  const { meeting } = eventDetail

  // Event dates are calendar days ("2026-10-11"), compared with today's date
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const eventStart = toDate(meeting.period.startDate)
  const eventEnd = toDate(meeting.period.endDate)
  const isLive =
    !!eventStart && !!eventEnd && today >= eventStart && today <= eventEnd

  const formatShort = (date: string, withYear = false) =>
    formatDate(date, { year: withYear ? "numeric" : undefined })

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
          <div className="flex flex-wrap items-center gap-3">
            {canManagePhotos && (
              <Link
                to={`/pg/events/${meeting.id}`}
                className={buttonVariants({ variant: "outline" })}
              >
                Manage my photos
              </Link>
            )}
            <ActionCluster>
              {meeting.photographer && (
                <>
                  <InfoChip
                    label="Photographer"
                    name={meeting.photographer.name}
                    variant="photographer"
                    avatarUrl={meeting.photographer.avatar || undefined}
                    href={`/photographer/${meeting.photographer.id}?from=event&eventId=${eventId}`}
                  />
                  <ActionSeparator />
                </>
              )}
              {/* develop: share button hidden */}
            </ActionCluster>
          </div>
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
                searchWidth="compact"
                filters={
                  <>
                    <ModernDropdown
                      value={eventClass}
                      options={classOptions}
                      onChange={setEventClass}
                      label="Class"
                      placeholder="Class"
                      variant="pill"
                      className="h-auto! min-h-10 w-85 max-w-[calc(100vw-100px)] py-2 [&_[data-slot=select-value]]:min-w-0"
                      contentClassName="w-120 max-w-[calc(100vw-32px)]"
                      wrapLabels
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
                      <PhotoCard
                        key={photo.id}
                        photo={photo}
                        showShareActions={false}
                        href={`/photo/${photo.id}?from=epro&eventId=${meeting.id}`}
                        linkState={{ photo, eventReturnState }}
                      />
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
                            setEventClass(competition.name)
                            setActiveEventTab("uploads")
                          }}
                          className={cn(
                            "grid min-h-11.5 w-full cursor-pointer grid-cols-[72px_minmax(0,1fr)_minmax(120px,auto)] items-center gap-3 rounded-lg border bg-card px-3 py-2.5 text-left text-foreground transition-[border-color,background-color,box-shadow] duration-150 hover:border-primary/30 hover:bg-primary/8 max-[900px]:grid-cols-[66px_minmax(0,1fr)]",
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
