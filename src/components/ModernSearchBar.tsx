import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { useLocation, useNavigate } from "react-router"
import { Combobox as ComboboxPrimitive } from "@base-ui/react"
import {
  ArrowRight,
  Calendar,
  Camera,
  ChevronRight,
  Image,
  Search,
  X,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { useMediaQuery } from "@/hooks/useMediaQuery"
import { useMobileSearchMode } from "@/hooks/useMobileSearchMode"
import {
  COMPETITIONS,
  HORSE_PRIMARY_RIDER,
  HORSES,
  PHOTOGRAPHERS,
  photos,
  RIDER_PRIMARY_HORSE,
  RIDERS,
} from "@/data/mockData"
import type { EventData } from "@/data/mockEvents"
import { Button } from "@/components/ui/button"
import {
  Combobox,
  ComboboxCollection,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxGroup,
  ComboboxItem,
  ComboboxLabel,
  ComboboxList,
} from "@/components/ui/combobox"
import { HorseIcon } from "@/components/icons/HorseIcon"
import { RiderIcon } from "@/components/icons/RiderIcon"

// ─── Search (mock data) ──────────────────────────────────────────────

type ResultType = "event" | "rider" | "horse" | "photographer" | "photo"

interface SearchResult {
  id: string
  type: ResultType
  title: string
  subtitle: string
  /** Why an event matched, e.g. "Rider: Anna Svensson" */
  matchLabel?: string
  meta?: string
}

interface ResultGroup {
  value: ResultType
  items: SearchResult[]
}

const GROUP_LABELS: Record<ResultType, string> = {
  event: "Events",
  rider: "Riders",
  horse: "Horses",
  photographer: "Photographers",
  photo: "Photos",
}

const MAX_PER_GROUP = 3
const EMPTY_INDEX: Record<string, string> = {}

const formatDate = (d: string, end?: string) => {
  const startStr = new Date(d).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
  })
  if (!end) return startStr
  const endStr = new Date(end).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
  return `${startStr} – ${endStr}`
}

/** Top association based on explicit mappings (source of truth) */
const getAssociation = (id: string, type: "rider" | "horse"): string => {
  if (type === "rider") {
    const match = RIDER_PRIMARY_HORSE.find((m) => m.riderId === id)
    if (match) {
      const horse = HORSES.find((h) => h.id === match.primaryHorseId)
      return horse ? horse.registeredName || horse.name : "—"
    }
  } else {
    const match = HORSE_PRIMARY_RIDER.find((m) => m.horseId === id)
    if (match) {
      const rider = RIDERS.find((r) => r.id === match.primaryRiderId)
      return rider ? `${rider.firstName} ${rider.lastName}` : "—"
    }
  }
  return "—"
}

interface EventSearchOptions {
  eventOptions?: EventData[]
  eventSearchIndex: Record<string, string>
  eventMatchLabels: Record<string, string>
  eventOnly: boolean
}

