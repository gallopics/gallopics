import { useCallback, useEffect, useMemo, useState } from "react"
import { useLocation, useNavigate } from "react-router"
import { useAuth as useClerkAuth } from "@clerk/clerk-react"
import {
  AlertCircle,
  Archive,
  CalendarPlus,
  CalendarX2,
  CheckCircle,
  Edit2,
  MoreHorizontal,
  Search,
  Trash2,
} from "lucide-react"

import { getEventSortTime, isPreviousEventDate } from "@/lib/eventDates"
import { assetUrl, cn } from "@/lib/utils"
import { useAuth } from "@/context/AuthContext"
import { usePhotographer, type PgEvent } from "@/context/PhotographerContext"
import { useWorkspace } from "@/context/WorkspaceContext"
import { api, ApiError, type ApiEvent } from "@/data/apiClient"
import { fetchEventsFromApi, mapApiEventToEventData } from "@/data/eventsApi"
import type { EventData } from "@/data/mockEvents"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Separator } from "@/components/ui/separator"
import { Spinner } from "@/components/ui/spinner"
import { toast } from "@/components/ui/toast"
import { ConfirmDialog } from "@/components/ConfirmDialog"
import { EmptyState } from "@/components/EmptyState"
import { FilterBar, ResetFiltersButton } from "@/components/FilterBar"
import { ModernDropdown } from "@/components/ModernDropdown"
import { SearchInput } from "@/components/SearchInput"
import { TitleHeader } from "@/components/TitleHeader"
import { WorkspaceTabs } from "@/components/WorkspaceTabs"
import { AddEventModal } from "@/pages/pg/components/AddEventModal"
import { CoverImagePickerModal } from "@/pages/pg/components/CoverImagePickerModal"
import { PgEventCard } from "@/pages/pg/components/PgEventCard"

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
  venueName: event.name,
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
  isRegistered,
  status: isRegistered ? "open" : "upcoming",
  canUploadPhotos: isRegistered,
})

