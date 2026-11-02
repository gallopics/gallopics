import { useCallback, useEffect, useMemo, useState } from "react"
import { useLocation, useNavigate } from "react-router"
import { useAuth as useClerkAuth } from "@clerk/clerk-react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { AlertCircle, CalendarPlus, CalendarX2 } from "lucide-react"

import { getEventSortTime, isPreviousEventDate } from "@/lib/eventDates"
import { assetUrl, cn } from "@/lib/utils"
import { useWorkspacePhotos } from "@/hooks/useWorkspaceData"
import { useAuth } from "@/context/AuthContext"
import type { PgEvent } from "@/context/PhotographerContext"
import { useWorkspace } from "@/context/WorkspaceContext"
import { api, ApiError, type ApiEvent } from "@/data/apiClient"
import { mapApiEventToEventData } from "@/data/eventsApi"
import { eventsListQueryOptions } from "@/data/queries/events"
import {
  bookingsQueryOptions,
  photographerKeys,
} from "@/data/queries/photographer"
import type { EventData } from "@/types"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "@/components/ui/toast"
import { ConfirmDialog } from "@/components/ConfirmDialog"
import { EmptyState } from "@/components/EmptyState"
import { FilterBar, ResetFiltersButton } from "@/components/FilterBar"
import { SearchInput } from "@/components/SearchInput"
import { TitleHeader } from "@/components/TitleHeader"
import { WorkspaceTabs } from "@/components/WorkspaceTabs"
import {
  PgEventCard,
  PgEventCardSkeleton,
} from "@/pages/pg/components/PgEventCard"

type EventsView = "my" | "upcoming" | "previous" | "live" | "past" | "archived"

/** "Open" / "Closed" pill showing whether applications are welcomed */
function ApplicationsTag({ open }: { open: boolean }) {
  return (
    <Badge
      variant="secondary"
      className="h-auto gap-1.5 px-2.5 py-0.75 text-[0.6875rem] font-bold tracking-[0.05em] text-[#bbb] uppercase"
    >
      <span
        className={cn(
          "size-1.5 rounded-full",
          open
            ? "bg-success shadow-[0_0_0_2px_color-mix(in_oklab,var(--success)_20%,transparent)]"
            : "bg-destructive shadow-[0_0_0_2px_color-mix(in_oklab,var(--destructive)_20%,transparent)]"
        )}
      />
      {open ? "Open" : "Closed"}
    </Badge>
  )
}

/** Loading placeholder shaped like an event row of the Current / Previous tabs */
function EventRowSkeleton() {
  // Bars sit inline in text lines, so each line keeps its real height
  const bar = "inline-block h-[0.8em] rounded-sm bg-border align-middle"

  return (
    <div
      aria-hidden="true"
      className="mb-3 grid grid-cols-[1fr_auto] items-center gap-8 rounded-xl border bg-card px-5 py-4"
    >
      <div>
        <div className="text-xs leading-normal">
          <Skeleton className={cn(bar, "w-28")} />
        </div>
        {/* Event names usually take two lines on phones */}
        <div className="my-1 text-sm leading-[1.4]">
          <div>
            <Skeleton className={cn(bar, "w-56 max-w-full")} />
          </div>
          <div className="md:hidden">
            <Skeleton className={cn(bar, "w-24")} />
          </div>
        </div>
        <div className="text-sm leading-normal">
          <Skeleton className={cn(bar, "w-72 max-w-full")} />
        </div>
      </div>
      <Skeleton className="h-9 w-16 rounded-full" />
    </div>
  )
}

const mapApiEventToPgEvent = (event: EventData): PgEvent => ({
  id: event.id,
  title: event.name,
  date: event.startDate || event.period,
  endDate: event.endDate || event.startDate,
  dateRange: event.period,
  location: `${event.city}, ${event.country}`,
  coverImage: event.coverImage,
  status: "upcoming",
  isRegistered: false,
  photosCount: event.photoCount || 0,
  publishedCount: 0,
  soldCount: 0,
  logo: event.logo || event.coverImage || assetUrl("images/events/default.png"),
  // EventData has no venue; bookings add the real one below
  venueName: "",
  disciplines: [event.discipline],
  city: event.city,
  assignedPhotographers: event.photographer ? [event.photographer] : [],
  applicationsWelcomed: event.status !== "disabled",
  canUploadPhotos: false,
})

