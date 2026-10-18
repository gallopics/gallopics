import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router"

import { useAuth } from "@/context/AuthContext"
import { api, type ApiPhoto } from "@/data/apiClient"
import {
  fetchEventsFromApi,
  fetchEventsWithPhotosFromApi,
  fetchLatestPublicEventPhotoUrl,
} from "@/data/eventsApi"
import type { EventData } from "@/data/mockEvents"
import { EmptyState } from "@/components/EmptyState"
import { FolderEventCard } from "@/components/FolderEventCard"
import { Footer } from "@/components/Footer"
import { Header } from "@/components/Header"
import { HomeHero } from "@/components/HomeHero"
import type { EventSearchProps } from "@/components/ModernSearchBar"

interface PhotoSearchResult {
  query: string
  matchedIds: Record<string, true>
  matchLabels: Record<string, string>
}

const NO_MATCHES: Record<string, true> = {}
const NO_LABELS: Record<string, string> = {}

const TAG_LABELS: Record<string, string> = {
  rider: "Rider",
  horse: "Horse",
  class: "Class",
}

/** How well a tag value matches the query (higher is better) */
function getMatchScore(value: string, lowerQuery: string) {
  const normalizedValue = value.trim().toLowerCase()
  if (!normalizedValue) return 0
  if (normalizedValue === lowerQuery) return 5
  if (normalizedValue.startsWith(lowerQuery)) return 4
  if (normalizedValue.split(/\s+/).some((word) => word.startsWith(lowerQuery)))
    return 3
  if (normalizedValue.includes(lowerQuery)) return 2
  return 1
}

/** e.g. "Rider: Anna Svensson" — the best matching tag of the found photos */
function getBestMatchLabel(photos: ApiPhoto[], lowerQuery: string) {
  const candidates = photos.flatMap((photo) => [
    ...(photo.tags ?? []).map((tag) => ({
      label: TAG_LABELS[tag.type] ?? tag.type,
      value: tag.value,
    })),
    { label: "Photographer", value: photo.photographer_display_name || "" },
  ])

  const bestCandidate = candidates
    .filter((candidate) => candidate.value)
    .sort(
      (a, b) =>
        getMatchScore(b.value, lowerQuery) -
          getMatchScore(a.value, lowerQuery) || a.value.length - b.value.length
    )[0]

  return bestCandidate ? `${bestCandidate.label}: ${bestCandidate.value}` : ""
}

/** Photos of one event that match the query (tags, or photographer name) */
async function searchEventPhotos(eventId: string, query: string) {
  try {
    const [searchedPhotos, galleryPage] = await Promise.all([
      api.searchGallery(eventId, query),
      api.getEventGallery(eventId, 1, 25),
    ])
    const photographerMatches = galleryPage.items.filter((photo) =>
      (photo.photographer_display_name || "")
        .toLowerCase()
        .includes(query.toLowerCase())
    )
    const photosById = new Map(
      [...searchedPhotos, ...photographerMatches].map((photo) => [
        photo.id,
        photo,
      ])
    )
    return [eventId, Array.from(photosById.values())] as const
  } catch (error) {
    console.warn(`Failed to search photo metadata for event ${eventId}`, error)
    return [eventId, [] as ApiPhoto[]] as const
  }
}

