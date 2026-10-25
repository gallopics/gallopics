import { useMemo, useRef, useState } from "react"
import { Combobox as ComboboxPrimitive } from "@base-ui/react"
import { ChevronRight, Image, Search, X } from "lucide-react"

import { cn } from "@/lib/utils"
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

/**
 * Search field scoped to one page (event / rider / horse / photographer).
 * Typing filters the page; picking a suggestion sets the filter to it.
 * `v2` groups suggestions by type, like the header search.
 */
export interface ScopedSearchOption {
  label: string
  value: string
  type?: "rider" | "horse" | "photo" | "email" | "id"
  subtitle?: string
  id?: string
}

interface ScopedSearchBarProps {
  placeholder: string
  onSelect: (value: string) => void
  onSearchChange?: (value: string) => void
  currentValue: string
  options: ScopedSearchOption[]
  variant?: "v1" | "v2"
}

type GroupKey = "rider" | "horse" | "photo" | "other"

const GROUP_ORDER: GroupKey[] = ["rider", "horse", "photo", "other"]
const GROUP_LABELS: Record<GroupKey, string> = {
  rider: "Riders",
  horse: "Horses",
  photo: "Photos",
  other: "Other",
}

function groupOf(option: ScopedSearchOption): GroupKey {
  if (option.type === "rider" || option.type === "horse") return option.type
  if (option.type === "photo") return "photo"
  return "other"
}

function OptionIcon({ type }: { type?: ScopedSearchOption["type"] }) {
  switch (type) {
    case "rider":
      return <RiderIcon size={16} />
    case "horse":
      return <HorseIcon size={16} />
    case "photo":
    case "id":
      return <Image size={16} />
    default:
      return <Search size={16} />
  }
}

const ICON_BOX: Partial<Record<string, string>> = {
  rider: "bg-[#7c3aed]/8 text-[#7c3aed]!",
  horse: "bg-[#E65100]/8 text-[#E65100]!",
}

const toInput = (value: string) => (value === "All" ? "" : value)

export function ScopedSearchBar({
  placeholder,
  onSelect,
  onSearchChange,
  currentValue,
  options,
  variant = "v1",
}: ScopedSearchBarProps) {
  const [inputValue, setInputValue] = useState(toInput(currentValue))
  const [open, setOpen] = useState(false)
  const barRef = useRef<HTMLDivElement>(null)

  // Follow external changes (e.g. the page's reset button)
  const [syncedValue, setSyncedValue] = useState(currentValue)
  if (currentValue !== syncedValue) {
    setSyncedValue(currentValue)
    setInputValue(toInput(currentValue))
  }

  const filtered = useMemo(
    () =>
      options.filter(
        (opt) =>
          opt.label.toLowerCase().includes(inputValue.toLowerCase()) &&
          opt.value !== "All"
      ),
    [options, inputValue]
  )

  const items = useMemo(() => {
    if (variant !== "v2") return filtered
    return GROUP_ORDER.map((key) => ({
      value: key,
      items: filtered.filter((opt) => groupOf(opt) === key),
    })).filter((group) => group.items.length > 0)
  }, [filtered, variant])

  const handleSelect = (option: ScopedSearchOption | null) => {
    if (!option) return
    onSelect(option.value)
    onSearchChange?.(option.value)
    setInputValue(toInput(option.value))
    setOpen(false)
  }

  const handleClear = () => {
    onSelect("All")
    onSearchChange?.("")
    setInputValue("")
  }

  const renderItem = (opt: ScopedSearchOption) => (
    <ComboboxItem
      key={opt.value}
      value={opt}
      className={cn(
        "group/result data-highlighted:bg-primary/4",
        variant === "v2" ? "min-h-13 gap-3 px-4" : "px-4"
      )}
    >
      {variant === "v2" ? (
        <>
          <span
            className={cn(
              // keep the icon colour when the row is highlighted
              "flex size-8 shrink-0 items-center justify-center rounded-full border border-black/3 **:text-inherit!",
              ICON_BOX[opt.type ?? ""] ?? "bg-muted text-muted-foreground!"
            )}
          >
            <OptionIcon type={opt.type} />
          </span>
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="truncate text-sm font-medium text-foreground!">
              {opt.label}
            </span>
            {opt.subtitle && (
              <span className="mt-px truncate text-xs text-muted-foreground!">
                {opt.subtitle}
              </span>
            )}
          </span>
          <ChevronRight className="size-3.5 -translate-x-1 text-border! opacity-0 transition-all group-data-highlighted/result:translate-x-0 group-data-highlighted/result:opacity-100" />
        </>
      ) : (
        opt.label
      )}
    </ComboboxItem>
  )

  return (
    <Combobox
      items={items}
      filter={null}
      value={null}
      onValueChange={handleSelect}
      itemToStringLabel={(opt: ScopedSearchOption) => opt.label}
      inputValue={inputValue}
      onInputValueChange={(value, details) => {
        // Base UI empties the input on close (value is always null); keep it
        if (details.reason === "input-clear") return
        setInputValue(value)
        onSearchChange?.(value)
      }}
      open={open && (filtered.length > 0 || inputValue.length > 0)}
      onOpenChange={setOpen}
      openOnInputClick
    >
      <div className="relative h-10 min-w-50 flex-1">
        <div
          ref={barRef}
          className="flex h-10 items-center rounded-full border bg-card px-4 shadow-[0_1px_2px_rgba(0,0,0,0.05)] transition-all focus-within:border-ring focus-within:ring-4 focus-within:ring-ring/12"
        >
          <Search size={20} className="mr-2.5 shrink-0 text-muted-foreground" />
          <ComboboxPrimitive.Input
            placeholder={placeholder}
            className="h-full min-w-0 flex-1 border-none bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
          />
          {inputValue && (
            <Button
              variant="ghost"
              size="icon-xs"
              aria-label="Clear search"
              onClick={handleClear}
              className="ml-2 size-5 rounded-full bg-black/5 hover:bg-black/10"
            >
              <X className="size-3.5" />
            </Button>
          )}
        </div>
      </div>

      <ComboboxContent
        anchor={barRef}
        className={variant === "v2" ? "max-h-95" : "max-h-60"}
        sideOffset={4}
      >
        <ComboboxEmpty className="p-4">No matches</ComboboxEmpty>
        <ComboboxList className="max-h-[min(380px,var(--available-height))]">
          {variant === "v2"
            ? (group: { value: GroupKey; items: ScopedSearchOption[] }) => (
                <ComboboxGroup
                  key={group.value}
                  items={group.items}
                  className="border-b border-black/5 pb-1 last:border-b-0 last:pb-0"
                >
                  <ComboboxLabel className="px-4 pt-3 pb-1 font-bold tracking-[0.08em] uppercase">
                    {GROUP_LABELS[group.value]}
                  </ComboboxLabel>
                  <ComboboxCollection>{renderItem}</ComboboxCollection>
                </ComboboxGroup>
              )
            : renderItem}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  )
}
