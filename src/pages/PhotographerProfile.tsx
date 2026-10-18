import { useEffect, useMemo, useState } from "react"
import { useNavigate, useParams, useSearchParams } from "react-router"
import {
  CalendarDays,
  ChevronLeft,
  Images,
  Music2,
  Pencil,
  Search,
} from "lucide-react"

import { useAuth } from "@/context/AuthContext"
import { usePhotographer } from "@/context/PhotographerContext"
import {
  api,
  ApiError,
  resolveApiAssetUrl,
  type ApiPhoto,
  type ApiPhotographer,
} from "@/data/apiClient"
import { getActivePhotographerProfile, PHOTOGRAPHERS } from "@/data/mockData"
import { mockEvents } from "@/data/mockEvents"
import type { Photo } from "@/types"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Breadcrumbs } from "@/components/Breadcrumbs"
import type { BreadcrumbItem } from "@/components/Breadcrumbs"
import { DotList } from "@/components/DotList"
import { EmptyState } from "@/components/EmptyState"
import { Footer } from "@/components/Footer"
import { Header } from "@/components/Header"
import {
  ActionCluster,
  ActionIconButton,
  ActionSeparator,
} from "@/components/HeaderActions"
import { Highlights } from "@/components/Highlights"
import { InstagramIcon } from "@/components/icons/InstagramIcon"
import { ManageHighlightsModal } from "@/components/ManageHighlightsModal"
import { MasonryGrid } from "@/components/MasonryGrid"
import { PhotoCard } from "@/components/PhotoCard"
import { TitleHeader } from "@/components/TitleHeader"

/** Event / class tile in the photographer's gallery */
function GalleryCard({
  cover,
  title,
  icon,
  subtitle,
  meta,
  onClick,
}: {
  cover: string
  title: string
  icon: React.ReactNode
  subtitle: React.ReactNode
  meta: React.ReactNode
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex min-h-75 cursor-pointer flex-col overflow-hidden rounded-lg border bg-card text-left shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-[transform,border-color,box-shadow] duration-200 hover:-translate-y-0.5 hover:border-primary/28 hover:shadow-[0_12px_28px_rgba(15,23,42,0.1)]"
    >
      <img
        src={cover}
        alt=""
        className="aspect-4/3 w-full bg-muted object-cover"
      />
      <div className="flex flex-1 flex-col gap-2 p-3.5">
        <h3 className="text-base leading-[1.25] font-bold text-foreground">
          {title}
        </h3>
        <p className="flex items-center gap-1.5 text-sm leading-[1.35] text-muted-foreground [&_svg]:size-3.5">
          {icon}
          {subtitle}
        </p>
        <div className="mt-auto flex flex-wrap gap-2 text-xs text-muted-foreground">
          {meta}
        </div>
      </div>
    </button>
  )
}

