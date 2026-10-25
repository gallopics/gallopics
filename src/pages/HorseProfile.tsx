import { useEffect, useMemo, useState } from "react"
import { useNavigate, useParams, useSearchParams } from "react-router"

import { getDefaultCartTier } from "@/constants/qualityTiers"
import { useCart } from "@/context/CartContext"
import { COMPETITIONS, HORSES, RIDERS } from "@/data/mockData"
import type { Photo } from "@/types"
import { toast } from "@/components/ui/toast"
import { Breadcrumbs } from "@/components/Breadcrumbs"
import type { BreadcrumbItem } from "@/components/Breadcrumbs"
import { DotList } from "@/components/DotList"
import { FilterBar, ResetFiltersButton } from "@/components/FilterBar"
import { Footer } from "@/components/Footer"
import { Header } from "@/components/Header"
import { ActionCluster, ActionSeparator } from "@/components/HeaderActions"
import { RiderIcon } from "@/components/icons/RiderIcon"
import { InfoChip } from "@/components/InfoChip"
import { MasonryGrid } from "@/components/MasonryGrid"
import { ModernDropdown } from "@/components/ModernDropdown"
import { PhotoCard, PhotoCardSkeleton } from "@/components/PhotoCard"
import { TitleHeader } from "@/components/TitleHeader"