function searchAll(
  query: string,
  {
    eventOptions,
    eventSearchIndex,
    eventMatchLabels,
    eventOnly,
  }: EventSearchOptions
): ResultGroup[] {
  if (query.length < 2) return []
  const lower = query.toLowerCase()

  const events: SearchResult[] = eventOptions
    ? eventOptions
        .filter((event) =>
          [
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
            .includes(lower)
        )
        .map((event) => ({
          id: event.id,
          type: "event" as const,
          title: event.name,
          subtitle: `${event.city} • ${event.period} • ${event.discipline}`,
          matchLabel: eventMatchLabels[event.id],
          meta: event.country,
        }))
    : COMPETITIONS.filter(
        (c) =>
          c.name.toLowerCase().includes(lower) ||
          c.city.toLowerCase().includes(lower)
      ).map((c) => ({
        id: c.id,
        type: "event" as const,
        title: c.name,
        subtitle: `${c.city} • ${formatDate(c.date, c.endDate)} • ${c.discipline}`,
        meta: c.country,
      }))

  if (eventOnly) {
    return events.length
      ? [{ value: "event", items: events.slice(0, MAX_PER_GROUP) }]
      : []
  }

  const riders = RIDERS.filter((r) =>
    `${r.firstName} ${r.lastName}`.toLowerCase().includes(lower)
  ).map((r) => ({
    id: r.id,
    type: "rider" as const,
    title: `${r.firstName} ${r.lastName}`,
    subtitle: getAssociation(r.id, "rider"),
  }))

  const horses = HORSES.filter(
    (h) =>
      h.name.toLowerCase().includes(lower) ||
      h.registeredName.toLowerCase().includes(lower)
  ).map((h) => ({
    id: h.id,
    type: "horse" as const,
    title: h.name,
    subtitle: getAssociation(h.id, "horse"),
  }))

  const photographers = PHOTOGRAPHERS.filter((p) =>
    `${p.firstName} ${p.lastName}`.toLowerCase().includes(lower)
  ).map((p) => ({
    id: p.id,
    type: "photographer" as const,
    title: `${p.firstName} ${p.lastName}`,
    subtitle: p.city || "Photographer",
  }))

  // Photo ID search: ignore a leading #
  const cleanQuery = lower.replace(/^#/, "")
  const matchingPhotos = photos
    .filter((p) => p.id.toLowerCase().includes(cleanQuery))
    .map((p) => ({
      id: p.id,
      type: "photo" as const,
      title: `#${p.id.toUpperCase()}`,
      subtitle: `${p.event} • ${p.rider}`,
    }))

  const groups: ResultGroup[] = [
    { value: "event", items: events },
    { value: "rider", items: riders },
    { value: "horse", items: horses },
    { value: "photographer", items: photographers },
    { value: "photo", items: matchingPhotos },
  ]

  return groups
    .map((g) => ({ ...g, items: g.items.slice(0, MAX_PER_GROUP) }))
    .filter((g) => g.items.length > 0)
}

const RESULT_PATHS: Record<ResultType, string> = {
  event: "/event",
  rider: "/rider",
  horse: "/horse",
  photographer: "/photographer",
  photo: "/photo",
}

// ─── Result rendering ────────────────────────────────────────────────

function ResultIcon({ type }: { type: ResultType }) {
  switch (type) {
    case "event":
      return <Calendar size={16} />
    case "rider":
      return <RiderIcon size={16} />
    case "horse":
      return <HorseIcon size={16} />
    case "photographer":
      return <Camera size={16} />
    case "photo":
      return <Image size={16} />
  }
}

const ICON_BOX_LIGHT: Partial<Record<ResultType, string>> = {
  event: "bg-[#1976D2]/8 text-[#1976D2]!",
  rider: "bg-[#7c3aed]/8 text-[#7c3aed]!",
  horse: "bg-[#E65100]/8 text-[#E65100]!",
}

const ICON_BOX_DARK: Partial<Record<ResultType, string>> = {
  event: "bg-[#90caf9]/10 text-[#90caf9]!",
  rider: "bg-[#a78bfa]/10 text-[#a78bfa]!",
  horse: "bg-[#ffcc80]/10 text-[#ffcc80]!",
}

// ─── Component ───────────────────────────────────────────────────────

/** Home page event search, passed through Header and HomeHero */
export interface EventSearchProps {
  searchEvents?: EventData[]
  eventSearchIndex?: Record<string, string>
  eventMatchLabels?: Record<string, string>
  onSearchChange?: (value: string) => void
}

interface ModernSearchBarProps {
  /** Header search: a dark circle that expands into a dark pill */
  collapsible?: boolean
  theme?: "dark" | "light"
  /** On mobile, tapping opens the header search overlay instead */
  isMobileTrigger?: boolean
  mobilePlaceholder?: string
  desktopPlaceholder?: string
  /** Hero search: tall white bar with a "go" button */
  heroMode?: boolean
  /** Home page: search these API events instead of the mock data */
  eventOptions?: EventData[]
  /** Extra searchable text per event id (photo tags, class names...) */
  eventSearchIndex?: Record<string, string>
  /** Line shown under an event result, per event id */
  eventMatchLabels?: Record<string, string>
  /** Only show the Events group */
  eventOnly?: boolean
  onSearchChange?: (value: string) => void
}

let measureCtx: CanvasRenderingContext2D | null = null

/** Width of the header chip's query text (14px, medium, page font) */
function measureChipText(text: string) {
  measureCtx ??= document.createElement("canvas").getContext("2d")
  if (!measureCtx) return 0
  measureCtx.font = `500 14px ${getComputedStyle(document.body).fontFamily}`
  return Math.ceil(measureCtx.measureText(text).width) + 1
}

export function ModernSearchBar({
  collapsible = false,
  theme = "dark",
  isMobileTrigger = false,
  mobilePlaceholder,
  desktopPlaceholder,
  heroMode = false,
  eventOptions,
  eventSearchIndex = EMPTY_INDEX,
  eventMatchLabels = EMPTY_INDEX,
  eventOnly = false,
  onSearchChange,
}: ModernSearchBarProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const isMobile = useMediaQuery("(max-width: 768px)")

  const [query, setQuery] = useState("")
  const [open, setOpen] = useState(false)
  const [isExpanded, setIsExpanded] = useState(!collapsible)

  const wrapperRef = useRef<HTMLDivElement>(null)
  const barRef = useRef<HTMLDivElement>(null)
  const overlayRef = useRef<HTMLDivElement>(null)
  const popupRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const { activateSearch, deactivateSearch } = useMobileSearchMode(
    wrapperRef as React.RefObject<HTMLElement>
  )

  const groups = useMemo(
    () =>
      searchAll(query, {
        eventOptions,
        eventSearchIndex,
        eventMatchLabels,
        eventOnly,
      }),
    [query, eventOptions, eventSearchIndex, eventMatchLabels, eventOnly]
  )
  const placeholder = isMobile
    ? mobilePlaceholder || (eventOnly ? "Search events..." : "Search...")
    : desktopPlaceholder ||
      (eventOnly
        ? "Search events, riders, horses, photographers..."
        : "Search riders, horses, events, photographers, photo ID...")

  const isDark = theme === "dark" || collapsible
  const useOverlay = collapsible && isExpanded && isMobile
  // Collapsed header search with an active query: show it as a chip (query + clear)
  const showChip = collapsible && !isExpanded && query.length > 0
  const isSmallPhone = useMediaQuery("(max-width: 479px)")
  // The chip gets a px width (CSS can't animate width: auto), so it opens/closes like the round button
  const chipWidth = useMemo(() => {
    if (!showChip) return undefined
    const text = measureChipText(query)
    return isSmallPhone
      ? 12 + Math.min(text, 64) + 4 + 28 + 4 // pl-3, text, ml-1, clear size-7, pr-1
      : 14 + 20 + 8 + Math.min(text, 128) + 6 + 32 + 6 // pl-3.5, icon, ml-2, text, ml-1.5, clear size-8, pr-1.5
  }, [showChip, query, isSmallPhone])
  const isMobileTriggerActive = isMobileTrigger && isMobile

  const close = useCallback(() => {
    setOpen(false)
    deactivateSearch()
    if (collapsible) setIsExpanded(false)
  }, [collapsible, deactivateSearch])

  const clear = () => {
    setQuery("")
    onSearchChange?.("")
    setOpen(false)
    inputRef.current?.focus()
  }

  // Collapse the header search on outside click
  useEffect(() => {
    if (!collapsible || !isExpanded) return

    const onPointerDown = (e: PointerEvent) => {
      const target = e.target as Node
      const inside = [wrapperRef, overlayRef, popupRef].some((ref) =>
        ref.current?.contains(target)
      )
      if (!inside) close()
    }
    document.addEventListener("pointerdown", onPointerDown)
    return () => document.removeEventListener("pointerdown", onPointerDown)
  }, [collapsible, isExpanded, close])

  // Other search bars (hero, mobile) ask the header search to open
  useEffect(() => {
    if (!collapsible) return

    const handleOpenEvent = () => {
      setIsExpanded(true)
      if (query.length >= 2) setOpen(true)
    }
    window.addEventListener("open-header-search", handleOpenEvent)
    return () =>
      window.removeEventListener("open-header-search", handleOpenEvent)
  }, [collapsible, query])

  // Focus when the header search expands
  useEffect(() => {
    if (collapsible && isExpanded) inputRef.current?.focus()
  }, [collapsible, isExpanded, useOverlay])

  // Lock page scroll behind the mobile overlay (not in the PG workspace)
  useEffect(() => {
    if (!useOverlay || location.pathname.startsWith("/pg")) return

    document.body.style.overflow = "hidden"
    document.body.classList.add("isSearchMode")
    return () => {
      document.body.style.overflow = ""
      document.body.classList.remove("isSearchMode")
    }
  }, [useOverlay, location.pathname])

  const handleSelect = (item: SearchResult | null) => {
    if (!item) return
    close()
    setQuery("")
    onSearchChange?.("")
    navigate(`${RESULT_PATHS[item.type]}/${item.id}`)
  }

  const input = (
    <ComboboxPrimitive.Input
      ref={inputRef}
      placeholder={placeholder}
      disabled={collapsible && !isExpanded}
      onKeyDown={(e) => {
        if (e.key === "Escape") close()
      }}
      onFocus={(e) => {
        if (isMobileTriggerActive) {
          e.currentTarget.blur()
          return
        }
        activateSearch()
        if (query.length >= 2) setOpen(true)
      }}
      onClick={(e) => {
        if (isMobileTriggerActive) {
          e.preventDefault()
          window.dispatchEvent(new Event("open-header-search"))
        }
      }}
      className={cn(
        "min-w-0 flex-1 border-none bg-transparent text-sm font-normal outline-none not-placeholder-shown:font-medium",
        isDark
          ? "text-white placeholder:text-[#aaa]"
          : "text-foreground caret-primary placeholder:text-muted-foreground",
        !useOverlay && "not-placeholder-shown:text-base",
        useOverlay && "text-base placeholder:text-white/70",
        collapsible &&
          !isExpanded &&
          "pointer-events-none w-0 flex-none opacity-0"
      )}
    />
  )

  const clearButton = query && (
    <Button
      variant="ghost"
      size="icon-xs"
      aria-label="Clear search"
      onClick={(e) => {
        e.stopPropagation()
        clear()
      }}
      className={cn(
        "ml-2 rounded-full",
        isDark
          ? "bg-white/15 text-border hover:bg-white/30 hover:text-white"
          : "bg-black/5 hover:bg-black/10"
      )}
    >
      <X className="size-3.5" />
    </Button>
  )

  const chip = (
    <>
      <span
        title={query}
        className="min-w-0 flex-1 truncate text-sm font-medium text-white min-[480px]:ml-2"
      >
        {query}
      </span>
      <button
        type="button"
        aria-label="Clear search"
        onClick={(e) => {
          e.stopPropagation()
          clear()
        }}
        className="ml-1 flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-full bg-white/15 text-border transition-colors hover:bg-white/30 hover:text-white focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:outline-none min-[480px]:ml-1.5 min-[480px]:size-8"
      >
        <X className="size-3.5" />
      </button>
    </>
  )

  const results = (
    <ComboboxContent
      ref={popupRef}
      anchor={useOverlay ? overlayRef : barRef}
      align={collapsible && !useOverlay ? "end" : "start"}
      sideOffset={8}
      className={cn(
        collapsible && !useOverlay && "min-w-0",
        isDark &&
          "bg-[#262626] text-[#eee] shadow-[0_16px_48px_rgba(0,0,0,0.5)] ring-white/10"
      )}
    >
      <ComboboxEmpty className="py-6">No matches found</ComboboxEmpty>
      <ComboboxList className="max-h-[min(420px,var(--available-height))] px-0 py-2">
        {(group: ResultGroup) => (
          <ComboboxGroup
            key={group.value}
            items={group.items}
            className={cn(
              "mb-1 border-b pb-1 last:mb-0 last:border-b-0 last:pb-0",
              isDark ? "border-white/6" : "border-black/4"
            )}
          >
            <ComboboxLabel className="px-4 pt-2.5 pb-1 leading-normal font-semibold tracking-[0.08em] uppercase">
              {GROUP_LABELS[group.value]}
            </ComboboxLabel>
            <ComboboxCollection>
              {(item: SearchResult) => (
                <ComboboxItem
                  key={`${item.type}-${item.id}`}
                  value={item}
                  className={cn(
                    "group/result gap-3 px-4",
                    item.matchLabel ? "h-19.5" : "h-14",
                    isDark
                      ? "data-highlighted:bg-white/6"
                      : "data-highlighted:bg-primary/8"
                  )}
                >
                  <span
                    className={cn(
                      // keep the icon colour when the row is highlighted
                      "flex size-8 shrink-0 items-center justify-center rounded-full **:text-inherit!",
                      (isDark ? ICON_BOX_DARK : ICON_BOX_LIGHT)[item.type] ??
                        (isDark
                          ? "bg-foreground text-border!"
                          : "bg-muted text-muted-foreground!")
                    )}
                  >
                    <ResultIcon type={item.type} />
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span
                      className={cn(
                        "truncate text-sm leading-tight font-medium",
                        isDark ? "text-[#eee]!" : "text-foreground!"
                      )}
                    >
                      {item.title}
                    </span>
                    {item.matchLabel && (
                      <span
                        className={cn(
                          "mt-1 truncate text-xs leading-tight font-medium",
                          isDark ? "text-[#90caf9]!" : "text-primary!"
                        )}
                      >
                        {item.matchLabel}
                      </span>
                    )}
                    <span
                      className={cn(
                        "truncate text-xs leading-tight text-muted-foreground!",
                        item.matchLabel ? "mt-1" : "mt-0.5"
                      )}
                    >
                      {item.subtitle}
                    </span>
                  </span>
                  <ChevronRight className="size-3.5 -translate-x-1 text-muted-foreground! opacity-0 transition-all group-data-highlighted/result:translate-x-0 group-data-highlighted/result:opacity-100" />
                </ComboboxItem>
              )}
            </ComboboxCollection>
          </ComboboxGroup>
        )}
      </ComboboxList>
    </ComboboxContent>
  )

  const barClass = collapsible
    ? cn(
        "absolute top-1/2 right-0 flex -translate-y-1/2 items-center overflow-hidden bg-[#1a1a1a] transition-[width,border-radius,background-color,scale] duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)]",
        isExpanded && !useOverlay
          ? "h-10 w-120 rounded-full border border-white/15 px-4 shadow-[0_10px_30px_rgba(0,0,0,0.25)]"
          : showChip
            ? "h-11 cursor-pointer rounded-full pr-1 pl-3 shadow-[0_2px_8px_rgba(0,0,0,0.1)] hover:bg-[#333] min-[480px]:pr-1.5 min-[480px]:pl-3.5"
            : "size-11 cursor-pointer justify-center rounded-full shadow-[0_2px_8px_rgba(0,0,0,0.1)] hover:scale-105 hover:bg-[#333]"
      )
    : heroMode
      ? "relative flex h-14 items-center rounded-full border border-black/10 bg-card pr-14 pl-5 shadow-[0_4px_12px_rgba(0,0,0,0.08)] transition-all focus-within:border-ring focus-within:ring-4 focus-within:ring-ring/12"
      : cn(
          "flex h-10 items-center rounded-full px-3.5 transition-all",
          isDark
            ? "border border-white/15 bg-[#1a1a1a] focus-within:border-white/30 focus-within:bg-[#2c2c2c]"
            : "border border-black/10 bg-card shadow-[0_4px_12px_rgba(0,0,0,0.08)] focus-within:border-ring focus-within:ring-4 focus-within:ring-ring/12"
        )

  const wrapperClass = collapsible
    ? "relative size-11 transition-[width] duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)]"
    : heroMode
      ? "relative w-full"
      : "relative w-105 transition-[width] duration-300 focus-within:w-125"

  return (
    <Combobox
      items={groups}
      filter={null}
      value={null}
      onValueChange={handleSelect}
      itemToStringLabel={(item: SearchResult) => item.title}
      inputValue={query}
      onInputValueChange={(value, details) => {
        // Base UI empties the input on close (value is always null); keep the query
        if (details.reason === "input-clear") return
        setQuery(value)
        onSearchChange?.(value)
        setOpen(value.length >= 2)
      }}
      open={open && query.length >= 2}
      onOpenChange={(next, details) => {
        setOpen(next)
        if (!next && details.reason === "escape-key") close()
      }}
    >
      <div
        className={wrapperClass}
        ref={wrapperRef}
        style={chipWidth ? { width: chipWidth } : undefined}
      >
        <div
          ref={barRef}
          className={barClass}
          style={chipWidth ? { width: chipWidth } : undefined}
          onClick={() => {
            if (collapsible && !isExpanded) setIsExpanded(true)
          }}
        >
          <Search
            size={20}
            className={cn(
              "shrink-0",
              collapsible && !isExpanded
                ? "text-white"
                : "mr-2.5 text-muted-foreground",
              // small phones: no room next to cart + account, the chip is just query + clear
              showChip && "max-[479px]:hidden"
            )}
          />
          {!useOverlay && input}
          {!useOverlay && (showChip ? chip : clearButton)}
          {theme === "light" && !collapsible && (
            <Button
              size="icon"
              aria-label="Search"
              onClick={(e) => {
                e.stopPropagation()
                if (query.length >= 2) setOpen(true)
                inputRef.current?.focus()
              }}
              className={cn(
                "shrink-0 hover:scale-105",
                heroMode
                  ? // keep the vertical centring on hover (no lift, like the old site)
                    "absolute top-1/2 right-2 size-10 -translate-y-1/2 hover:-translate-y-1/2"
                  : "ml-2 size-9 hover:translate-y-0"
              )}
            >
              <ArrowRight className="size-5" />
            </Button>
          )}
        </div>
      </div>

      {/* one place in the tree (it portals to body), so switching to the mobile overlay doesn't remount it mid-close */}
      {results}

      {useOverlay &&
        createPortal(
          <div className="pointer-events-none fixed inset-0 z-50 flex flex-col items-center px-3 pt-[calc(env(safe-area-inset-top)+12px)]">
            <div
              className="pointer-events-auto fixed inset-0 animate-in bg-black/65 backdrop-blur-[2px] fade-in-0"
              onClick={() => {
                // Tapping outside cancels the search (text and filter together)
                close()
                setQuery("")
                onSearchChange?.("")
              }}
            />
            <div
              ref={overlayRef}
              className="pointer-events-auto relative w-full"
            >
              <div className="flex h-12 w-full items-center rounded-xl border border-white/15 bg-[#1a1a1a] px-4 shadow-[0_4px_20px_rgba(0,0,0,0.3)]">
                <Search
                  size={20}
                  className="mr-2 shrink-0 text-muted-foreground"
                />
                {input}
                {clearButton}
              </div>
              <div className="pointer-events-none mt-2 line-clamp-2 text-center text-xs font-medium tracking-[0.02em] text-white/90 [text-shadow:0_1px_2px_rgba(0,0,0,0.6)]">
                {eventOnly
                  ? "Events • Riders • Horses • Photographers"
                  : "Riders • Horses • Events • Photographers • Photo ID"}
              </div>
            </div>
          </div>,
          document.body
        )}
    </Combobox>
  )
}
