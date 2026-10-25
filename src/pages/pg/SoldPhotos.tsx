import { useMemo, useState } from "react"
import { Link } from "react-router"
import { useQuery } from "@tanstack/react-query"
import { DollarSign, LayoutGrid, List } from "lucide-react"

import { QUALITY_TIERS } from "@/constants/qualityTiers"
import { cn } from "@/lib/utils"
import { useAuth } from "@/context/AuthContext"
import { useWorkspace } from "@/context/WorkspaceContext"
import { resolveApiAssetUrl, type SaleItem } from "@/data/apiClient"
import { salesQueryOptions } from "@/data/queries/sales"
import type { Photo } from "@/types"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { EmptyState } from "@/components/EmptyState"
import { FilterBar, ResetFiltersButton } from "@/components/FilterBar"
import { MasonryGrid } from "@/components/MasonryGrid"
import { ModernDropdown } from "@/components/ModernDropdown"
import { PhotoCard, PhotoCardSkeleton } from "@/components/PhotoCard"
import { PhotoPreviewDialog } from "@/components/PhotoPreviewDialog"
import {
  ScopedSearchBar,
  type ScopedSearchOption,
} from "@/components/ScopedSearchBar"
import { TitleHeader } from "@/components/TitleHeader"

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

// Old --bundle-* colours (Tailwind palette: gray-400, orange-500, purple-500)
const QUALITY_SERIES = [
  { key: "web", label: "Web", color: "bg-gray-400" },
  { key: "high", label: "High", color: "bg-orange-500" },
  { key: "commercial", label: "Commercial", color: "bg-purple-500" },
] as const

type QualityKey = (typeof QUALITY_SERIES)[number]["key"]

const PAYOUT_LABELS: Record<string, { label: string; className: string }> = {
  transferred: { label: "Paid to Stripe", className: "text-success" },
  owed: { label: "Waiting for Stripe", className: "text-warning" },
  failed: { label: "Waiting for Stripe", className: "text-warning" },
  reversed: { label: "Refunded", className: "text-muted-foreground" },
  cancelled: { label: "Refunded", className: "text-muted-foreground" },
}

const TABLE_COLUMNS = [
  { label: "Photo", className: "w-18" },
  { label: "Photo ID", className: "w-[13%]" },
  { label: "Date / Time", className: "w-[12%]" },
  { label: "Event", className: "w-[20%]" },
  { label: "Quality", className: "w-[12%]" },
  { label: "Price", className: "w-[11%] text-right" },
  { label: "Your share", className: "w-[11%] text-right" },
  { label: "Payout", className: "w-[15%]" },
]

const cellClass = "px-4 py-3 text-sm text-foreground/80"

/** Amounts arrive in öre; öre are shown when there are any (374.25), like Stripe */
const formatSek = (ore: number) =>
  `SEK ${(ore / 100)
    .toLocaleString("en-US", {
      minimumFractionDigits: ore % 100 ? 2 : 0,
      maximumFractionDigits: 2,
    })
    .replace(/,/g, " ")}`

// Loading placeholders. Bars sit inline in text lines, so each line keeps its real height
const bar = "inline-block h-[0.8em] rounded-sm bg-border align-middle"
const statValueSkeleton = (
  <Skeleton aria-hidden="true" className={cn(bar, "w-12")} />
)
/** Bar heights (% of the chart) while the sales load */
const CHART_SKELETON_HEIGHTS = [30, 45, 25, 60, 40, 70, 35, 50, 65, 30, 55, 40]

const photoCode = (photoId: string) => `#${photoId.slice(0, 8).toUpperCase()}`

const qualityLabel = (quality: string) =>
  QUALITY_SERIES.find((q) => q.key === quality)?.label ?? quality

const photoUrl = (photoId: string) =>
  resolveApiAssetUrl(`/api/v1/photographer/photos/${photoId}/preview`) ?? ""