export function EventsPage() {
  const navigate = useNavigate()
  const { isLoaded, isAuthenticated, user } = useAuth()

  const [events, setEvents] = useState<EventData[]>([])
  const [latestPhotoCoverUrls, setLatestPhotoCoverUrls] = useState<
    Record<string, string | null>
  >({})
  const [isLoadingEvents, setIsLoadingEvents] = useState(true)
  const [eventsError, setEventsError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [eventSearchIndex, setEventSearchIndex] = useState<
    Record<string, string>
  >({})
  /** Result of the last finished photo search, with the query it was for */
  const [photoSearch, setPhotoSearch] = useState<PhotoSearchResult>({
    query: "",
    matchedIds: {},
    matchLabels: {},
  })
  const shouldShowPhotoBackedEvents = !isAuthenticated || user?.role === "pg"

  useEffect(() => {
    if (!isLoaded) return

    let isMounted = true

    async function loadEvents() {
      try {
        setIsLoadingEvents(true)
        setEventsError(null)
        const nextEvents = shouldShowPhotoBackedEvents
          ? await fetchEventsWithPhotosFromApi()
          : await fetchEventsFromApi()

        if (isMounted) setEvents(nextEvents)
      } catch (error) {
        if (isMounted) {
          setEventsError(
            error instanceof Error ? error.message : "Failed to load events"
          )
        }
      } finally {
        if (isMounted) setIsLoadingEvents(false)
      }
    }

    void loadEvents()

    return () => {
      isMounted = false
    }
  }, [isLoaded, shouldShowPhotoBackedEvents])

  const trimmedQuery = searchQuery.trim()
  const searchableEvents = useMemo(
    () => events.filter((event) => event.photoCount !== 0),
    [events]
  )
  const needsPhotoSearch =
    trimmedQuery.length >= 2 && searchableEvents.length > 0
  // Keep the previous matches until the new search finishes
  const photoMatchedEventIds = needsPhotoSearch
    ? photoSearch.matchedIds
    : NO_MATCHES
  const eventMatchLabels = needsPhotoSearch
    ? photoSearch.matchLabels
    : NO_LABELS
  const isSearchingPhotoMetadata =
    needsPhotoSearch && photoSearch.query !== trimmedQuery

  // Search the photos' tags (rider, horse, class, photographer) of each event
  useEffect(() => {
    if (!needsPhotoSearch) return

    const query = trimmedQuery
    let isMounted = true

    const searchTimer = window.setTimeout(async () => {
      const results = await Promise.all(
        searchableEvents.map((event) => searchEventPhotos(event.id, query))
      )

      if (!isMounted) return

      const lowerQuery = query.toLowerCase()
      const nextMatchedIds: Record<string, true> = {}
      const nextMatchLabels: Record<string, string> = {}

      results.forEach(([eventId, photos]) => {
        if (photos.length === 0) return
        nextMatchedIds[eventId] = true
        const matchLabel = getBestMatchLabel(photos, lowerQuery)
        if (matchLabel) nextMatchLabels[eventId] = matchLabel
      })

      setEventSearchIndex((prev) => {
        const next = { ...prev }
        results.forEach(([eventId, photos]) => {
          if (photos.length === 0) return
          const photoText = photos
            .flatMap((photo) => [
              photo.photographer_display_name,
              photo.class_name,
              photo.event_class_name,
              ...(photo.tags ?? []).map((tag) => tag.value),
            ])
            .filter(Boolean)
            .join(" ")
          next[eventId] = [next[eventId], query, photoText]
            .filter(Boolean)
            .join(" ")
        })
        return next
      })
      setPhotoSearch({
        query,
        matchedIds: nextMatchedIds,
        matchLabels: nextMatchLabels,
      })
    }, 250)

    return () => {
      isMounted = false
      window.clearTimeout(searchTimer)
    }
  }, [needsPhotoSearch, searchableEvents, trimmedQuery])

  const filteredEvents = useMemo(() => {
    const query = trimmedQuery.toLowerCase()
    if (!query) return events

    return events.filter((event) => {
      const searchableText = [
        event.name,
        event.city,
        event.country,
        event.discipline,
        event.photographer?.name,
        eventSearchIndex[event.id],
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()

      return (
        searchableText.includes(query) ||
        Boolean(photoMatchedEventIds[event.id])
      )
    })
  }, [events, eventSearchIndex, photoMatchedEventIds, trimmedQuery])

  // Events without a cover image fall back to their latest public photo
  useEffect(() => {
    const eventsMissingCovers = filteredEvents.filter(
      (event) =>
        !event.coverImage &&
        event.photoCount !== 0 &&
        !Object.prototype.hasOwnProperty.call(latestPhotoCoverUrls, event.id)
    )

    if (eventsMissingCovers.length === 0) return

    let isMounted = true

    async function loadLatestPhotoCovers() {
      const coverEntries = await Promise.all(
        eventsMissingCovers.map(async (event) => {
          try {
            const url = await fetchLatestPublicEventPhotoUrl(event.id)
            return [event.id, url] as const
          } catch (error) {
            console.warn(
              `Failed to load fallback cover for event ${event.id}`,
              error
            )
            return [event.id, null] as const
          }
        })
      )

      if (!isMounted) return

      setLatestPhotoCoverUrls((prev) => {
        const next = { ...prev }
        coverEntries.forEach(([eventId, url]) => {
          next[eventId] = url
        })
        return next
      })
    }

    void loadLatestPhotoCovers()

    return () => {
      isMounted = false
    }
  }, [filteredEvents, latestPhotoCoverUrls])

  const displayEvents = useMemo(
    () =>
      filteredEvents.map((event) => {
        const latestPhotoCoverUrl = latestPhotoCoverUrls[event.id]
        if (event.coverImage || !latestPhotoCoverUrl) return event
        return { ...event, coverImage: latestPhotoCoverUrl }
      }),
    [filteredEvents, latestPhotoCoverUrls]
  )

  const search: EventSearchProps = {
    searchEvents: displayEvents,
    eventSearchIndex,
    eventMatchLabels,
    onSearchChange: setSearchQuery,
  }

  return (
    <div className="flex min-h-screen flex-col bg-[linear-gradient(180deg,#e2e5eb_0%,var(--background)_40%)]">
      <Header {...search} />

      <HomeHero
        title="Your best moments, captured"
        description="We capture horse competitions across Sweden. Search your event, spot your photos, and purchase your favorites."
        search={search}
      />

      <section className="min-h-100 pt-6 pb-16">
        <div className="container">
          <h2 className="mb-6 font-heading text-2xl leading-[1.2] font-semibold tracking-[-0.02em] text-foreground">
            Browse events
          </h2>

          {isLoadingEvents ? (
            <EmptyState title="Loading events..." />
          ) : eventsError ? (
            <EmptyState
              title="Events could not be loaded"
              description={eventsError}
            />
          ) : displayEvents.length > 0 ? (
            <div className="grid w-full grid-cols-4 gap-6 max-[1200px]:grid-cols-3 max-[1200px]:gap-5 max-[900px]:grid-cols-2 max-[900px]:gap-4 max-[600px]:grid-cols-1">
              {displayEvents.map((event) => (
                <FolderEventCard
                  key={event.id}
                  event={event}
                  onClick={(id) => navigate(`/event/${id}`)}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              title={
                isSearchingPhotoMetadata
                  ? "Searching photos..."
                  : trimmedQuery
                    ? `No events match "${trimmedQuery}"`
                    : "No events available – yet"
              }
            />
          )}
        </div>
      </section>

      <Footer />
    </div>
  )
}
