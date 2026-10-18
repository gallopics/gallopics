import { useMemo, useState } from "react"
import { Link } from "react-router"
import { DollarSign, LayoutGrid, List, RotateCcw } from "lucide-react"

import { cn } from "@/lib/utils"
import { usePhotographer, type Photo } from "@/context/PhotographerContext"
import { useWorkspace } from "@/context/WorkspaceContext"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ConfirmDialog } from "@/components/ConfirmDialog"
import { EmptyState } from "@/components/EmptyState"
import { FilterBar, ResetFiltersButton } from "@/components/FilterBar"
import { MasonryGrid } from "@/components/MasonryGrid"
import { ModernDropdown } from "@/components/ModernDropdown"
import { PhotoCard } from "@/components/PhotoCard"
import { PhotoPreviewDialog } from "@/components/PhotoPreviewDialog"
import {
  ScopedSearchBar,
  type ScopedSearchOption,
} from "@/components/ScopedSearchBar"
import { TitleHeader } from "@/components/TitleHeader"

export function SoldPhotos() {
  const { basePath, isAdmin } = useWorkspace()
  const { events, getPhotosByEvent } = usePhotographer()

  // States
  const [selectedEventId, setSelectedEventId] = useState<string>("all")
  const [selectedBundleId, setSelectedBundleId] = useState<string>("all")
  const [selectedPeriod, setSelectedPeriod] = useState<string>("this_year")
  const [searchQuery, setSearchQuery] = useState("")
  const [viewMode, setViewMode] = useState<"card" | "grid">("card")
  const [previewPhoto, setPreviewPhoto] = useState<any | null>(null)
  const [hoveredBarIndex, setHoveredBarIndex] = useState<number | null>(null)
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean
    photoId: string
    photoCode: string
  } | null>(null)

  // Mock Data Constants
  const REVENUE = 24700

  // Bundle Colors Token
  const BUNDLE_COLORS = {
    basic: "var(--muted-foreground)",
    standard: "#f97316",
    premium: "#a855f7",
    custom: "#facc15", // Yellow-400
  }

  // Helper Functions for Bundles
  const getBundleId = (photoId: string) => {
    const bundles = ["web", "high", "commercial", "custom"] as const
    const bundleHash = photoId
      .split("")
      .reduce((acc, char) => acc + char.charCodeAt(0), 0)
    return bundles[bundleHash % 4]
  }

  const getBundleLabel = (photoId: string) => {
    const bundleId = getBundleId(photoId)
    return {
      web: "Web",
      high: "High",
      commercial: "Commercial",
      custom: "Custom",
    }[bundleId]
  }

  // Deterministic mock purchase date spread across 2025–2026
  const getMockPurchaseDate = (photoId: string): Date => {
    const hash = photoId.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0)
    const slot = hash % 18 // 18 buckets: 6 months 2025 + 12 months 2026
    const year = slot < 6 ? 2025 : 2026
    const month = slot < 6 ? slot + 6 : slot - 6 // Jul–Dec 2025, Jan–Dec 2026
    const day = (hash % 28) + 1
    const hour = hash % 24
    const minute = (hash * 7) % 60
    return new Date(year, month, day, hour, minute)
  }

  const getBundleColor = (photoId: string) => {
    const bundleId = getBundleId(photoId)
    return {
      web: BUNDLE_COLORS.basic,
      high: BUNDLE_COLORS.standard,
      commercial: BUNDLE_COLORS.premium,
      custom: BUNDLE_COLORS.custom,
    }[bundleId]
  }

  const bundleOptions = [
    { label: "All bundles", value: "all" },
    {
      label: "Web",
      value: "web",
      icon: <div className="size-2 rounded-full bg-gray-400" />,
    },
    {
      label: "High",
      value: "high",
      icon: <div className="size-2 rounded-full bg-orange-500" />,
    },
    {
      label: "Commercial",
      value: "commercial",
      icon: <div className="size-2 rounded-full bg-purple-500" />,
    },
    {
      label: "Custom",
      value: "custom",
      icon: <div className="size-2 rounded-full bg-yellow-400" />,
    },
  ]

  // Options
  const eventOptions = [
    { label: "All events", value: "all" },
    ...events.map((e) => ({ label: e.title, value: e.id })),
  ]

  const periodOptions = [
    { label: "All time", value: "all" },
    { label: "This month", value: "this_month" },
    { label: "This year", value: "this_year" },
    { label: "Last year", value: "last_year" },
  ]

  const allSoldPhotos = useMemo(() => {
    return events
      .flatMap((e) => getPhotosByEvent(e.id))
      .filter((p) => p.soldCount > 0)
      .map((p) => {
        // For demo: some photos should have multiple sales
        const hash = p.id
          .split("")
          .reduce((acc, char) => acc + char.charCodeAt(0), 0)
        const mockSoldCount = hash % 8 === 0 ? 4 : hash % 5 === 0 ? 2 : 1
        return {
          ...p,
          soldCount: mockSoldCount,
          clientEmail: `client_${p.id.slice(0, 4)}@example.com`,
        }
      })
  }, [events, getPhotosByEvent])

  const filteredPhotos = useMemo(() => {
    const now = new Date()
    return allSoldPhotos.filter((p) => {
      const matchEvent =
        selectedEventId === "all" || p.eventId === selectedEventId
      const matchSearch =
        !searchQuery ||
        (p.photoCode || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.clientEmail || "").toLowerCase().includes(searchQuery.toLowerCase())

      const mockBundle = getBundleId(p.id)
      const matchBundle =
        selectedBundleId === "all" || mockBundle === selectedBundleId

      let matchPeriod = true
      if (selectedPeriod !== "all") {
        const d = getMockPurchaseDate(p.id)
        if (selectedPeriod === "this_month")
          matchPeriod =
            d.getMonth() === now.getMonth() &&
            d.getFullYear() === now.getFullYear()
        else if (selectedPeriod === "this_year")
          matchPeriod = d.getFullYear() === now.getFullYear()
        else if (selectedPeriod === "last_year")
          matchPeriod = d.getFullYear() === now.getFullYear() - 1
      }

      return matchEvent && matchSearch && matchBundle && matchPeriod
    })
  }, [
    allSoldPhotos,
    selectedEventId,
    searchQuery,
    selectedBundleId,
    selectedPeriod,
  ])

  const searchOptions = useMemo<ScopedSearchOption[]>(() => {
    const ids = Array.from(
      new Set(
        allSoldPhotos.map(
          (p) => p.photoCode || `#M-0-${p.id.slice(0, 8).toUpperCase()}`
        )
      )
    ).map((id) => ({ label: id, value: id, type: "id" as const }))
    const emails = Array.from(
      new Set(
        allSoldPhotos.map(
          (p) =>
            (p as any).clientEmail || `client_${p.id.slice(0, 4)}@example.com`
        )
      )
    ).map((e) => ({ label: e, value: e, type: "email" as const }))
    return [...ids, ...emails]
  }, [allSoldPhotos])

  const isResetDisabled =
    selectedEventId === "all" &&
    selectedBundleId === "all" &&
    selectedPeriod === "all" &&
    searchQuery === ""

  const mapToUiPhoto = (photo: Photo) => {
    const event = events.find((e) => e.id === photo.eventId)
    const purchaseDate = getMockPurchaseDate(photo.id)
    return {
      id: photo.id,
      src: photo.url,
      rider: photo.rider || "Unknown",
      horse: photo.horse || "Unknown",
      event: event?.title || "Event",
      eventId: photo.eventId,
      date: purchaseDate.toISOString(),
      time: purchaseDate.toLocaleTimeString("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      city: event?.city || "Unknown",
      countryCode: "SE",
      priceStandard: photo.priceStandard,
      priceHigh: photo.priceHigh,
      priceCommercial: photo.priceCommercial,
      width: photo.width,
      height: photo.height,
      className: "photo-grid-item",
      arena: "Arena 1",
      photographer: event?.assignedPhotographers?.[0]?.name,
      soldCount: photo.soldCount,
    }
  }

  // Graph Data — derived from filteredPhotos so chart and grid are always in sync
  const graphData = useMemo(() => {
    const MONTHS = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ]

    let labels: string[] = []
    if (selectedPeriod === "this_month") {
      labels = Array.from({ length: 30 }, (_, i) => (i + 1).toString())
    } else if (selectedPeriod === "this_year") {
      labels = MONTHS
    } else if (selectedPeriod === "last_year") {
      labels = MONTHS
    } else {
      labels = ["2023", "2024", "2025", "2026"]
    }

    const dataPoints = labels.map(() => ({
      basic: 0,
      standard: 0,
      premium: 0,
      custom: 0,
    }))

    filteredPhotos.forEach((p) => {
      const d = getMockPurchaseDate(p.id)
      let key: string
      if (selectedPeriod === "this_month") key = d.getDate().toString()
      else if (selectedPeriod === "this_year" || selectedPeriod === "last_year")
        key = MONTHS[d.getMonth()]
      else key = d.getFullYear().toString()

      const idx = labels.indexOf(key)
      if (idx === -1) return

      const count = p.soldCount || 1
      const bundle = getBundleId(p.id)
      if (bundle === "web") dataPoints[idx].basic += count
      else if (bundle === "high") dataPoints[idx].standard += count
      else if (bundle === "commercial") dataPoints[idx].premium += count
      else if (bundle === "custom") dataPoints[idx].custom += count
    })

    return { labels, dataPoints }
  }, [filteredPhotos, selectedPeriod])
  const formatSek = (value: number) =>
    `SEK ${value.toLocaleString().replace(/,/g, " ")}`

  // trend card: fixed widths like the old wrappers (200 / 160 / 160px)
  const filterDropdowns = (trend = false) => (
    <>
      <ModernDropdown
        value={selectedEventId}
        options={eventOptions}
        onChange={setSelectedEventId}
        label="Event"
        placeholder="All events"
        variant="pill"
        className={trend ? "md:w-50" : undefined}
      />
      <ModernDropdown
        value={selectedBundleId}
        options={bundleOptions}
        onChange={setSelectedBundleId}
        label="Bundle"
        placeholder="All bundles"
        variant="pill"
        className={trend ? "md:w-40" : undefined}
      />
      <ModernDropdown
        value={selectedPeriod}
        options={periodOptions}
        onChange={setSelectedPeriod}
        label="Period"
        variant="pill"
        className={trend ? "md:w-40" : undefined}
      />
    </>
  )

  const openUnpublish = (photo: Photo) =>
    setConfirmModal({
      isOpen: true,
      photoId: photo.id,
      photoCode:
        photo.photoCode || `#M-0-${photo.id.slice(0, 8).toUpperCase()}`,
    })

  return (
    <div className="pb-20">
      <TitleHeader variant="workspace" title="Sales" />

      <div className="relative min-h-[calc(100vh-200px)] bg-background py-10">
        <div className="container">
          {/* Sales trend card */}
          <div className="mb-6 rounded-xl border bg-card p-6">
            <div className="mb-10 flex flex-col gap-6">
              <div className="flex w-full items-center justify-between max-md:flex-col max-md:items-start max-md:gap-3">
                <div className="mr-3 text-base font-semibold text-foreground">
                  Sales trend
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  {filterDropdowns(true)}
                </div>
              </div>

              <div className="flex w-full items-center justify-between max-md:flex-col max-md:items-start max-md:gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <StatBadge label="Published" value="596" />
                  {isAdmin ? (
                    <>
                      <StatBadge
                        label="PG Earnings"
                        value={formatSek(REVENUE)}
                        className="bg-blue-50 text-blue-800 *:last:text-blue-700"
                      />
                      <StatBadge
                        label="Gallop Earnings"
                        value={formatSek(REVENUE * 10)}
                        className="bg-violet-50 text-violet-800 *:last:text-violet-600"
                      />
                    </>
                  ) : (
                    <StatBadge
                      label="Earnings"
                      value={formatSek(REVENUE)}
                      className="bg-blue-50 text-blue-800 *:last:text-blue-700"
                    />
                  )}
                </div>

                <div className="flex flex-wrap gap-4 max-md:gap-x-3 max-md:gap-y-1">
                  {BUNDLE_SERIES.map((b) => (
                    <div
                      key={b.key}
                      className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground"
                    >
                      <LegendDot className={b.color} />
                      <span>{b.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Stacked bar chart */}
            <div className="relative flex h-50 w-full items-end gap-6 pb-6 max-md:gap-1">
              {graphData.dataPoints.map((point, i) => {
                const total =
                  point.basic + point.standard + point.premium + point.custom
                // Show only every 5th label when there are many bars
                const showLabel =
                  selectedPeriod === "this_month" ? i % 5 === 0 : true
                const label =
                  selectedPeriod === "this_month"
                    ? (i + 1).toString()
                    : graphData.labels[i]
                const isHovered = hoveredBarIndex === i
                const alignRight = i > graphData.dataPoints.length / 2

                return (
                  <div
                    key={i}
                    className="relative flex h-full flex-1 flex-col items-center justify-end gap-1"
                    onMouseEnter={() => setHoveredBarIndex(i)}
                    onMouseLeave={() => setHoveredBarIndex(null)}
                  >
                    <div className="mb-0.5 text-[0.625rem] font-bold text-muted-foreground">
                      {Math.round(total)}
                    </div>
                    <div
                      className="flex min-h-1 w-full flex-col overflow-hidden rounded-t-sm transition-transform duration-200 hover:z-2 hover:scale-x-110"
                      style={{ height: `${total}%` }}
                    >
                      {[...BUNDLE_SERIES].reverse().map((b) => (
                        <div
                          key={b.key}
                          className={cn(
                            "w-full transition-[height] duration-300",
                            b.color
                          )}
                          style={{ height: `${(point[b.key] / total) * 100}%` }}
                        />
                      ))}
                    </div>
                    {showLabel && (
                      <span className="absolute -bottom-6 text-xs font-semibold whitespace-nowrap text-muted-foreground/50">
                        {label}
                      </span>
                    )}

                    {isHovered && (
                      <div
                        className={cn(
                          "pointer-events-none absolute bottom-full z-10 mb-3 flex min-w-50 flex-col gap-2 rounded-xl border border-muted bg-popover px-4 py-3 text-popover-foreground shadow-lg",
                          alignRight
                            ? "right-1/2 translate-x-[20%]"
                            : "left-1/2 -translate-x-[20%]"
                        )}
                      >
                        <div className="border-b border-muted pb-1.5 text-xs font-bold text-foreground">
                          {label} Sales
                        </div>
                        {BUNDLE_SERIES.map((b) => (
                          <TooltipRow
                            key={b.key}
                            label={
                              <>
                                <LegendDot className={b.color} />
                                {b.label}
                              </>
                            }
                            value={Math.round(point[b.key])}
                          />
                        ))}
                        <div className="mt-1 border-t border-muted pt-2">
                          <TooltipRow
                            className="font-bold"
                            label={
                              <span className="text-foreground">
                                Total Sold
                              </span>
                            }
                            value={Math.round(total)}
                          />
                          {isAdmin ? (
                            <>
                              <TooltipRow
                                className="mt-1"
                                label="PG Earnings"
                                value={`SEK ${Math.round(total * 450).toLocaleString()}`}
                                valueClassName="text-success"
                              />
                              <TooltipRow
                                className="mt-0.5"
                                label="Gallop Earnings"
                                value={`SEK ${Math.round(total * 4500).toLocaleString()}`}
                                valueClassName="text-violet-600"
                              />
                            </>
                          ) : (
                            <TooltipRow
                              className="mt-1"
                              label="Earnings"
                              value={`SEK ${Math.round(total * 450).toLocaleString()}`}
                              valueClassName="text-success"
                            />
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          <Separator className="mb-8" />

          <FilterBar
            searchWidth="fixed"
            filters={
              <>
                {filterDropdowns()}
                <ResetFiltersButton
                  disabled={isResetDisabled}
                  onClick={() => {
                    setSelectedEventId("all")
                    setSelectedBundleId("all")
                    setSelectedPeriod("all")
                    setSearchQuery("")
                  }}
                />
              </>
            }
            search={
              <ScopedSearchBar
                currentValue={searchQuery}
                onSearchChange={setSearchQuery}
                onSelect={setSearchQuery}
                placeholder="Search photo ID or client email..."
                options={searchOptions}
              />
            }
            meta={
              <div className="flex items-center gap-4">
                Showing {filteredPhotos.length}
                <Separator
                  orientation="vertical"
                  className="h-6 data-vertical:self-center"
                />
                <Tabs
                  value={viewMode}
                  onValueChange={(next) => setViewMode(next as "card" | "grid")}
                >
                  <TabsList className="h-auto! rounded-lg p-0.5">
                    <TabsTrigger
                      value="card"
                      aria-label="Card view"
                      className="h-auto px-3 py-1.5"
                    >
                      <LayoutGrid />
                    </TabsTrigger>
                    <TabsTrigger
                      value="grid"
                      aria-label="List view"
                      className="h-auto px-3 py-1.5"
                    >
                      <List />
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            }
          />

          {filteredPhotos.length > 0 ? (
            viewMode === "card" ? (
              <MasonryGrid isLoading={false}>
                {filteredPhotos.map((photo) => (
                  <PhotoCard
                    key={photo.id}
                    photo={mapToUiPhoto(photo)}
                    onClick={(p) => setPreviewPhoto(p)}
                    variant="pgPublished"
                    selectable={false}
                    showEdit={false}
                    onRemove={() => openUnpublish(photo)}
                    pgMeta={{
                      fileName: photo.fileName,
                      photoCode:
                        photo.photoCode ||
                        `#M-0-${photo.id.slice(0, 8).toUpperCase()}`,
                      soldCount: photo.soldCount,
                      priceStandard: photo.priceStandard,
                      priceHigh: photo.priceHigh,
                      priceCommercial: photo.priceCommercial,
                    }}
                  />
                ))}
              </MasonryGrid>
            ) : (
              <div className="overflow-hidden rounded-xl border bg-card">
                <Table className="table-fixed">
                  <TableHeader>
                    <TableRow className="bg-muted hover:bg-muted">
                      {TABLE_COLUMNS.map((col) => (
                        <TableHead
                          key={col.label}
                          className={cn(
                            "h-auto px-4 py-3 text-xs font-semibold tracking-[0.05em] text-muted-foreground uppercase",
                            col.className
                          )}
                        >
                          {col.label}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPhotos.map((photo) => {
                      const event = events.find((e) => e.id === photo.eventId)
                      const photoIdDisplay =
                        photo.photoCode ||
                        `#M-0-${photo.id.slice(0, 8).toUpperCase()}`
                      const clientEmail = photo.clientEmail
                      const downloadLink = `gallopics.com/dl/${photo.photoCode || photo.id.slice(0, 8)}...`
                      const eventTitle = event?.title || "Unknown Event"

                      return (
                        <TableRow
                          key={photo.id}
                          className="border-muted hover:bg-muted"
                        >
                          <TableCell className={cellClass}>
                            <button
                              type="button"
                              aria-label="Preview photo"
                              onClick={() =>
                                setPreviewPhoto(mapToUiPhoto(photo))
                              }
                            >
                              <img
                                src={photo.url}
                                className="size-10 cursor-pointer rounded object-cover"
                                alt=""
                              />
                            </button>
                          </TableCell>
                          <TableCell
                            className={cellClass}
                            title={photoIdDisplay}
                          >
                            <div className="truncate font-semibold text-foreground">
                              {photoIdDisplay}
                            </div>
                            {photo.fileName && (
                              <div className="truncate text-xs text-muted-foreground">
                                {photo.fileName}
                              </div>
                            )}
                          </TableCell>
                          <TableCell
                            className={cellClass}
                            title={`${photo.uploadDate} ${photo.timestamp || "14:20"}`}
                          >
                            <div className="truncate font-medium">
                              {photo.uploadDate}
                            </div>
                            <div className="truncate text-xs text-muted-foreground">
                              {photo.timestamp || "14:20"}
                            </div>
                          </TableCell>
                          <TableCell className={cellClass} title={eventTitle}>
                            <Link
                              to={`${basePath}/events/${photo.eventId}`}
                              className="block truncate font-medium text-primary hover:underline"
                            >
                              {eventTitle}
                            </Link>
                          </TableCell>
                          <TableCell className={cellClass} title={clientEmail}>
                            <div className="truncate text-muted-foreground">
                              {clientEmail}
                            </div>
                          </TableCell>
                          <TableCell
                            className={cellClass}
                            title={getBundleLabel(photo.id)}
                          >
                            <div className="inline-flex max-w-full items-center gap-1.5 font-medium">
                              <span
                                className="size-2 shrink-0 rounded-full"
                                style={{
                                  background: getBundleColor(photo.id),
                                }}
                              />
                              <span className="truncate">
                                {getBundleLabel(photo.id)}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className={cn(cellClass, "text-center")}>
                            <span className="inline-flex items-center justify-center rounded border border-emerald-100 bg-emerald-50 px-1.5 py-0.5 text-[0.6875rem] leading-none font-bold text-success transition-colors hover:border-emerald-200 hover:bg-emerald-100">
                              {photo.soldCount || 1}
                            </span>
                          </TableCell>
                          <TableCell
                            className={cellClass}
                            title={`https://gallopics.com/dl/${photo.photoCode || photo.id.slice(0, 8)}`}
                          >
                            <a
                              href="#"
                              className="block truncate text-primary"
                              onClick={(e) => e.preventDefault()}
                            >
                              {downloadLink}
                            </a>
                          </TableCell>
                          <TableCell className={cn(cellClass, "text-right")}>
                            <Button
                              variant="outline"
                              size="icon-sm"
                              title="Unpublish"
                              aria-label="Unpublish"
                              className="border-muted text-muted-foreground hover:border-destructive/25 hover:bg-destructive/10 hover:text-destructive"
                              onClick={() => openUnpublish(photo)}
                            >
                              <RotateCcw />
                            </Button>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            )
          ) : (
            <EmptyState
              icon={<DollarSign />}
              title={
                allSoldPhotos.length === 0 ? "No sales yet" : "No results found"
              }
              description={
                allSoldPhotos.length === 0
                  ? "Your sold photos will appear here once customers make a purchase."
                  : "Try adjusting your filters to find what you're looking for."
              }
            />
          )}
        </div>
      </div>

      <PhotoPreviewDialog
        src={previewPhoto?.src}
        onClose={() => setPreviewPhoto(null)}
      />

      <ConfirmDialog
        open={!!confirmModal?.isOpen}
        onCancel={() => setConfirmModal(null)}
        onConfirm={() => {
          // Mock action, as in the old app
          console.log("Unpublishing photo:", confirmModal?.photoId)
          setConfirmModal(null)
        }}
        title="Unpublish photo?"
        description={
          <>
            This will move photo <strong>{confirmModal?.photoCode}</strong> to
            the Archive tab. You can undo this action later from the event
            details page.
          </>
        }
        confirmLabel="Unpublish"
      />
    </div>
  )
}

// Old --bundle-* colours (Tailwind palette: gray-400, orange-500, purple-500, yellow-400)
const BUNDLE_SERIES = [
  { key: "basic", label: "Web", color: "bg-gray-400" },
  { key: "standard", label: "High", color: "bg-orange-500" },
  { key: "premium", label: "Commercial", color: "bg-purple-500" },
  { key: "custom", label: "Custom", color: "bg-yellow-400" },
] as const

const TABLE_COLUMNS = [
  { label: "Photo", className: "w-18" },
  { label: "Photo ID", className: "w-[15%]" },
  { label: "Date / Time", className: "w-[12%]" },
  { label: "Event", className: "w-[15%]" },
  { label: "Client Info", className: "w-[18%]" },
  { label: "Bundle", className: "w-[12%]" },
  { label: "Count", className: "w-20 text-center" },
  { label: "Download Link", className: "w-[15%]" },
  { label: "Actions", className: "w-25 text-right" },
]

const cellClass = "px-4 py-3 text-sm text-foreground/80"

function StatBadge({
  label,
  value,
  className,
}: {
  label: string
  value: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-start rounded-lg bg-muted px-3.5 py-1.5 whitespace-nowrap text-muted-foreground *:last:text-foreground",
        className
      )}
    >
      <span className="text-[0.65rem] leading-[1.2] font-semibold opacity-80">
        {label}
      </span>
      <span className="text-[0.8125rem] leading-[1.2] font-bold">{value}</span>
    </div>
  )
}

function LegendDot({ className }: { className: string }) {
  return <span className={cn("size-2 rounded-xs", className)} />
}

function TooltipRow({
  label,
  value,
  className,
  valueClassName,
}: {
  label: React.ReactNode
  value: React.ReactNode
  className?: string
  valueClassName?: string
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-between text-[0.8125rem]",
        className
      )}
    >
      <div className="flex items-center gap-1.5 text-muted-foreground">
        {label}
      </div>
      <div className={cn("font-semibold text-foreground", valueClassName)}>
        {value}
      </div>
    </div>
  )
}