export function PhotographerProfile() {
  const { id = "hanna-bjork" } = useParams()
  const navigate = useNavigate()
  const { user: authUser } = useAuth()

  // Params
  const [searchParams] = useSearchParams()
  const from = searchParams.get("from")
  const eventId = searchParams.get("eventId")
  const sourceEvent = eventId ? mockEvents.find((e) => e.id === eventId) : null

  const [photos, setPhotos] = useState<Photo[]>([])
  const [apiPhotographer, setApiPhotographer] =
    useState<ApiPhotographer | null>(null)
  const [isLoadingApiPhotographer, setIsLoadingApiPhotographer] = useState(true)
  const [apiHighlightPhotos, setApiHighlightPhotos] = useState<Photo[]>([])
  const [activeTab, setActiveTab] = useState<"highlights" | "photos">(
    "highlights"
  )
  const [galleryEventId, setGalleryEventId] = useState("")
  const [galleryClassKey, setGalleryClassKey] = useState("")

  // Breadcrumbs
  const {
    photographerId: loggedInId,
    updateHighlights,
    highlights: contextHighlights,
    allPhotos: contextPhotos,
    events: contextEvents,
    availableToHire,
  } = usePhotographer()
  const isOwner = id === loggedInId
  const [isHighlightsModalOpen, setIsHighlightsModalOpen] = useState(false)

  useEffect(() => {
    let isMounted = true
    setIsLoadingApiPhotographer(true)

    api
      .getPublicPhotographer(id)
      .then((profile) => {
        if (isMounted) {
          setApiPhotographer(profile)
        }
      })
      .catch((error) => {
        if (!(error instanceof ApiError && error.status === 404)) {
          console.error("Failed to load photographer profile", error)
        }
        if (isMounted) {
          setApiPhotographer(null)
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoadingApiPhotographer(false)
        }
      })

    return () => {
      isMounted = false
    }
  }, [id])

  const activeProfile = useMemo(() => {
    const isKnownMockPhotographer = PHOTOGRAPHERS.some((p) => p.id === id)
    if (
      !apiPhotographer &&
      isLoadingApiPhotographer &&
      !isKnownMockPhotographer
    ) {
      return null
    }

    const baseProfile = getActivePhotographerProfile(id)
    if (apiPhotographer) {
      const [firstName = apiPhotographer.display_name, ...lastNameParts] =
        apiPhotographer.display_name.split(" ")

      return {
        ...baseProfile,
        photographer: {
          ...baseProfile.photographer,
          id: apiPhotographer.slug,
          firstName,
          lastName: lastNameParts.join(" "),
          city: apiPhotographer.city || "",
          countryCode:
            apiPhotographer.country || baseProfile.photographer.countryCode,
          avatarUrl: apiPhotographer.avatar_url,
          highlights: apiPhotographer.highlights || [],
          isAvailableToHire: apiPhotographer.is_available_to_hire,
        },
        dummyEvents: [],
      }
    }

    const isKnownPhotographer = baseProfile.photographer.id === id

    if (isKnownPhotographer || !isOwner || !authUser) {
      return baseProfile
    }

    const [firstName = authUser.displayName, ...lastNameParts] =
      authUser.displayName.split(" ")

    return {
      ...baseProfile,
      photographer: {
        ...baseProfile.photographer,
        id,
        firstName,
        lastName: lastNameParts.join(" "),
        city: authUser.city,
        countryCode: authUser.country || baseProfile.photographer.countryCode,
        avatarUrl: authUser.avatarUrl || null,
        highlights: [],
        isAvailableToHire: availableToHire,
      },
      dummyEvents: [],
    }
  }, [id, apiPhotographer, isOwner, authUser, availableToHire])
  const photographer = activeProfile?.photographer

  useEffect(() => {
    let isMounted = true

    const fetchHighlightPhotos = async () => {
      if (isOwner || !apiPhotographer?.highlights?.length) {
        if (isMounted) setApiHighlightPhotos([])
        return
      }

      const responses = await Promise.allSettled(
        apiPhotographer.highlights
          .slice(0, 10)
          .map((photoId) => api.getPhoto(photoId))
      )

      if (!isMounted) return

      const mappedPhotos = responses
        .map((result) => (result.status === "fulfilled" ? result.value : null))
        .filter((photo): photo is ApiPhoto => Boolean(photo))
        .map((photo) => {
          const ev = contextEvents.find((e) => e.id === photo.event_id)
          return {
            id: photo.id,
            src:
              resolveApiAssetUrl(
                `/api/v1/photographer/photos/${photo.id}/preview`
              ) || "",
            rider:
              photo.tags.find((tag) => tag.type === "rider")?.value ||
              "Unknown",
            horse:
              photo.tags.find((tag) => tag.type === "horse")?.value ||
              "Unknown",
            event: ev?.title || "Event",
            eventId: photo.event_id,
            date:
              ev?.date ||
              new Date(photo.created_at).toLocaleDateString(undefined, {
                day: "numeric",
                month: "short",
                year: "numeric",
              }),
            width: 600,
            height: 800,
            className: photo.class_name || "Class A",
            time: new Date(photo.created_at).toLocaleTimeString().slice(0, 5),
            city: ev?.city || "Sweden",
            arena: ev?.venueName || "Main Arena",
            countryCode: "SE",
            discipline: ev?.disciplines?.[0] || "Showjumping",
          }
        })

      setApiHighlightPhotos(mappedPhotos)
    }

    fetchHighlightPhotos().catch((error) => {
      if (isMounted) {
        setApiHighlightPhotos([])
      }
      console.error("Failed to load photographer highlights", error)
    })

    return () => {
      isMounted = false
    }
  }, [apiPhotographer, contextEvents, isOwner])

  const breadcrumbs = useMemo<BreadcrumbItem[]>(() => {
    const items: BreadcrumbItem[] = [
      { label: "Events", onClick: () => navigate("/") },
    ]
    if ((from === "event" || from === "ipro") && sourceEvent) {
      items.push({
        label: sourceEvent.name,
        onClick: () => navigate(`/event/${eventId}`),
      })
    }
    if (photographer) {
      items.push({
        label: `${photographer.firstName} ${photographer.lastName}`,
        active: true,
      })
    }
    return items
  }, [from, sourceEvent, eventId, photographer, navigate])

  // develop: mock photos removed
  useEffect(() => {
    setPhotos([])
  }, [id])

  useEffect(() => {
    setGalleryEventId("")
    setGalleryClassKey("")
  }, [id, activeTab])

  const profilePhotos: Photo[] = useMemo(() => {
    if (isOwner) {
      return contextPhotos.map((p) => {
        const ev = contextEvents.find((e) => e.id === p.eventId)
        return {
          id: p.id,
          src: p.url,
          rider: p.rider || "Unassigned",
          horse: p.horse || p.fileName || "Unassigned",
          event: ev?.title || "Event",
          eventId: p.eventId,
          date: ev?.date || p.uploadDate || "Today",
          width: p.width,
          height: p.height,
          className: p.className || "Unassigned class",
          time: p.timestamp || "12:00",
          city: ev?.city || "Sweden",
          arena: ev?.venueName || "Main Arena",
          countryCode: "SE",
          discipline: ev?.disciplines?.[0] || "Showjumping",
          photographer: photographer
            ? `${photographer.firstName} ${photographer.lastName}`.trim()
            : undefined,
          photographerId: loggedInId,
        }
      })
    }

    return photos
  }, [contextEvents, contextPhotos, isOwner, loggedInId, photographer, photos])

  const galleryEvents = useMemo(() => {
    const groups = new Map<
      string,
      {
        id: string
        title: string
        date: string
        city: string
        cover: string
        photos: Photo[]
      }
    >()

    profilePhotos.forEach((photo) => {
      const event = contextEvents.find((e) => e.id === photo.eventId)
      const fallbackEvent = mockEvents.find((e) => e.id === photo.eventId)
      const existing = groups.get(photo.eventId)

      if (existing) {
        existing.photos.push(photo)
        return
      }

      groups.set(photo.eventId, {
        id: photo.eventId,
        title: event?.title || fallbackEvent?.name || photo.event || "Event",
        date:
          event?.dateRange ||
          event?.date ||
          fallbackEvent?.period ||
          photo.date,
        city: event?.city || fallbackEvent?.city || photo.city,
        cover: photo.src,
        photos: [photo],
      })
    })

    return Array.from(groups.values()).sort(
      (a, b) => b.photos.length - a.photos.length
    )
  }, [contextEvents, profilePhotos])

  const selectedGalleryEvent = galleryEvents.find(
    (event) => event.id === galleryEventId
  )

  const galleryClasses = useMemo(() => {
    if (!selectedGalleryEvent) return []

    const groups = new Map<
      string,
      { key: string; name: string; cover: string; photos: Photo[] }
    >()

    selectedGalleryEvent.photos.forEach((photo) => {
      const name = photo.className || "Unassigned class"
      const key = name.toLowerCase()
      const existing = groups.get(key)

      if (existing) {
        existing.photos.push(photo)
        return
      }

      groups.set(key, {
        key,
        name,
        cover: photo.src,
        photos: [photo],
      })
    })

    return Array.from(groups.values()).sort(
      (a, b) => b.photos.length - a.photos.length
    )
  }, [selectedGalleryEvent])

  const selectedGalleryClass = galleryClasses.find(
    (classGroup) => classGroup.key === galleryClassKey
  )

  const totalEvents = galleryEvents.length
  const totalPhotosCount = profilePhotos.length

  // Resolve Highlights Data
  const displayHighlights: Photo[] = useMemo(() => {
    if (isOwner) {
      // Map context IDs to context photos (source of truth for owner)
      const raw = contextPhotos.filter((p) => contextHighlights.includes(p.id))
      // Map to App 'Photo' type
      return raw.map((p) => {
        const ev = contextEvents.find((e) => e.id === p.eventId)
        return {
          id: p.id,
          src: p.url,
          rider: p.rider || "Unknown",
          horse: p.horse || "Unknown",
          event: ev?.title || "Event",
          eventId: p.eventId,
          date: ev?.date || "Today",
          width: p.width,
          height: p.height,
          // Mock helpers
          className: "Class A",
          time: p.timestamp || "12:00",
          city: ev?.city || "Stockholm",
          arena: ev?.venueName || "Main Arena",
          countryCode: "SE",
          discipline: ev?.disciplines?.[0] || "Showjumping",
        }
      })
    }
    if (apiPhotographer) {
      return apiHighlightPhotos
    }

    return []
  }, [
    apiHighlightPhotos,
    apiPhotographer,
    isOwner,
    contextHighlights,
    contextPhotos,
    photographer?.highlights,
    contextEvents,
  ])

  // Guard after all hooks
  if (isLoadingApiPhotographer) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <div className="container flex items-center justify-center py-20">
          <Spinner className="size-6 text-muted-foreground" />
        </div>
      </div>
    )
  }

  if (!activeProfile || !photographer) {
    return <div>Photographer not found</div>
  }

  const photographerAvatar =
    resolveApiAssetUrl(
      "avatarUrl" in photographer ? photographer.avatarUrl : null
    ) ?? undefined

  const showTabs = isOwner || displayHighlights.length > 0
  const visibleTab = showTabs ? activeTab : "photos"

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <Breadcrumbs items={breadcrumbs} />

      <TitleHeader
        className="border-b-0"
        title={`${photographer.firstName} ${photographer.lastName}`}
        avatar={photographerAvatar}
        avatarVariant="photographer"
        subtitle={
          <DotList stackOnMobile className="text-base">
            Photographer
            {photographer.city || "Sweden"}
          </DotList>
        }
        stats={
          <DotList className="text-[0.8125rem]">
            <>{totalEvents} events</>
            <>{totalPhotosCount} photos</>
          </DotList>
        }
        rightContent={
          <ActionCluster>
            {/* "Available to hire" toggle and "Hire me" button are disabled in the old app too */}
            <ActionSeparator />
            <ActionIconButton
              aria-label="Instagram"
              title="Instagram"
              onClick={(e) => e.preventDefault()}
            >
              <InstagramIcon size={20} />
            </ActionIconButton>
            <ActionIconButton
              aria-label="TikTok"
              title="TikTok"
              onClick={(e) => e.preventDefault()}
            >
              <Music2 className="size-5" />
            </ActionIconButton>
            <ActionSeparator />
            {/* develop: share button hidden */}
          </ActionCluster>
        }
      />

      <ManageHighlightsModal
        isOpen={isHighlightsModalOpen}
        onClose={() => setIsHighlightsModalOpen(false)}
        initialIds={contextHighlights}
        onSave={updateHighlights}
      />

      {/* Tabs only when the owner is viewing or there are highlights */}
      {showTabs && (
        <div className="border-b bg-card">
          <div className="container">
            <Tabs
              value={activeTab}
              onValueChange={(value) =>
                setActiveTab(value === "photos" ? "photos" : "highlights")
              }
            >
              <TabsList variant="line" className="gap-0 border-b-0">
                {[
                  ["highlights", "Highlights"],
                  ["photos", "Photos"],
                ].map(([value, label]) => (
                  <TabsTrigger
                    key={value}
                    value={value}
                    // old .tab-btn: 14px/21px, 14px top + 16px bottom (incl. 2px border), overlaps the row border
                    className="-mb-px group-data-[variant=line]/tabs-list:px-6 group-data-[variant=line]/tabs-list:pt-3.5 group-data-[variant=line]/tabs-list:pb-4 group-data-[variant=line]/tabs-list:text-sm group-data-[variant=line]/tabs-list:leading-normal group-data-[variant=line]/tabs-list:font-semibold"
                  >
                    {label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>
        </div>
      )}

      <div className="min-h-[60vh] pt-6 max-md:pt-3">
        {visibleTab === "highlights" ? (
          <div className="container pb-20">
            {displayHighlights.length > 0 && isOwner && (
              <div className="mb-4 flex justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsHighlightsModalOpen(true)}
                >
                  <Pencil className="size-3.5" />
                  Edit highlights
                </Button>
              </div>
            )}

            {isOwner && displayHighlights.length === 0 ? (
              <div className="flex min-h-75 flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed px-6 py-12 text-center text-muted-foreground">
                <div className="text-lg font-bold text-foreground">
                  Showcase your best work
                </div>
                <p className="max-w-80 text-sm leading-normal">
                  Select your best photos to display them at the top of your
                  profile.
                </p>
                <Button onClick={() => setIsHighlightsModalOpen(true)}>
                  Add photos
                </Button>
              </div>
            ) : (
              <Highlights items={displayHighlights} />
            )}
          </div>
        ) : (
          <section className="pb-20">
            <div className="container">
              {galleryEventId && (
                <div className="mb-6 flex items-center gap-4">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-10 pr-3.5 pl-2.5"
                    onClick={() => {
                      if (galleryClassKey) {
                        setGalleryClassKey("")
                        return
                      }
                      setGalleryEventId("")
                    }}
                  >
                    <ChevronLeft className="size-4.5" />
                    {galleryClassKey ? "Classes" : "Events"}
                  </Button>
                  <div className="flex min-w-0 items-center gap-2 truncate text-sm text-muted-foreground">
                    <span>{selectedGalleryEvent?.title}</span>
                    {selectedGalleryClass && (
                      <>
                        <span>/</span>
                        <span>{selectedGalleryClass.name}</span>
                      </>
                    )}
                  </div>
                </div>
              )}

              {!galleryEventId && galleryEvents.length > 0 && (
                <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-5">
                  {galleryEvents.map((event) => {
                    const classCount = new Set(
                      event.photos.map(
                        (photo) => photo.className || "Unassigned class"
                      )
                    ).size

                    return (
                      <GalleryCard
                        key={event.id}
                        cover={event.cover}
                        title={event.title}
                        icon={<CalendarDays />}
                        subtitle={event.date}
                        meta={
                          <>
                            <span>{event.photos.length} photos</span>
                            <span>{classCount} classes</span>
                          </>
                        }
                        onClick={() => setGalleryEventId(event.id)}
                      />
                    )
                  })}
                </div>
              )}

              {galleryEventId &&
                !galleryClassKey &&
                galleryClasses.length > 0 && (
                  <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-5">
                    {galleryClasses.map((classGroup) => (
                      <GalleryCard
                        key={classGroup.key}
                        cover={classGroup.cover}
                        title={classGroup.name}
                        icon={<Images />}
                        subtitle={selectedGalleryEvent?.title}
                        meta={<span>{classGroup.photos.length} photos</span>}
                        onClick={() => setGalleryClassKey(classGroup.key)}
                      />
                    ))}
                  </div>
                )}

              {selectedGalleryClass && (
                <MasonryGrid>
                  {selectedGalleryClass.photos.map((photo) => (
                    <PhotoCard
                      key={photo.id}
                      photo={photo}
                      onClick={(p) =>
                        navigate(
                          `/photo/${p.id}?from=ppro${isOwner ? "&owner=1" : ""}`,
                          { state: { photo: p, isOwnerProfile: isOwner } }
                        )
                      }
                      showCartActions={!isOwner}
                    />
                  ))}
                </MasonryGrid>
              )}

              {profilePhotos.length === 0 && (
                <EmptyState
                  icon={<Search />}
                  title="No uploaded photos yet"
                  description="Upload photos to an event and they will appear here grouped by event and class."
                />
              )}
            </div>
          </section>
        )}
      </div>

      <Footer minimal />
    </div>
  )
}
