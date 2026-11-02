import { useCallback, useEffect, useMemo, useState } from "react"
import {
  useQueries,
  useQuery,
  type UseQueryResult,
} from "@tanstack/react-query"

import { useAuth } from "@/context/AuthContext"
import type { ApiPhoto } from "@/data/apiClient"
import {
  eventPhotoSearchQueryOptions,
  eventsListQueryOptions,
} from "@/data/queries/events"
import type { EventData } from "@/types"

interface PhotoSearchResult {
  query: string
  matchedIds: Record<string, true>
  matchLabels: Record<string, string>
  /** Per event: the query and the found photos' tag text, for the search bar */
  searchIndex: Record<string, string>
}

const NO_EVENTS: EventData[] = []
const NO_MATCHES: Record<string, true> = {}
const NO_LABELS: Record<string, string> = {}
const NO_SEARCH: PhotoSearchResult = {
  query: "",
  matchedIds: {},
  matchLabels: {},
  searchIndex: {},
}

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

/** The matches of one finished search, from each event's found photos */
function toPhotoSearchResult(
  query: string,
  results: Array<readonly [string, ApiPhoto[]]>
): PhotoSearchResult {
  const lowerQuery = query.toLowerCase()
  const result: PhotoSearchResult = {
    query,
    matchedIds: {},
    matchLabels: {},
    searchIndex: {},
  }

  results.forEach(([eventId, photos]) => {
    if (photos.length === 0) return
    result.matchedIds[eventId] = true
    const matchLabel = getBestMatchLabel(photos, lowerQuery)
    if (matchLabel) result.matchLabels[eventId] = matchLabel
    const photoText = photos
      .flatMap((photo) => [
        photo.photographer_display_name,
        photo.class_name,
        photo.event_class_name,
        ...(photo.tags ?? []).map((tag) => tag.value),
      ])
      .filter(Boolean)
      .join(" ")
    result.searchIndex[eventId] = [query, photoText].filter(Boolean).join(" ")
  })

  return result
}

/**
 * The public events list, filtered by a search query: the events' own
 * details plus their photos' tags (rider, horse, class, photographer).
 * Used by the home page and the header search on every other page.
 */
export function useEventSearch(searchQuery: string) {
  const { isLoaded, isAuthenticated, user } = useAuth()
  const shouldShowPhotoBackedEvents = !isAuthenticated || user?.role === "pg"

  const eventsQuery = useQuery({
    ...eventsListQueryOptions(shouldShowPhotoBackedEvents),
    enabled: isLoaded,
  })
  const events = eventsQuery.data ?? NO_EVENTS
  const isLoadingEvents = eventsQuery.isPending
  // Only when there is nothing to show (a failed refetch keeps the list)
  const eventsError = eventsQuery.data
    ? null
    : (eventsQuery.error?.message ?? null)

  const trimmedQuery = searchQuery.trim()
  const searchableEvents = useMemo(
    () => events.filter((event) => event.photoCount !== 0),
    [events]
  )
  const needsPhotoSearch =
    trimmedQuery.length >= 2 && searchableEvents.length > 0

  // The photo search runs once typing pauses
  const [debouncedQuery, setDebouncedQuery] = useState("")
  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedQuery(trimmedQuery), 250)
    return () => window.clearTimeout(timer)
  }, [trimmedQuery])
  const photoSearchQuery =
    needsPhotoSearch && debouncedQuery.length >= 2 ? debouncedQuery : ""

  // Search the photos' tags (rider, horse, class, photographer) of each event
  const combineSearch = useCallback(
    (results: UseQueryResult<ApiPhoto[]>[]) =>
      results.length > 0 && results.every((result) => result.isSuccess)
        ? toPhotoSearchResult(
            photoSearchQuery,
            results.map(
              (result, index) =>
                [searchableEvents[index].id, result.data] as const
            )
          )
        : null,
    [photoSearchQuery, searchableEvents]
  )
  const finishedSearch = useQueries({
    queries: photoSearchQuery
      ? searchableEvents.map((event) =>
          eventPhotoSearchQueryOptions(event.id, photoSearchQuery)
        )
      : [],
    combine: combineSearch,
  })

  /** Result of the last finished photo search; kept while the next one runs */
  const [photoSearch, setPhotoSearch] = useState(NO_SEARCH)
  if (finishedSearch && finishedSearch !== photoSearch) {
    setPhotoSearch(finishedSearch)
  }

  const photoMatchedEventIds = needsPhotoSearch
    ? photoSearch.matchedIds
    : NO_MATCHES
  const eventMatchLabels = needsPhotoSearch
    ? photoSearch.matchLabels
    : NO_LABELS
  const eventSearchIndex = photoSearch.searchIndex
  const isSearchingPhotoMetadata =
    needsPhotoSearch && photoSearch.query !== trimmedQuery

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

  return {
    isLoadingEvents,
    eventsError,
    filteredEvents,
    eventSearchIndex,
    eventMatchLabels,
    isSearchingPhotoMetadata,
  }
}