export function HorseProfile() {
  const { horseId = "h1" } = useParams()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const from = searchParams.get("from")
  const photoId = searchParams.get("photoId")
  const { cart, addToCart } = useCart()

  // Data Loading
  const [photos, setPhotos] = useState<Photo[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const activeHorse = useMemo(() => {
    return HORSES.find((h) => h.id === horseId) || HORSES[0]
  }, [horseId])

  // Breadcrumb path construction
  const breadcrumbs = useMemo<BreadcrumbItem[]>(() => {
    const items: BreadcrumbItem[] = []

    if (from === "photo" && photoId) {
      items.push({
        label: "Back to photo",
        onClick: () => navigate(`/photo/${photoId}`),
      })
    } else {
      items.push({ label: "Events", onClick: () => navigate("/") })
    }

    items.push({ label: activeHorse.name, active: true })
    return items
  }, [navigate, activeHorse, from, photoId])

  // Filter states - Order: Events, Class, Riders, Photographer
  const [selectedEventId, setSelectedEventId] = useState<string>("")
  const [eventClass, setEventClass] = useState("All")
  const [rider, setRider] = useState("All")
  const [photographer, setPhotographer] = useState("All")

  // develop: mock photos removed; no API for rider/horse photos yet
  useEffect(() => {
    setPhotos([])
    setIsLoading(false)
  }, [activeHorse])

  // Compute latest event once photos are loaded
  useEffect(() => {
    if (photos.length > 0 && !selectedEventId) {
      const uniqueIds = Array.from(new Set(photos.map((p) => p.eventId)))
      const relevantEvents = COMPETITIONS.filter((c) =>
        uniqueIds.includes(c.id)
      )
      if (relevantEvents.length > 0) {
        relevantEvents.sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        )
        setSelectedEventId(relevantEvents[0].id)
      }
    }
  }, [photos, selectedEventId])

  const isResetDisabled =
    !selectedEventId &&
    eventClass === "All" &&
    rider === "All" &&
    photographer === "All"

  // Filters Inter-dependency
  const filteredPhotos = useMemo(() => {
    return photos.filter((photo) => {
      const matchEvent = !selectedEventId || photo.eventId === selectedEventId
      const matchRider = rider === "All" || photo.rider === rider
      const matchClass =
        eventClass === "All" || ((photo as any).class || "1.30m") === eventClass
      const matchPhotographer =
        photographer === "All" ||
        ((photo as any).photographer || "Unknown") === photographer

      return matchEvent && matchRider && matchClass && matchPhotographer
    })
  }, [photos, selectedEventId, rider, eventClass, photographer])

  // Helpers for dynamic options
  const getAvailable = (scopingFilter: (p: Photo) => boolean) =>
    photos.filter(scopingFilter)

  // 1. Events
  const eventOptions = useMemo(() => {
    const available = getAvailable(
      (p) =>
        (rider === "All" || p.rider === rider) &&
        (eventClass === "All" ||
          ((p as any).class || "1.30m") === eventClass) &&
        (photographer === "All" ||
          ((p as any).photographer || "Unknown") === photographer)
    )
    const uniqueIds = Array.from(new Set(available.map((p) => p.eventId)))
    const relevantEvents = COMPETITIONS.filter((c) => uniqueIds.includes(c.id))
    // Remove All Events option
    return relevantEvents.map((e) => ({ label: e.name, value: e.id }))
  }, [photos, rider, eventClass, photographer])

  // 3. Class
  const classOptions = [
    { label: "All Classes", value: "All" },
    { label: "1.20m", value: "1.20m" },
    { label: "1.30m", value: "1.30m" },
  ]

  // 4. Riders
  const riderOptions = useMemo(() => {
    const available = getAvailable(
      (p) => !selectedEventId || p.eventId === selectedEventId
    )
    const unique = Array.from(new Set(available.map((p) => p.rider))).sort()
    return [
      { label: "All Riders", value: "All" },
      ...unique.map((r) => ({ label: r, value: r })),
    ]
  }, [photos, selectedEventId])

  // 5. Photographer
  const photographerOptions = useMemo(() => {
    const available = getAvailable(
      (p) => !selectedEventId || p.eventId === selectedEventId
    )
    const unique = Array.from(
      new Set(available.map((p) => p.photographer).filter(Boolean))
    ).sort()
    return [
      { label: "All Photographers", value: "All" },
      ...unique.map((ph) => ({ label: ph as string, value: ph as string })),
    ]
  }, [photos, selectedEventId])

  // Header Stats
  const totalEvents = new Set(photos.map((p) => p.eventId)).size
  const totalPhotosCount = photos.length

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <Breadcrumbs items={breadcrumbs} />

      <TitleHeader
        title={activeHorse.name}
        avatarVariant="horse"
        subtitle="Horse"
        stats={
          <DotList className="text-[0.8125rem]">
            <>{totalEvents} events</>
            <>{totalPhotosCount} photos</>
          </DotList>
        }
        rightContent={
          <ActionCluster>
            {(() => {
              // Find primary rider
              if (photos.length === 0) return null
              const riderCounts: { [key: string]: number } = {}
              photos.forEach((p) => {
                riderCounts[p.rider] = (riderCounts[p.rider] || 0) + 1
              })
              const topRiderName = Object.keys(riderCounts).reduce((a, b) =>
                riderCounts[a] > riderCounts[b] ? a : b
              )
              const topRider = RIDERS.find(
                (r) => `${r.firstName} ${r.lastName}` === topRiderName
              )

              if (!topRider) return null

              return (
                <>
                  <InfoChip
                    label="Rider"
                    name={`${topRider.firstName} ${topRider.lastName}`}
                    variant="rider"
                    icon={<RiderIcon size={20} />}
                    onClick={() =>
                      navigate(
                        `/rider/${topRider.id}?from=horse&horseId=${horseId}`
                      )
                    }
                  />
                  <ActionSeparator />
                </>
              )
            })()}
            {/* develop: share button hidden */}
          </ActionCluster>
        }
      />

      <section className="min-h-100 pt-6 pb-16">
        <div className="container">
          <FilterBar
            filters={
              <>
                <ModernDropdown
                  value={selectedEventId}
                  options={eventOptions}
                  onChange={setSelectedEventId}
                  label="Events"
                  placeholder="Events"
                  showSearch={true}
                  variant="pill"
                />
                <ModernDropdown
                  value={eventClass}
                  options={classOptions}
                  onChange={setEventClass}
                  label="Class"
                  placeholder="Class"
                  variant="pill"
                />
                <ModernDropdown
                  value={rider}
                  options={riderOptions}
                  onChange={setRider}
                  label="Riders"
                  placeholder="Riders"
                  showSearch={true}
                  variant="pill"
                />
                <ModernDropdown
                  value={photographer}
                  options={photographerOptions}
                  onChange={setPhotographer}
                  label="Photographer"
                  placeholder="Photographer"
                  variant="pill"
                />
                <ResetFiltersButton
                  disabled={isResetDisabled}
                  onClick={() => {
                    // Auto-reset to latest
                    const uniqueIds = Array.from(
                      new Set(photos.map((p) => p.eventId))
                    )
                    const relevantEvents = COMPETITIONS.filter((c) =>
                      uniqueIds.includes(c.id)
                    )
                    if (relevantEvents.length > 0) {
                      relevantEvents.sort(
                        (a, b) =>
                          new Date(b.date).getTime() -
                          new Date(a.date).getTime()
                      )
                      setSelectedEventId(relevantEvents[0].id)
                    }
                    setEventClass("All")
                    setRider("All")
                    setPhotographer("All")
                  }}
                />
              </>
            }
            meta={<>Showing {filteredPhotos.length} photos</>}
          />

          <MasonryGrid
            isLoading={isLoading}
            renderSkeleton={() => <PhotoCardSkeleton />}
          >
            {filteredPhotos.map((photo) => (
              <PhotoCard
                key={photo.id}
                photo={photo}
                onClick={(p) =>
                  navigate(
                    `/photo/${p.id}?from=horse&horseId=${activeHorse.id}`
                  )
                }
                onAddToCart={(p) => {
                  // Check if in cart
                  const tier = getDefaultCartTier()
                  const isInCart = cart.some(
                    (item) => item.photoId === p.id && item.quality === tier.id
                  )
                  if (isInCart) {
                    toast.add({ title: "Already in cart", type: "info" })
                    return
                  }
                  addToCart(p, tier.id, tier.label, tier.price)
                  toast.add({ title: "Added to cart", type: "success" })
                }}
              />
            ))}
          </MasonryGrid>
        </div>
      </section>

      <Footer minimal={true} />
    </div>
  )
}
