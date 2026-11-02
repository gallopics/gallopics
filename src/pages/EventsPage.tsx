import { useMemo, useState } from "react"
import { useNavigate } from "react-router"
import { useQueries, type UseQueryResult } from "@tanstack/react-query"

import { useEventSearch } from "@/hooks/useEventSearch"
import type { ApiPhoto, PaginatedResponse } from "@/data/apiClient"
import { pickLatestPhotoUrl } from "@/data/eventsApi"
import { eventGalleryQueryOptions } from "@/data/queries/events"
import { EmptyState } from "@/components/EmptyState"
import {
  EventCardSkeleton,
  FolderEventCard,
} from "@/components/FolderEventCard"
import { Footer } from "@/components/Footer"
import { Header } from "@/components/Header"
import { HomeHero } from "@/components/HomeHero"
import type { EventSearchProps } from "@/components/ModernSearchBar"

/** The events grid; the loading skeleton uses the same one */
const eventGridClass =
  "grid w-full grid-cols-4 gap-6 max-[1200px]:grid-cols-3 max-[1200px]:gap-5 max-[900px]:grid-cols-2 max-[900px]:gap-4 max-[600px]:grid-cols-1"

const selectLatestPhotoUrl = (page: PaginatedResponse<ApiPhoto>) =>
  pickLatestPhotoUrl(page.items)

const combineCoverUrls = (results: UseQueryResult<string | null>[]) =>
  results.map((result) => result.data ?? null)

export function EventsPage() {
  const navigate = useNavigate()

  const [searchQuery, setSearchQuery] = useState("")
  const trimmedQuery = searchQuery.trim()
  const {
    isLoadingEvents,
    eventsError,
    filteredEvents,
    eventSearchIndex,
    eventMatchLabels,
    isSearchingPhotoMetadata,
  } = useEventSearch(searchQuery)

  // Events without a cover image fall back to their latest public photo
  const eventsMissingCovers = useMemo(
    () =>
      filteredEvents.filter(
        (event) => !event.coverImage && event.photoCount !== 0
      ),
    [filteredEvents]
  )
  const latestPhotoCoverUrls = useQueries({
    queries: eventsMissingCovers.map((event) => ({
      ...eventGalleryQueryOptions(event.id, 20),
      select: selectLatestPhotoUrl,
    })),
    combine: combineCoverUrls,
  })

  const displayEvents = useMemo(() => {
    const coverByEventId = new Map(
      eventsMissingCovers.map((event, index) => [
        event.id,
        latestPhotoCoverUrls[index],
      ])
    )
    return filteredEvents.map((event) => {
      const latestPhotoCoverUrl = coverByEventId.get(event.id)
      if (event.coverImage || !latestPhotoCoverUrl) return event
      return { ...event, coverImage: latestPhotoCoverUrl }
    })
  }, [eventsMissingCovers, filteredEvents, latestPhotoCoverUrls])

  const search: EventSearchProps = {
    searchEvents: displayEvents,
    eventSearchIndex,
    eventMatchLabels,
    isSearching: isSearchingPhotoMetadata,
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
            <div aria-busy="true" className={eventGridClass}>
              <span className="sr-only">Loading events…</span>
              {Array.from({ length: 8 }).map((_, index) => (
                <EventCardSkeleton key={index} />
              ))}
            </div>
          ) : eventsError ? (
            <EmptyState
              title="Events could not be loaded"
              description={eventsError}
            />
          ) : displayEvents.length > 0 ? (
            <div className={eventGridClass}>
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
