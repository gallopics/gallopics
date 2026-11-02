import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { useLocation, useNavigate } from "react-router"
import { Combobox as ComboboxPrimitive } from "@base-ui/react"
import { ArrowRight, Calendar, ChevronRight, Search, X } from "lucide-react"

import { cn } from "@/lib/utils"
import { useMediaQuery } from "@/hooks/useMediaQuery"
import { useMobileSearchMode } from "@/hooks/useMobileSearchMode"
import type { EventData } from "@/types"
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

// ─── Search ──────────────────────────────────────────────────────────

interface SearchResult {
  id: string
  title: string
  subtitle: string
  /** Why an event matched, e.g. "Rider: Anna Svensson" */
  matchLabel?: string
  meta?: string
}

/** The results list shows groups, each with a heading; today only events */
interface ResultGroup {
  label: string
  items: SearchResult[]
}

const MAX_RESULTS = 5
const EMPTY_INDEX: Record<string, string> = {}
const NO_EVENTS: EventData[] = []

interface EventSearchOptions {
  eventOptions: EventData[]
  eventSearchIndex: Record<string, string>
  eventMatchLabels: Record<string, string>
}

function searchAll(
  query: string,
  { eventOptions, eventSearchIndex, eventMatchLabels }: EventSearchOptions
): ResultGroup[] {
  if (query.length < 2) return []
  const lower = query.toLowerCase()

  const events: SearchResult[] = eventOptions
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
      title: event.name,
      subtitle: `${event.city} • ${event.period} • ${event.discipline}`,
      matchLabel: eventMatchLabels[event.id],
      meta: event.country,
    }))

  return events.length
    ? [{ label: "Events", items: events.slice(0, MAX_RESULTS) }]
    : []
}

// ─── Result rendering ────────────────────────────────────────────────

const ICON_BOX_LIGHT = "bg-[#1976D2]/8 text-[#1976D2]!"
const ICON_BOX_DARK = "bg-[#90caf9]/10 text-[#90caf9]!"

// ─── Component ───────────────────────────────────────────────────────

/** Home page event search, passed through Header and HomeHero */
export interface EventSearchProps {
  searchEvents?: EventData[]
  eventSearchIndex?: Record<string, string>
  eventMatchLabels?: Record<string, string>
  /** The photo tag search is still running */
  isSearching?: boolean
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
  /** The events to search (already filtered by the page's search) */
  eventOptions?: EventData[]
  /** Extra searchable text per event id (photo tags, class names...) */
  eventSearchIndex?: Record<string, string>
  /** Line shown under an event result, per event id */
  eventMatchLabels?: Record<string, string>
  /** The photo tag search is still running */
  isSearching?: boolean
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
  eventOptions = NO_EVENTS,
  eventSearchIndex = EMPTY_INDEX,
  eventMatchLabels = EMPTY_INDEX,
  isSearching = false,
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
  const triggerRef = useRef<HTMLButtonElement>(null)

  const { activateSearch, deactivateSearch } = useMobileSearchMode(
    wrapperRef as React.RefObject<HTMLElement>
  )

  const groups = useMemo(
    () =>
      searchAll(query, { eventOptions, eventSearchIndex, eventMatchLabels }),
    [query, eventOptions, eventSearchIndex, eventMatchLabels]
  )
  const placeholder = isMobile
    ? mobilePlaceholder || "Search events..."
    : desktopPlaceholder || "Search events, riders, horses, photographers..."

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

  const close = useCallback(
    (restoreFocus = false) => {
      setOpen(false)
      deactivateSearch()
      if (collapsible) {
        setIsExpanded(false)
        if (restoreFocus) {
          requestAnimationFrame(() => triggerRef.current?.focus())
        }
      }
    },
    [collapsible, deactivateSearch]
  )

  const clear = () => {
    setQuery("")
    onSearchChange?.("")
    setOpen(false)
    if (collapsible && !isExpanded) triggerRef.current?.focus()
    else inputRef.current?.focus()
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
    navigate(`/event/${item.id}`)
  }

  const input = (
    <ComboboxPrimitive.Input
      ref={inputRef}
      placeholder={placeholder}
      disabled={collapsible && !isExpanded}
      onKeyDown={(e) => {
        if (e.key === "Escape") close(true)
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

  const chipClearButton = (
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
      <ComboboxEmpty className="py-6">
        {isSearching ? "Searching..." : "No matches found"}
      </ComboboxEmpty>
      <ComboboxList className="max-h-[min(420px,var(--available-height))] px-0 py-2">
        {(group: ResultGroup) => (
          <ComboboxGroup
            key={group.label}
            items={group.items}
            className={cn(
              "mb-1 border-b pb-1 last:mb-0 last:border-b-0 last:pb-0",
              isDark ? "border-white/6" : "border-black/4"
            )}
          >
            <ComboboxLabel className="px-4 pt-2.5 pb-1 leading-normal font-semibold tracking-[0.08em] uppercase">
              {group.label}
            </ComboboxLabel>
            <ComboboxCollection>
              {(item: SearchResult) => (
                <ComboboxItem
                  key={item.id}
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
                      isDark ? ICON_BOX_DARK : ICON_BOX_LIGHT
                    )}
                  >
                    <Calendar size={16} />
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
      ? "flex h-14 items-center rounded-full border border-black/10 bg-card pr-2 pl-5 shadow-[0_4px_12px_rgba(0,0,0,0.08)] transition-all focus-within:border-ring focus-within:ring-4 focus-within:ring-ring/12"
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
        if (!next && details.reason === "escape-key") close(true)
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
        >
          {collapsible && !isExpanded ? (
            <>
              <button
                ref={triggerRef}
                type="button"
                aria-label={showChip ? "Edit search" : "Open search"}
                aria-expanded={false}
                onClick={() => setIsExpanded(true)}
                className={cn(
                  "flex h-full min-w-0 flex-1 items-center rounded-full outline-none focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:ring-inset",
                  !showChip && "justify-center"
                )}
              >
                <Search
                  size={20}
                  className={cn(
                    "shrink-0 text-white",
                    showChip && "max-[479px]:hidden"
                  )}
                />
                {showChip && (
                  <span
                    title={query}
                    className="min-w-0 flex-1 truncate text-left text-sm font-medium text-white min-[480px]:ml-2"
                  >
                    {query}
                  </span>
                )}
              </button>
              {showChip && chipClearButton}
            </>
          ) : (
            <>
              <Search
                size={20}
                className="mr-2.5 shrink-0 text-muted-foreground"
              />
              {!useOverlay && input}
              {!useOverlay && clearButton}
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
                    "ml-2 shrink-0 hover:translate-y-0 hover:scale-105",
                    heroMode ? "size-10" : "size-9"
                  )}
                >
                  <ArrowRight className="size-5" />
                </Button>
              )}
            </>
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
                Events • Riders • Horses • Photographers
              </div>
            </div>
          </div>,
          document.body
        )}
    </Combobox>
  )
}