export function SoldPhotos() {
  const { basePath, isAdmin } = useWorkspace()
  const { isPhotographer } = useAuth()

  const salesQuery = useQuery({
    ...salesQueryOptions(),
    enabled: !isAdmin && isPhotographer,
  })
  const sales = salesQuery.data ?? null
  // Only when there is nothing to show (a failed refetch keeps the sales)
  const loadError =
    salesQuery.isError && !salesQuery.data
      ? salesQuery.error.message || "Could not load your sales."
      : null
  // First load only: a refetch keeps showing the sales
  const isLoadingSales = !sales && !loadError
  const [selectedEventId, setSelectedEventId] = useState<string>("all")
  const [selectedQuality, setSelectedQuality] = useState<string>("all")
  const [selectedPeriod, setSelectedPeriod] = useState<string>("this_year")
  const [searchQuery, setSearchQuery] = useState("")
  // List ("grid") by default: it shows each sale's payout status
  const [viewMode, setViewMode] = useState<"card" | "grid">("grid")
  const [previewSrc, setPreviewSrc] = useState<string | null>(null)
  const [hoveredBarIndex, setHoveredBarIndex] = useState<number | null>(null)

  const allSales = useMemo(() => sales?.items ?? [], [sales])

  const eventOptions = useMemo(() => {
    const events = new Map<string, string>()
    allSales.forEach((sale) => events.set(sale.event_id, sale.event_name))
    return [
      { label: "All events", value: "all" },
      ...Array.from(events, ([value, label]) => ({ label, value })),
    ]
  }, [allSales])

  const qualityOptions = [
    { label: "All qualities", value: "all" },
    ...QUALITY_SERIES.map((q) => ({
      label: q.label,
      value: q.key,
      icon: <span className={cn("size-2 rounded-full", q.color)} />,
    })),
  ]

  const periodOptions = [
    { label: "All time", value: "all" },
    { label: "This month", value: "this_month" },
    { label: "This year", value: "this_year" },
    { label: "Last year", value: "last_year" },
  ]

  const filteredSales = useMemo(() => {
    const now = new Date()
    const query = searchQuery.trim().toLowerCase().replace(/^#/, "")
    return allSales.filter((sale) => {
      const soldAt = new Date(sale.sold_at)
      const matchPeriod =
        selectedPeriod === "all" ||
        (selectedPeriod === "this_month" &&
          soldAt.getMonth() === now.getMonth() &&
          soldAt.getFullYear() === now.getFullYear()) ||
        (selectedPeriod === "this_year" &&
          soldAt.getFullYear() === now.getFullYear()) ||
        (selectedPeriod === "last_year" &&
          soldAt.getFullYear() === now.getFullYear() - 1)
      return (
        matchPeriod &&
        (selectedEventId === "all" || sale.event_id === selectedEventId) &&
        (selectedQuality === "all" || sale.quality === selectedQuality) &&
        (!query || sale.photo_id.toLowerCase().startsWith(query))
      )
    })
  }, [allSales, searchQuery, selectedEventId, selectedPeriod, selectedQuality])

  // Not refunded: what counts towards sales and earnings
  const paidSales = useMemo(
    () => filteredSales.filter((sale) => !sale.refunded),
    [filteredSales]
  )

  // Card view: one card per photo, with how often it sold
  const soldPhotos = useMemo(() => {
    const byPhoto = new Map<string, { sale: SaleItem; count: number }>()
    paidSales.forEach((sale) => {
      const entry = byPhoto.get(sale.photo_id)
      if (entry) entry.count += 1
      else byPhoto.set(sale.photo_id, { sale, count: 1 })
    })
    return Array.from(byPhoto.values())
  }, [paidSales])

  const searchOptions = useMemo<ScopedSearchOption[]>(
    () =>
      Array.from(new Set(allSales.map((sale) => photoCode(sale.photo_id)))).map(
        (code) => ({ label: code, value: code, type: "id" as const })
      ),
    [allSales]
  )

  // Chart: sales count per quality in each bucket, plus the photographer's share
  const graphData = useMemo(() => {
    const now = new Date()
    let labels: string[]
    if (selectedPeriod === "this_month") {
      const days = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
      labels = Array.from({ length: days }, (_, i) => (i + 1).toString())
    } else if (selectedPeriod === "all") {
      const years = paidSales.map((sale) =>
        new Date(sale.sold_at).getFullYear()
      )
      const first = Math.min(now.getFullYear(), ...years)
      labels = Array.from({ length: now.getFullYear() - first + 1 }, (_, i) =>
        (first + i).toString()
      )
    } else {
      labels = MONTHS
    }

    const dataPoints = labels.map(() => ({
      web: 0,
      high: 0,
      commercial: 0,
      earnings: 0,
    }))
    paidSales.forEach((sale) => {
      const soldAt = new Date(sale.sold_at)
      const key =
        selectedPeriod === "this_month"
          ? soldAt.getDate().toString()
          : selectedPeriod === "all"
            ? soldAt.getFullYear().toString()
            : MONTHS[soldAt.getMonth()]
      const point = dataPoints[labels.indexOf(key)]
      if (!point) return
      if (sale.quality in point) point[sale.quality as QualityKey] += 1
      point.earnings += sale.photographer_amount
    })
    const maxTotal = Math.max(
      1,
      ...dataPoints.map((p) => p.web + p.high + p.commercial)
    )
    return { labels, dataPoints, maxTotal }
  }, [paidSales, selectedPeriod])

  const isResetDisabled =
    selectedEventId === "all" &&
    selectedQuality === "all" &&
    selectedPeriod === "all" &&
    searchQuery === ""

  const toUiPhoto = (sale: SaleItem, soldCount: number): Photo => {
    const soldAt = new Date(sale.sold_at)
    return {
      id: sale.photo_id,
      src: photoUrl(sale.photo_id),
      rider: sale.class_name || sale.event_name,
      horse: "",
      event: sale.event_name,
      eventId: sale.event_id,
      date: soldAt.toISOString(),
      time: soldAt.toLocaleTimeString("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      width: 600,
      height: 400,
      className: "photo-grid-item",
      city: "",
      arena: "",
      countryCode: "SE",
      soldCount,
    } as Photo
  }

  const totals = {
    count: paidSales.length,
    earnings: paidSales.reduce(
      (sum, sale) => sum + sale.photographer_amount,
      0
    ),
    transferred: paidSales
      .filter((sale) => sale.payout_status === "transferred")
      .reduce((sum, sale) => sum + sale.photographer_amount, 0),
    owed: paidSales
      .filter((sale) => ["owed", "failed"].includes(sale.payout_status ?? ""))
      .reduce((sum, sale) => sum + sale.photographer_amount, 0),
  }

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
        value={selectedQuality}
        options={qualityOptions}
        onChange={setSelectedQuality}
        label="Quality"
        placeholder="All qualities"
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

  if (isAdmin) {
    return (
      <div className="pb-20">
        <TitleHeader variant="workspace" title="Sales" />
        <div className="container py-10">
          <EmptyState
            icon={<DollarSign />}
            title="Platform sales overview is not available yet"
            description="Photographers see their own sales here."
          />
        </div>
      </div>
    )
  }

  return (
    <div className="pb-20">
      <TitleHeader variant="workspace" title="Sales" />

      <div className="relative min-h-[calc(100vh-200px)] bg-background py-10">
        <div className="container">
          {/* Sales trend card */}
          <div
            aria-busy={isLoadingSales || undefined}
            className="mb-6 rounded-xl border bg-card p-6"
          >
            {isLoadingSales && <span className="sr-only">Loading sales…</span>}
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
                  <StatBadge
                    label="Sold"
                    value={isLoadingSales ? statValueSkeleton : totals.count}
                  />
                  <StatBadge
                    label="Earnings"
                    value={
                      isLoadingSales
                        ? statValueSkeleton
                        : formatSek(totals.earnings)
                    }
                    className="bg-blue-50 text-blue-800 *:last:text-blue-700"
                  />
                  <StatBadge
                    label="Paid to Stripe"
                    value={
                      isLoadingSales
                        ? statValueSkeleton
                        : formatSek(totals.transferred)
                    }
                    className="bg-emerald-50 text-emerald-800 *:last:text-emerald-700"
                  />
                  {totals.owed > 0 && (
                    <StatBadge
                      label="Waiting for Stripe"
                      value={formatSek(totals.owed)}
                      className="bg-amber-50 text-amber-800 *:last:text-amber-700"
                    />
                  )}
                </div>

                <div className="flex flex-wrap gap-4 max-md:gap-x-3 max-md:gap-y-1">
                  {QUALITY_SERIES.map((q) => (
                    <div
                      key={q.key}
                      className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground"
                    >
                      <LegendDot className={q.color} />
                      <span>{q.label}</span>
                    </div>
                  ))}
                </div>
              </div>
              {isLoadingSales && (
                // The share line below (two lines on phones)
                <div aria-hidden="true" className="text-xs">
                  <span className="block">
                    <Skeleton className={cn(bar, "w-120 max-w-full")} />
                  </span>
                  <span className="block md:hidden">
                    <Skeleton className={cn(bar, "w-24")} />
                  </span>
                </div>
              )}
              {sales && (
                <p className="text-xs text-muted-foreground">
                  Your share is {100 - sales.commission_percent}% of each sale.
                  Stripe pays it to your bank on the {sales.payout_day_of_month}
                  th of each month.
                </p>
              )}
            </div>

            {/* Stacked bar chart, scaled to the busiest bucket */}
            <div className="relative flex h-50 w-full items-end gap-6 pb-6 max-md:gap-1">
              {graphData.dataPoints.map((point, i) => {
                const total = point.web + point.high + point.commercial
                const showLabel =
                  selectedPeriod === "this_month" ? i % 5 === 0 : true
                const label = graphData.labels[i]
                const isHovered = hoveredBarIndex === i
                const alignRight = i > graphData.dataPoints.length / 2

                return (
                  <div
                    key={label}
                    className="relative flex h-full flex-1 flex-col items-center justify-end gap-1"
                    onMouseEnter={() => setHoveredBarIndex(i)}
                    onMouseLeave={() => setHoveredBarIndex(null)}
                  >
                    {isLoadingSales ? (
                      <Skeleton
                        aria-hidden="true"
                        className="w-full rounded-t-sm rounded-b-none"
                        style={{
                          height: `${CHART_SKELETON_HEIGHTS[i % CHART_SKELETON_HEIGHTS.length]}%`,
                        }}
                      />
                    ) : (
                      <>
                        <div className="mb-0.5 text-[0.625rem] font-bold text-muted-foreground">
                          {total}
                        </div>
                        <div
                          className="flex min-h-1 w-full flex-col overflow-hidden rounded-t-sm bg-muted transition-transform duration-200 hover:z-2 hover:scale-x-110"
                          style={{
                            height: `${(total / graphData.maxTotal) * 85}%`,
                          }}
                        >
                          {[...QUALITY_SERIES].reverse().map((q) => (
                            <div
                              key={q.key}
                              className={cn(
                                "w-full transition-[height] duration-300",
                                q.color
                              )}
                              style={{
                                height: total
                                  ? `${(point[q.key] / total) * 100}%`
                                  : 0,
                              }}
                            />
                          ))}
                        </div>
                      </>
                    )}
                    {showLabel && (
                      <span className="absolute -bottom-6 text-xs font-semibold whitespace-nowrap text-muted-foreground/50">
                        {label}
                      </span>
                    )}

                    {isHovered && !isLoadingSales && (
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
                        {QUALITY_SERIES.map((q) => (
                          <TooltipRow
                            key={q.key}
                            label={
                              <>
                                <LegendDot className={q.color} />
                                {q.label}
                              </>
                            }
                            value={point[q.key]}
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
                            value={total}
                          />
                          <TooltipRow
                            className="mt-1"
                            label="Earnings"
                            value={formatSek(point.earnings)}
                            valueClassName="text-success"
                          />
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
                    setSelectedQuality("all")
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
                placeholder="Search photo ID..."
                options={searchOptions}
              />
            }
            meta={
              <div className="flex items-center gap-4">
                Showing{" "}
                {viewMode === "card" ? soldPhotos.length : filteredSales.length}
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

          {isLoadingSales ? (
            <MasonryGrid
              isLoading
              skeletonCount={10}
              renderSkeleton={() => <PhotoCardSkeleton pg landscape />}
            >
              {null}
            </MasonryGrid>
          ) : loadError ? (
            <EmptyState
              icon={<DollarSign />}
              title="Sales could not be loaded"
              description={loadError}
            />
          ) : filteredSales.length === 0 ? (
            <EmptyState
              icon={<DollarSign />}
              title={
                allSales.length === 0 ? "No sales yet" : "No results found"
              }
              description={
                allSales.length === 0
                  ? "Your sold photos will appear here once customers make a purchase."
                  : "Try adjusting your filters to find what you're looking for."
              }
            />
          ) : viewMode === "card" ? (
            <MasonryGrid isLoading={false}>
              {soldPhotos.map(({ sale, count }) => (
                <PhotoCard
                  key={sale.photo_id}
                  photo={toUiPhoto(sale, count)}
                  onClick={(p) => setPreviewSrc(p.src)}
                  variant="pgPublished"
                  selectable={false}
                  showEdit={false}
                  pgMeta={{
                    photoCode: photoCode(sale.photo_id),
                    soldCount: count,
                    priceStandard: QUALITY_TIERS[0].price,
                    priceHigh: QUALITY_TIERS[1].price,
                    priceCommercial: QUALITY_TIERS[2].price,
                  }}
                />
              ))}
            </MasonryGrid>
          ) : (
            <div className="overflow-hidden rounded-xl border bg-card">
              {/* min width: the % columns were ~40px each on phones (text overlapped); now it scrolls */}
              <Table className="min-w-220 table-fixed">
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
                  {filteredSales.map((sale) => {
                    const soldAt = new Date(sale.sold_at)
                    const payout = sale.refunded
                      ? PAYOUT_LABELS.reversed
                      : PAYOUT_LABELS[sale.payout_status ?? ""]
                    return (
                      <TableRow
                        key={sale.id}
                        className={cn(
                          "border-muted hover:bg-muted",
                          sale.refunded && "opacity-60"
                        )}
                      >
                        <TableCell className={cellClass}>
                          <button
                            type="button"
                            aria-label="Preview photo"
                            onClick={() =>
                              setPreviewSrc(photoUrl(sale.photo_id))
                            }
                          >
                            <img
                              src={photoUrl(sale.photo_id)}
                              className="size-10 cursor-pointer rounded object-cover"
                              alt=""
                            />
                          </button>
                        </TableCell>
                        <TableCell className={cellClass}>
                          <div className="truncate font-semibold text-foreground">
                            {photoCode(sale.photo_id)}
                          </div>
                          {sale.class_name && (
                            <div
                              className="truncate text-xs text-muted-foreground"
                              title={sale.class_name}
                            >
                              {sale.class_name}
                            </div>
                          )}
                        </TableCell>
                        <TableCell className={cellClass}>
                          <div className="truncate font-medium">
                            {soldAt.toLocaleDateString("en-GB", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </div>
                          <div className="truncate text-xs text-muted-foreground">
                            {soldAt.toLocaleTimeString("en-GB", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </div>
                        </TableCell>
                        <TableCell
                          className={cellClass}
                          title={sale.event_name}
                        >
                          <Link
                            to={`${basePath}/events/${sale.event_id}`}
                            className="block truncate font-medium text-primary hover:underline"
                          >
                            {sale.event_name}
                          </Link>
                        </TableCell>
                        <TableCell className={cellClass}>
                          <div className="inline-flex max-w-full items-center gap-1.5 font-medium">
                            <span
                              className={cn(
                                "size-2 shrink-0 rounded-full",
                                QUALITY_SERIES.find(
                                  (q) => q.key === sale.quality
                                )?.color ?? "bg-muted-foreground"
                              )}
                            />
                            <span className="truncate">
                              {qualityLabel(sale.quality)}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className={cn(cellClass, "text-right")}>
                          {formatSek(sale.amount)}
                        </TableCell>
                        <TableCell
                          className={cn(
                            cellClass,
                            "text-right font-semibold text-foreground"
                          )}
                        >
                          {/* A refunded sale's share was taken back or cancelled */}
                          {sale.refunded
                            ? "—"
                            : formatSek(sale.photographer_amount)}
                        </TableCell>
                        <TableCell className={cellClass}>
                          <span
                            className={cn(
                              "text-sm font-medium",
                              payout?.className ?? "text-muted-foreground"
                            )}
                          >
                            {payout?.label ?? "—"}
                          </span>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </div>

      <PhotoPreviewDialog
        src={previewSrc ?? undefined}
        onClose={() => setPreviewSrc(null)}
      />
    </div>
  )
}

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