const mapBackendEventToPgEvent = (
  event: ApiEvent,
  isRegistered: boolean
): PgEvent => ({
  ...mapApiEventToPgEvent(mapApiEventToEventData(event)),
  venueName: event.venue_name || "",
  isRegistered,
  status: isRegistered ? "open" : "upcoming",
  canUploadPhotos: isRegistered,
})

export function EventsList() {
  const { isAdmin } = useWorkspace()
  const { isLoaded: isAuthProfileLoaded, user, isPhotographer } = useAuth()
  const workspacePhotos = useWorkspacePhotos()
  const { isLoaded: isClerkLoaded, isSignedIn } = useClerkAuth()
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const location = useLocation()
  const initialTab = (location.state as any)?.tab
  const [view, setView] = useState<
    "my" | "upcoming" | "previous" | "live" | "past" | "archived"
  >(initialTab ?? (isAdmin ? "live" : "my"))
  const [searchTerm, setSearchTerm] = useState("")

  // Bookings cancelled here stay listed, read-only, until the page is left
  const [cancelledEvents, setCancelledEvents] = useState<PgEvent[]>([])
  const [actionError, setActionError] = useState<string | null>(null)

  const [cancelBookingTarget, setCancelBookingTarget] =
    useState<PgEvent | null>(null)

  const canLoadEvents = isClerkLoaded && !!isSignedIn && isAuthProfileLoaded
  const loadsPhotographerEvents = !isAdmin && canLoadEvents
  // Admins get every event; photographers' "My events" only the ones with photos
  const eventsQuery = useQuery({
    ...eventsListQueryOptions(
      !isAdmin && !(view === "upcoming" || view === "previous")
    ),
    enabled: canLoadEvents,
  })
  const bookingsQuery = useQuery({
    ...bookingsQueryOptions(),
    enabled: loadsPhotographerEvents && isPhotographer,
  })
  const isLoadingUpcomingEvents =
    loadsPhotographerEvents &&
    (eventsQuery.isPending || (isPhotographer && bookingsQuery.isPending))
  const isLoadingAdminEvents =
    isAdmin && (!canLoadEvents || eventsQuery.isPending)
  // Load errors only when there is nothing to show (a failed refetch keeps the list)
  const upcomingEventsError =
    actionError ??
    (eventsQuery.data ? null : (eventsQuery.error?.message ?? null))

  useEffect(() => {
    if (bookingsQuery.error) {
      console.warn("Failed to load event bookings", bookingsQuery.error)
    }
  }, [bookingsQuery.error])

  const syncLocalPhotographerProfile = useCallback(async () => {
    if (!user || user.role === "admin") {
      return
    }

    await api.upsertMyPhotographer({
      slug: user.id,
      display_name: user.displayName || "Photographer",
      city: user.city || null,
      country: user.country || null,
      avatar_url: user.avatarUrl ?? null,
      phone: user.phone ?? null,
      is_available_to_hire: true,
    })
  }, [
    user?.avatarUrl,
    user?.city,
    user?.country,
    user?.displayName,
    user?.id,
    user?.phone,
    user?.role,
  ])

  const bookEvent = useMutation({
    mutationFn: async (eventId: string) => {
      try {
        return await api.bookEvent(eventId)
      } catch (bookingError) {
        if (
          !(bookingError instanceof ApiError) ||
          bookingError.status !== 403
        ) {
          throw bookingError
        }

        await syncLocalPhotographerProfile()
        return api.bookEvent(eventId)
      }
    },
    onSuccess: (booked) => {
      setCancelledEvents((prev) => prev.filter((item) => item.id !== booked.id))
      queryClient.setQueryData<ApiEvent[]>(
        photographerKeys.bookings(),
        (prev) => [
          booked,
          ...(prev ?? []).filter((item) => item.id !== booked.id),
        ]
      )
    },
  })

  const cancelBooking = useMutation({
    mutationFn: (event: PgEvent) => api.cancelEventBooking(event.id),
    onSuccess: (_result, event) => {
      setCancelledEvents((prev) => [
        { ...event, isRegistered: false, canUploadPhotos: false },
        ...prev.filter((item) => item.id !== event.id),
      ])
      queryClient.setQueryData<ApiEvent[]>(
        photographerKeys.bookings(),
        (prev) => prev?.filter((item) => item.id !== event.id)
      )
    },
  })

  const bookingEventId = bookEvent.isPending
    ? bookEvent.variables
    : cancelBooking.isPending
      ? cancelBooking.variables.id
      : null

  // Filter Logic
  const bookedEvents = useMemo(
    () =>
      (bookingsQuery.data ?? []).map((event) =>
        mapBackendEventToPgEvent(event, true)
      ),
    [bookingsQuery.data]
  )
  const bookedEventIds = useMemo(
    () => new Set(bookedEvents.map((event) => event.id)),
    [bookedEvents]
  )
  const apiEvents = useMemo(
    () => (eventsQuery.data ?? []).map(mapApiEventToPgEvent),
    [eventsQuery.data]
  )
  const apiPhotoEvents = useMemo(
    () =>
      apiEvents.map((event) => ({
        ...event,
        isRegistered: bookedEventIds.has(event.id),
        status: "open" as const,
        canUploadPhotos: bookedEventIds.has(event.id),
      })),
    [apiEvents, bookedEventIds]
  )
  const apiUpcomingEvents = useMemo(
    () =>
      apiEvents.map((event) =>
        bookedEventIds.has(event.id)
          ? { ...event, isRegistered: true, status: "open" as const }
          : event
      ),
    [apiEvents, bookedEventIds]
  )
  const workspaceEvents = useMemo(() => {
    if (isAdmin) return []
    const readOnlyCancelledEvents = cancelledEvents.filter(
      (event) => !bookedEventIds.has(event.id)
    )
    const listedIds = new Set([
      ...bookedEventIds,
      ...readOnlyCancelledEvents.map((event) => event.id),
    ])
    const photoEventsWithoutDupes = apiPhotoEvents.filter(
      (event) => !listedIds.has(event.id)
    )
    return [
      ...bookedEvents,
      ...readOnlyCancelledEvents,
      ...photoEventsWithoutDupes,
    ]
  }, [apiPhotoEvents, bookedEventIds, bookedEvents, cancelledEvents, isAdmin])

  const eventSource = isAdmin
    ? apiEvents
    : view === "upcoming" || view === "previous"
      ? apiUpcomingEvents
      : workspaceEvents

  // Event name and photographer; not the city, which falls back to "Sweden"
  const term = searchTerm.trim().toLowerCase()
  const filteredEvents = eventSource.filter(
    (e) =>
      !term ||
      e.title.toLowerCase().includes(term) ||
      !!e.assignedPhotographers?.some((p) =>
        p.name.toLowerCase().includes(term)
      )
  )

  const myEvents = filteredEvents.filter(
    (e) => e.isRegistered || e.status === "open"
  )
  const latestPhotoUrlByEventId = useMemo(() => {
    const latestByEvent = new Map<string, { url: string; uploadedAt: number }>()

    workspacePhotos.forEach((photo) => {
      if (!photo.eventId || !photo.url) return

      const uploadTime = photo.uploadDate
        ? new Date(photo.uploadDate).getTime()
        : 0
      const uploadedAt = Number.isFinite(uploadTime) ? uploadTime : 0
      const current = latestByEvent.get(photo.eventId)

      if (!current || uploadedAt > current.uploadedAt) {
        latestByEvent.set(photo.eventId, {
          url: photo.url,
          uploadedAt,
        })
      }
    })

    return latestByEvent
  }, [workspacePhotos])
  const myEventsWithDisplayCovers = useMemo(
    () =>
      myEvents.map((event) => ({
        ...event,
        coverImage:
          event.coverImage || latestPhotoUrlByEventId.get(event.id)?.url || "",
      })),
    [latestPhotoUrlByEventId, myEvents]
  )
  // Admin "Live": events with photos, i.e. what buyers see on the site
  const liveEvents = filteredEvents.filter((e) => (e.photosCount ?? 0) > 0)
  const pastEvents = filteredEvents
    .filter((e) => isPreviousEventDate(e.date, e.endDate))
    .sort((a, b) => getEventSortTime(b.date) - getEventSortTime(a.date))
  const upcomingEvents = filteredEvents.filter(
    (e) =>
      e.status === "upcoming" &&
      !e.isRegistered &&
      !isPreviousEventDate(e.date, e.endDate)
  )
  const previousEvents = filteredEvents
    .filter((e) => isPreviousEventDate(e.date, e.endDate))
    .sort((a, b) => getEventSortTime(b.date) - getEventSortTime(a.date))

  const handleBookEvent = async (event: PgEvent, e?: React.MouseEvent) => {
    e?.stopPropagation()
    try {
      await bookEvent.mutateAsync(event.id)
      toast.add({ title: "Event booked.", type: "success" })
    } catch (error) {
      setActionError(
        error instanceof Error ? error.message : "Failed to book event"
      )
    }
  }

  // "Cancel booking" asks first (one click used to cancel right away)
  const requestCancelBooking = (event: PgEvent, e?: React.MouseEvent) => {
    e?.stopPropagation()
    setCancelBookingTarget(event)
  }

  const handleCancelBooking = async (event: PgEvent) => {
    try {
      await cancelBooking.mutateAsync(event)
      toast.add({ title: "Booking cancelled.", type: "success" })
      setCancelBookingTarget(null)
    } catch (error) {
      setCancelBookingTarget(null)
      setActionError(
        error instanceof Error ? error.message : "Failed to cancel booking"
      )
    }
  }

  const handleNavigateToEvent = (eventId: string) => {
    const basePath = isAdmin ? "/admin" : "/pg"
    navigate(`${basePath}/events/${eventId}`, { state: { fromTab: view } })
  }

  const handleOpenApiEvent = (event: PgEvent) => {
    if (isPhotographerApiEventView) {
      if (event.isRegistered) {
        handleNavigateToEvent(event.id)
        return
      }

      navigate(`/event/${event.id}`, {
        state: { from: "/pg/events", fromTab: view },
      })
      return
    }

    if (isAdmin) {
      handleNavigateToEvent(event.id)
    }
  }

  const activeList = useMemo(() => {
    if (isAdmin) {
      if (view === "live") return liveEvents
      if (view === "past") return pastEvents
      return upcomingEvents
    }
    if (view === "upcoming") return upcomingEvents
    if (view === "previous") return previousEvents
    return myEvents
  }, [
    filteredEvents,
    isAdmin,
    liveEvents,
    myEvents,
    pastEvents,
    previousEvents,
    upcomingEvents,
    view,
  ])
  const isPhotographerUpcomingView = !isAdmin && view === "upcoming"
  const isPhotographerApiEventView =
    isPhotographerUpcomingView || (!isAdmin && view === "previous")
  const isLoadingEventRows =
    isLoadingAdminEvents ||
    (isPhotographerApiEventView && isLoadingUpcomingEvents)
  // Waits for both lists (events + bookings): showing one first made cards jump
  // when the other arrived. isPending, so refetches keep the cards.
  const isPhotographerMyEventsLoading =
    !isAdmin &&
    view === "my" &&
    (!isClerkLoaded ||
      !isSignedIn ||
      !isAuthProfileLoaded ||
      isLoadingUpcomingEvents)

  const tabs: { value: EventsView; label: string }[] = isAdmin
    ? [
        { value: "live", label: "Live events" },
        { value: "upcoming", label: "Current" },
        { value: "past", label: "Past events" },
      ]
    : [
        { value: "my", label: "My events" },
        { value: "upcoming", label: "Current" },
        { value: "previous", label: "Previous" },
      ]

  const renderRowActions = (event: PgEvent, isApplied: boolean) => {
    if (isAdmin) {
      const photographer = event.assignedPhotographers?.[0]
      const showsApplications = view !== "past"
      // develop: the actions menu (edit, archive, delete) is hidden: no API for it yet
      return (
        <div className="flex items-center justify-end">
          <div className="flex flex-col items-start rounded-lg bg-muted px-3.5 py-1.5 text-muted-foreground">
            <span className="text-[0.65rem] leading-[1.2] font-semibold opacity-80">
              Photos
            </span>
            <span className="text-[0.8125rem] leading-[1.2] font-bold text-foreground">
              {event.photosCount ?? 0}
            </span>
          </div>

          {(showsApplications || photographer) && (
            <>
              <Separator
                orientation="vertical"
                className="mx-5 h-8 data-vertical:self-center"
              />
              <div className="flex shrink-0 items-center gap-3">
                {showsApplications && (
                  <ApplicationsTag
                    open={event.applicationsWelcomed !== false}
                  />
                )}
                {photographer && (
                  <img
                    src={photographer.avatar}
                    alt={photographer.name}
                    title={`Photographer: ${photographer.name}`}
                    className="size-7 rounded-full border-2 border-white object-cover shadow-[0_2px_4px_rgba(0,0,0,0.1)]"
                  />
                )}
              </div>
            </>
          )}
        </div>
      )
    }

    const chipButton = "font-medium"

    if (view === "previous" && isApplied) {
      return (
        <Button
          variant="outline"
          size="sm"
          className={chipButton}
          onClick={(e) => {
            e.stopPropagation()
            handleNavigateToEvent(event.id)
          }}
        >
          Manage uploads
        </Button>
      )
    }

    if (isApplied) {
      return (
        <Button
          variant="outline"
          size="sm"
          className={cn(
            chipButton,
            "hover:border-destructive/25 hover:bg-destructive/8 hover:text-destructive"
          )}
          onClick={(e) => requestCancelBooking(event, e)}
        >
          {bookingEventId === event.id ? "Cancelling..." : "Cancel booking"}
        </Button>
      )
    }

    if (event.applicationsWelcomed === false) {
      return <ApplicationsTag open={false} />
    }

    return (
      <Button
        variant="outline"
        size="sm"
        className={chipButton}
        onClick={(e) => handleBookEvent(event, e)}
      >
        {bookingEventId === event.id ? "Booking..." : "Book"}
      </Button>
    )
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="mb-8 border-b bg-card">
        <TitleHeader
          variant="workspace"
          title="Events"
          className="border-b-0 pb-5"
        />
        <div className="container">
          <WorkspaceTabs
            tabs={tabs}
            value={view}
            onChange={(next) => {
              setView(next)
              setActionError(null)
            }}
          />
        </div>
      </header>

      <div className="container">
        <FilterBar
          searchWidth="fixed"
          // develop: Country / County filters hidden; events have no county data yet
          filters={
            <ResetFiltersButton
              disabled={!searchTerm}
              onClick={() => setSearchTerm("")}
            />
          }
          search={
            <SearchInput
              value={searchTerm}
              onChange={setSearchTerm}
              placeholder="Search events..."
            />
          }
          meta={<>Showing {activeList.length} events</>}
        />
      </div>

      {isAdmin || isPhotographerApiEventView ? (
        <div aria-busy={isLoadingEventRows || undefined} className="container">
          {isLoadingEventRows ? (
            <>
              <span className="sr-only">Loading events…</span>
              {Array.from({ length: 6 }).map((_, index) => (
                <EventRowSkeleton key={index} />
              ))}
            </>
          ) : (isAdmin || isPhotographerApiEventView) && upcomingEventsError ? (
            <EmptyState
              icon={<AlertCircle />}
              title="Could not load events"
              description={upcomingEventsError}
            />
          ) : activeList.length === 0 ? (
            <EmptyState
              icon={<CalendarX2 />}
              title="No events available – yet"
              description="Try adjusting your filters or search to find matching events."
            />
          ) : (
            activeList.map((event) => {
              const isApplied = !isAdmin && event.isRegistered === true
              return (
                <div
                  key={event.id}
                  role="link"
                  tabIndex={0}
                  onClick={() => handleOpenApiEvent(event)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && e.target === e.currentTarget)
                      handleOpenApiEvent(event)
                  }}
                  className={cn(
                    "mb-3 grid cursor-pointer items-center gap-8 rounded-xl border bg-card px-5 py-4 transition-all duration-200 outline-none hover:-translate-y-px hover:border-[#d1d1d1] hover:shadow-[0_4px_12px_rgba(0,0,0,0.04)] focus-visible:ring-4 focus-visible:ring-ring/12",
                    isPhotographerApiEventView
                      ? "grid-cols-[1fr_auto]"
                      : "grid-cols-[56px_1fr_auto]",
                    isApplied && "bg-muted"
                  )}
                >
                  {!isPhotographerApiEventView && (
                    <div className="flex size-12 items-center justify-center overflow-hidden rounded-lg border border-muted bg-card">
                      <img
                        src={event.logo}
                        alt={event.title}
                        className="max-h-[80%] max-w-[80%] object-contain"
                      />
                    </div>
                  )}
                  <div>
                    <div className="text-xs leading-normal font-medium tracking-[0.5px] text-[#888] uppercase">
                      {event.dateRange}
                    </div>
                    <h3 className="my-1 text-sm leading-[1.4] font-bold text-foreground">
                      {event.title}
                    </h3>
                    <div className="flex items-center gap-1.5 text-sm leading-normal text-muted-foreground">
                      <span>{event.city}</span>
                      {event.venueName && (
                        <>
                          <span className="opacity-30">•</span>
                          <span>{event.venueName}</span>
                        </>
                      )}
                      {event.disciplines && (
                        <>
                          <span className="opacity-30">•</span>
                          <span>{event.disciplines.join(", ")}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {renderRowActions(event, isApplied)}
                  </div>
                </div>
              )
            })
          )}
        </div>
      ) : (
        <div
          aria-busy={isPhotographerMyEventsLoading || undefined}
          className="container grid grid-cols-3 gap-6 pt-4 max-lg:grid-cols-2 max-lg:gap-5 max-sm:grid-cols-1 max-sm:gap-4"
        >
          {isPhotographerMyEventsLoading ? (
            <>
              <span className="sr-only">Loading your events…</span>
              {Array.from({ length: 6 }).map((_, index) => (
                <PgEventCardSkeleton key={index} hideLogo />
              ))}
            </>
          ) : myEvents.length === 0 ? (
            <EmptyState
              icon={<CalendarPlus />}
              title="No events yet"
              description="Events you've joined or been assigned to will appear here."
            />
          ) : (
            myEventsWithDisplayCovers.map((event) => (
              <PgEventCard
                key={event.id}
                event={event}
                onCancelBooking={
                  event.canUploadPhotos !== false &&
                  bookedEventIds.has(event.id)
                    ? requestCancelBooking
                    : undefined
                }
                eventProfilePath={
                  event.canUploadPhotos === false
                    ? undefined
                    : bookedEventIds.has(event.id)
                      ? `/event/${event.id}`
                      : undefined
                }
                eventProfileState={
                  bookedEventIds.has(event.id)
                    ? { from: "/pg/events", fromTab: view }
                    : undefined
                }
                hideLogo={!isAdmin && view === "my"}
                fromTab={view}
              />
            ))
          )}
        </div>
      )}

      <ConfirmDialog
        open={!!cancelBookingTarget}
        onCancel={() => setCancelBookingTarget(null)}
        onConfirm={() => {
          if (cancelBookingTarget) void handleCancelBooking(cancelBookingTarget)
        }}
        busy={
          !!cancelBookingTarget && bookingEventId === cancelBookingTarget.id
        }
        title="Cancel booking?"
        description={
          <>
            You will no longer be booked for{" "}
            <strong>{cancelBookingTarget?.title}</strong>. You can book it again
            later if bookings are still open.
          </>
        }
        confirmLabel="Cancel booking"
        cancelLabel="Keep booking"
      />
    </div>
  )
}