export function EventsList() {
  const { isAdmin } = useWorkspace()
  const { isLoaded: isAuthProfileLoaded, user } = useAuth()
  const { events, allPhotos } = usePhotographer()
  const { getToken, isLoaded: isClerkLoaded, isSignedIn } = useClerkAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const initialTab = (location.state as any)?.tab
  const [view, setView] = useState<
    "my" | "upcoming" | "previous" | "live" | "past" | "archived"
  >(initialTab ?? (isAdmin ? "live" : "my"))
  const [county, setCounty] = useState("")
  const [searchTerm, setSearchTerm] = useState("")

  const [activePickerEventId, setActivePickerEventId] = useState<string | null>(
    null
  )
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [eventToEdit, setEventToEdit] = useState<any>(null)
  const [apiUpcomingEvents, setApiUpcomingEvents] = useState<PgEvent[]>([])
  const [apiPhotoEvents, setApiPhotoEvents] = useState<PgEvent[]>([])
  const [bookedEvents, setBookedEvents] = useState<PgEvent[]>([])
  const [cancelledBookingEventIds, setCancelledBookingEventIds] = useState<
    Set<string>
  >(new Set())
  const [bookingEventId, setBookingEventId] = useState<string | null>(null)
  const [isLoadingUpcomingEvents, setIsLoadingUpcomingEvents] = useState(false)
  const [upcomingEventsError, setUpcomingEventsError] = useState<string | null>(
    null
  )

  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean
    type: "archive" | "delete"
    event: any
  } | null>(null)

  const getSessionToken = useCallback(async () => {
    for (let attempt = 0; attempt < 6; attempt += 1) {
      const token = await getToken({ skipCache: attempt > 0 })
      if (token) {
        return token
      }

      await new Promise((resolve) => window.setTimeout(resolve, 250))
    }

    return null
  }, [getToken])

  const syncLocalPhotographerProfile = useCallback(async () => {
    if (!user || user.role === "admin") {
      return
    }

    await api.upsertMyPhotographer(getSessionToken, {
      slug: user.id,
      display_name: user.displayName || "Photographer",
      city: user.city || null,
      country: user.country || null,
      avatar_url: user.avatarUrl ?? null,
      phone: user.phone ?? null,
      is_available_to_hire: true,
    })
  }, [
    getSessionToken,
    user?.avatarUrl,
    user?.city,
    user?.country,
    user?.displayName,
    user?.id,
    user?.phone,
    user?.role,
  ])

  useEffect(() => {
    if (isAdmin) return
    if (!isClerkLoaded || !isSignedIn || !isAuthProfileLoaded) return

    let isMounted = true

    async function loadEvents() {
      try {
        setIsLoadingUpcomingEvents(true)
        setUpcomingEventsError(null)
        const apiEvents = await fetchEventsFromApi(
          view === "upcoming" || view === "previous"
            ? undefined
            : { hasPhotos: true }
        )
        let bookings: ApiEvent[] = []

        try {
          bookings = await api.listMyEventBookings(getSessionToken)
        } catch (bookingsError) {
          if (
            bookingsError instanceof ApiError &&
            bookingsError.status === 403
          ) {
            await syncLocalPhotographerProfile()
            bookings = await api.listMyEventBookings(getSessionToken)
          } else {
            console.warn("Failed to load event bookings", bookingsError)
          }
        }

        if (isMounted) {
          const booked = bookings.map((event) =>
            mapBackendEventToPgEvent(event, true)
          )
          const bookedIds = new Set(booked.map((event) => event.id))
          setBookedEvents(booked)
          setApiPhotoEvents(
            apiEvents.map(mapApiEventToPgEvent).map((event) => ({
              ...event,
              isRegistered: bookedIds.has(event.id),
              status: "open",
              canUploadPhotos: bookedIds.has(event.id),
            }))
          )
          setApiUpcomingEvents(
            apiEvents
              .map(mapApiEventToPgEvent)
              .map((event) =>
                bookedIds.has(event.id)
                  ? { ...event, isRegistered: true, status: "open" }
                  : event
              )
          )
        }
      } catch (error) {
        if (isMounted) {
          setUpcomingEventsError(
            error instanceof Error ? error.message : "Failed to load events"
          )
          setApiUpcomingEvents([])
          setApiPhotoEvents([])
          setBookedEvents([])
        }
      } finally {
        if (isMounted) setIsLoadingUpcomingEvents(false)
      }
    }

    void loadEvents()

    return () => {
      isMounted = false
    }
  }, [
    getSessionToken,
    isAdmin,
    isAuthProfileLoaded,
    isClerkLoaded,
    isSignedIn,
    syncLocalPhotographerProfile,
    view,
  ])

  // Filter Logic
  const bookedEventIds = useMemo(
    () => new Set(bookedEvents.map((event) => event.id)),
    [bookedEvents]
  )
  const workspaceEvents = useMemo(() => {
    if (isAdmin) return events
    const localEventsWithoutBookedApiDupes = events.filter(
      (event) => !bookedEventIds.has(event.id)
    )
    const localEventIds = new Set(events.map((event) => event.id))
    const photoEventsWithoutDupes = apiPhotoEvents.filter(
      (event) => !bookedEventIds.has(event.id) && !localEventIds.has(event.id)
    )
    const readOnlyCancelledEvents = localEventsWithoutBookedApiDupes.map(
      (event) =>
        cancelledBookingEventIds.has(event.id)
          ? { ...event, isRegistered: false, canUploadPhotos: false }
          : event
    )
    return [
      ...bookedEvents,
      ...readOnlyCancelledEvents,
      ...photoEventsWithoutDupes,
    ]
  }, [
    apiPhotoEvents,
    bookedEventIds,
    bookedEvents,
    cancelledBookingEventIds,
    events,
    isAdmin,
  ])

  const eventSource =
    !isAdmin && (view === "upcoming" || view === "previous")
      ? apiUpcomingEvents
      : workspaceEvents

  const filteredEvents = eventSource.filter((e) => {
    const matchesCounty =
      !county || e.city.toLowerCase().includes(county.toLowerCase())
    const matchesSearch =
      !searchTerm ||
      e.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (e.assignedPhotographers &&
        e.assignedPhotographers.some((p) =>
          p.name.toLowerCase().includes(searchTerm.toLowerCase())
        ))
    return matchesCounty && matchesSearch
  })

  const myEvents = filteredEvents.filter(
    (e) => e.isRegistered || e.status === "open"
  )
  const latestPhotoUrlByEventId = useMemo(() => {
    const latestByEvent = new Map<string, { url: string; uploadedAt: number }>()

    allPhotos.forEach((photo) => {
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
  }, [allPhotos])
  const myEventsWithDisplayCovers = useMemo(
    () =>
      myEvents.map((event) => ({
        ...event,
        coverImage:
          event.coverImage || latestPhotoUrlByEventId.get(event.id)?.url || "",
      })),
    [latestPhotoUrlByEventId, myEvents]
  )
  const liveEvents = filteredEvents.filter((e) => e.status === "open")
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
  const archivedEvents =
    filteredEvents.filter((e) => e.status === "archived").length > 0
      ? filteredEvents.filter((e) => e.status === "archived")
      : filteredEvents.slice(-2) // Fallback if no status match

  const handleBookEvent = async (event: PgEvent, e?: React.MouseEvent) => {
    e?.stopPropagation()
    try {
      setBookingEventId(event.id)
      let booked: ApiEvent
      try {
        booked = await api.bookEvent(getSessionToken, event.id)
      } catch (bookingError) {
        if (
          !(bookingError instanceof ApiError) ||
          bookingError.status !== 403
        ) {
          throw bookingError
        }

        await syncLocalPhotographerProfile()
        booked = await api.bookEvent(getSessionToken, event.id)
      }
      const bookedPgEvent = mapBackendEventToPgEvent(booked, true)
      setCancelledBookingEventIds((prev) => {
        const next = new Set(prev)
        next.delete(event.id)
        return next
      })
      setBookedEvents((prev) => [
        bookedPgEvent,
        ...prev.filter((item) => item.id !== event.id),
      ])
      setApiUpcomingEvents((prev) =>
        prev.map((item) =>
          item.id === event.id
            ? { ...item, isRegistered: true, status: "open" }
            : item
        )
      )
      toast.add({ title: "Event booked.", type: "success" })
    } catch (error) {
      setUpcomingEventsError(
        error instanceof Error ? error.message : "Failed to book event"
      )
    } finally {
      setBookingEventId(null)
    }
  }

  const handleCancelBooking = async (event: PgEvent, e?: React.MouseEvent) => {
    e?.stopPropagation()
    try {
      setBookingEventId(event.id)
      await api.cancelEventBooking(getSessionToken, event.id)
      setCancelledBookingEventIds((prev) => new Set(prev).add(event.id))
      setBookedEvents((prev) => prev.filter((item) => item.id !== event.id))
      setApiUpcomingEvents((prev) =>
        prev.map((item) =>
          item.id === event.id
            ? { ...item, isRegistered: false, status: "upcoming" }
            : item
        )
      )
      toast.add({ title: "Booking cancelled.", type: "success" })
    } catch (error) {
      setUpcomingEventsError(
        error instanceof Error ? error.message : "Failed to cancel booking"
      )
    } finally {
      setBookingEventId(null)
    }
  }

  const handleCoverChange = (eventId: string) => {
    setActivePickerEventId(eventId)
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
      if (view === "archived") return archivedEvents
      if (view === "upcoming") return upcomingEvents.slice(3)
      return upcomingEvents
    }
    if (view === "upcoming") return upcomingEvents
    if (view === "previous") return previousEvents
    return myEvents
  }, [
    archivedEvents,
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
  const isPhotographerMyEventsLoading =
    !isAdmin &&
    view === "my" &&
    (!isClerkLoaded ||
      !isSignedIn ||
      !isAuthProfileLoaded ||
      isLoadingUpcomingEvents) &&
    myEvents.length === 0

  const tabs: { value: EventsView; label: string }[] = isAdmin
    ? [
        { value: "live", label: "Live events" },
        { value: "past", label: "Past events" },
        { value: "upcoming", label: "Current" },
        { value: "archived", label: "Archived" },
      ]
    : [
        { value: "my", label: "My events" },
        { value: "upcoming", label: "Current" },
        { value: "previous", label: "Previous" },
      ]

  const openAddModal = (ev: PgEvent | null) => {
    setEventToEdit(ev)
    setIsAddModalOpen(true)
  }

  const renderRowActions = (event: PgEvent, isApplied: boolean) => {
    if (isAdmin) {
      const photographer = event.assignedPhotographers?.[0]
      return (
        <div className="flex items-center justify-end">
          {/* Stats for Live / Past / Archived */}
          {view !== "upcoming" && (
            <>
              <div className="flex flex-col items-start rounded-lg bg-muted px-3.5 py-1.5 text-muted-foreground">
                <span className="text-[0.65rem] leading-[1.2] font-semibold opacity-80">
                  Published
                </span>
                <span className="text-[0.8125rem] leading-[1.2] font-bold text-foreground">
                  {event.publishedCount ?? 0}
                </span>
              </div>
              <Separator
                orientation="vertical"
                className="mx-5 h-8 data-vertical:self-center"
              />
            </>
          )}

          <div className="flex shrink-0 items-center gap-3">
            {view !== "past" && view !== "archived" && (
              <ApplicationsTag open={event.applicationsWelcomed !== false} />
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

          <Separator
            orientation="vertical"
            className="mx-3 h-6 data-vertical:self-center"
          />
          <div onClick={(e) => e.stopPropagation()}>
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button
                    variant="outline"
                    size="icon-sm"
                    aria-label="Event actions"
                    className="text-muted-foreground"
                  />
                }
              >
                <MoreHorizontal className="size-4.5" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-max min-w-45">
                {view === "archived" ? (
                  <>
                    <DropdownMenuItem
                      onClick={() => handleNavigateToEvent(event.id)}
                    >
                      <Search />
                      View Dashboard
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => console.log("Make active", event.id)}
                    >
                      <CheckCircle />
                      Make active
                    </DropdownMenuItem>
                  </>
                ) : (
                  <>
                    <DropdownMenuItem
                      onClick={() => handleNavigateToEvent(event.id)}
                    >
                      <Search />
                      Manage uploads
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => openAddModal(event)}>
                      <Edit2 />
                      Edit Event
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() =>
                        setConfirmModal({
                          isOpen: true,
                          type: "archive",
                          event,
                        })
                      }
                    >
                      <Archive />
                      Archive
                    </DropdownMenuItem>
                  </>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  variant="destructive"
                  onClick={() =>
                    setConfirmModal({ isOpen: true, type: "delete", event })
                  }
                >
                  <Trash2 />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
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
          onClick={(e) => handleCancelBooking(event, e)}
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
          rightContent={
            isAdmin && (
              <Button size="sm" onClick={() => openAddModal(null)}>
                Add an event
              </Button>
            )
          }
        />
        <div className="container">
          <WorkspaceTabs
            tabs={tabs}
            value={view}
            onChange={(next) => setView(next)}
          />
        </div>
      </header>

      <div className="container">
        <FilterBar
          searchWidth="fixed"
          filters={
            <>
              <ModernDropdown
                value="Sweden"
                options={[{ label: "Sweden", value: "Sweden", icon: "🇸🇪" }]}
                onChange={() => {}}
                variant="pill"
                label="Country"
              />
              <ModernDropdown
                value={county}
                options={[
                  { label: "All counties", value: "" },
                  { label: "Skåne", value: "Skane" },
                  { label: "Stockholm", value: "Stockholm" },
                  { label: "Västra Götaland", value: "VastraGotaland" },
                ]}
                onChange={(val) => setCounty(val)}
                placeholder="Select county"
                variant="pill"
                label="County"
              />
              <ResetFiltersButton
                disabled={!county && !searchTerm}
                onClick={() => {
                  setCounty("")
                  setSearchTerm("")
                }}
              />
            </>
          }
          search={
            <SearchInput
              value={searchTerm}
              onChange={setSearchTerm}
              placeholder="Search event name, city, organiser..."
            />
          }
          meta={<>Showing {activeList.length} events</>}
        />
      </div>

      {isAdmin || isPhotographerApiEventView ? (
        <div className="container">
          {isPhotographerApiEventView && isLoadingUpcomingEvents ? (
            <EmptyState
              icon={<CalendarPlus />}
              title="Loading events..."
              description="Fetching the latest event list."
            />
          ) : isPhotographerApiEventView && upcomingEventsError ? (
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
        <div className="container grid grid-cols-3 gap-6 pt-4 max-lg:grid-cols-2 max-lg:gap-5 max-sm:grid-cols-1 max-sm:gap-4">
          {isPhotographerMyEventsLoading ? (
            <EmptyState
              icon={<Spinner className="text-primary" />}
              title="Loading your events..."
              description="Fetching the events you've joined or been assigned to."
            />
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
                onCoverChange={handleCoverChange}
                onCancelBooking={
                  event.canUploadPhotos !== false &&
                  bookedEventIds.has(event.id)
                    ? handleCancelBooking
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
                onEdit={(ev) => openAddModal(ev)}
              />
            ))
          )}
        </div>
      )}

      <CoverImagePickerModal
        isOpen={!!activePickerEventId}
        onClose={() => setActivePickerEventId(null)}
        eventId={activePickerEventId || ""}
        onSelect={(url) => {
          console.log("New cover selected:", url)
        }}
      />

      <AddEventModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false)
          setEventToEdit(null)
        }}
        eventToEdit={eventToEdit}
      />

      <ConfirmDialog
        open={!!confirmModal?.isOpen}
        onCancel={() => setConfirmModal(null)}
        onConfirm={() => {
          // Mock action, as in the old app
          console.log(
            `${confirmModal?.type}ing event:`,
            confirmModal?.event?.id
          )
          setConfirmModal(null)
        }}
        title={
          confirmModal?.type === "archive" ? "Archive event?" : "Delete event?"
        }
        description={
          confirmModal?.type === "archive" ? (
            <>
              Are you sure you want to archive{" "}
              <strong>{confirmModal?.event?.title}</strong>? It will be moved to
              the Archived tab.
            </>
          ) : (
            <>
              This will permanently delete{" "}
              <strong>{confirmModal?.event?.title}</strong>. This action cannot
              be undone.
            </>
          )
        }
        confirmLabel={confirmModal?.type === "archive" ? "Archive" : "Delete"}
      />
    </div>
  )
}
