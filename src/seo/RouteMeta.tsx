/**
 * Page meta for each route, rendered next to the page in App.tsx. The data
 * pages read the same React Query cache entries as the page itself, so this
 * adds no requests.
 */
import { useParams } from "react-router"
import { PageMeta } from "@/seo/PageMeta"
import {
  eventMeta,
  photographerMeta,
  photoMeta,
  seoTexts,
} from "@/seo/seoTexts"
import { useQuery } from "@tanstack/react-query"

import { ApiError, isUuid } from "@/data/apiClient"
import { eventQueryOptions } from "@/data/queries/events"
import {
  photoQueryOptions,
  publicPhotographerQueryOptions,
} from "@/data/queries/photos"

/** 404 / 422 (not a valid ID): the page shows "not found" */
const isNotFound = (error: unknown) =>
  error instanceof ApiError && (error.status === 404 || error.status === 422)

/** Private pages: kept out of search results, no SEO texts */
export function NoIndexMeta() {
  return <PageMeta title={seoTexts.plainTitle} noindex />
}

export function StaticPageMeta({
  page,
}: {
  page: "home" | "faq" | "privacy" | "terms"
}) {
  return <PageMeta {...seoTexts[page]} />
}

export function EventMeta() {
  const { eventId = "" } = useParams()
  const { data: event, error } = useQuery({
    ...eventQueryOptions(eventId),
    enabled: !!eventId,
  })

  if (event) return <PageMeta {...eventMeta(event)} />
  return <PageMeta title={seoTexts.plainTitle} noindex={isNotFound(error)} />
}

export function PhotographerMeta() {
  const { id = "" } = useParams()
  const { data: photographer, error } = useQuery(
    publicPhotographerQueryOptions(id)
  )

  if (photographer) {
    return (
      <PageMeta
        {...photographerMeta(photographer)}
        // One canonical whether the URL uses the slug or the id
        canonicalPath={`/photographer/${photographer.slug || photographer.id}`}
      />
    )
  }
  return <PageMeta title={seoTexts.plainTitle} noindex={isNotFound(error)} />
}

export function PhotoMeta() {
  const { id = "" } = useParams()
  const { data: photo, error: photoError } = useQuery({
    ...photoQueryOptions(id),
    enabled: !!id,
  })
  const eventId = photo?.event_id ?? ""
  // Same guard as ImageProfile, so this is the page's own event request
  const { data: event } = useQuery({
    ...eventQueryOptions(eventId),
    enabled: isUuid(eventId),
  })

  if (event) return <PageMeta {...photoMeta(event)} />
  // Only a missing photo hides the page; it still renders without its event
  return (
    <PageMeta title={seoTexts.plainTitle} noindex={isNotFound(photoError)} />
  )
}
