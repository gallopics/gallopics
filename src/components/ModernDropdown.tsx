import { cn } from "@/lib/utils"
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxTrigger,
  ComboboxValue,
} from "@/components/ui/combobox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

/* Old ModernDropdown API on top of shadcn Select (or Combobox with search). */

export interface DropdownOption {
  label: string
  subtext?: string
  /** Longer explanation shown under the label in the list */
  description?: string
  value: string
  icon?: React.ReactNode
  disabled?: boolean
}

interface ModernDropdownProps {
  label?: string
  value: string
  options: DropdownOption[]
  onChange: (value: string) => void
  icon?: React.ReactNode
  placeholder?: string
  searchPlaceholder?: string
  showSearch?: boolean
  /** `pill`: 40px rounded filter chip; `default`: form field */
  variant?: "default" | "pill"
  disabled?: boolean
  className?: string
}

const pillTrigger =
  "h-10! w-auto min-w-0 gap-2 rounded-full bg-card px-4 font-medium shadow-none hover:border-border hover:bg-background data-popup-open:border-primary data-popup-open:bg-primary/8 data-popup-open:text-primary data-popup-open:ring-0"

function OptionContent({
  option,
  inList,
  pill,
}: {
  option: DropdownOption
  inList?: boolean
  /** Pill trigger: old 16px icon slot */
  pill?: boolean
}) {
  return (
    <span
      className={cn("flex min-w-0 items-center", inList ? "gap-3" : "gap-2")}
    >
      {option.icon && (
        <span
          className={cn(
            "flex shrink-0 items-center justify-center",
            pill ? "w-4 text-base" : "w-5 text-[1.1em]"
          )}
        >
          {option.icon}
        </span>
      )}
      <span
        className={cn(
          "flex min-w-0 flex-col text-left",
          // Trigger: old default trigger (14px medium label, 12px subtext, 1.5 line height)
          inList ? "gap-0.5 leading-normal" : "gap-1 leading-normal"
        )}
      >
        <span className={cn("truncate", !inList && "font-medium")}>
          {option.label}
        </span>
        {option.subtext && (
          <span
            className={cn(
              "text-xs leading-normal font-normal text-muted-foreground"
            )}
          >
            {option.subtext}
          </span>
        )}
        {inList && option.description && (
          <span className="text-xs leading-normal font-normal whitespace-normal text-muted-foreground/70">
            {option.description}
          </span>
        )}
      </span>
    </span>
  )
}

export function ModernDropdown({
  value,
  options,
  onChange,
  icon,
  placeholder = "Select",
  searchPlaceholder = "Search...",
  showSearch = false,
  variant = "default",
  disabled = false,
  className,
}: ModernDropdownProps) {
  const isPill = variant === "pill"
  const selected = options.find((o) => o.value === value) ?? null

  const triggerContent = (
    <>
      {icon && <span className="flex shrink-0 items-center">{icon}</span>}
      {selected ? (
        <OptionContent option={selected} pill={isPill} />
      ) : (
        <span className="text-muted-foreground">{placeholder}</span>
      )}
    </>
  )

  if (showSearch) {
    return (
      <Combobox
        items={options}
        value={selected}
        onValueChange={(option: DropdownOption | null) => {
          if (option) onChange(option.value)
        }}
        itemToStringLabel={(option: DropdownOption) => option.label}
        isItemEqualToValue={(a: DropdownOption, b: DropdownOption) =>
          a.value === b.value
        }
        disabled={disabled}
      >
        <ComboboxTrigger
          className={cn(
            "flex h-11 w-full items-center justify-between gap-2 rounded-md border border-border bg-card px-4 text-sm text-foreground transition-all outline-none hover:border-muted-foreground/50 focus-visible:border-ring focus-visible:ring-4 focus-visible:ring-ring/8 disabled:opacity-50 data-popup-open:border-ring data-popup-open:ring-4 data-popup-open:ring-ring/8",
            isPill && pillTrigger,
            className
          )}
        >
          <ComboboxValue>{triggerContent}</ComboboxValue>
        </ComboboxTrigger>
        <ComboboxContent align="start" className="min-w-60">
          <ComboboxInput showTrigger={false} placeholder={searchPlaceholder} />
          <ComboboxEmpty>No results</ComboboxEmpty>
          <ComboboxList>
            {(option: DropdownOption) => (
              <ComboboxItem
                key={option.value}
                value={option}
                disabled={option.disabled}
              >
                <OptionContent option={option} inList />
              </ComboboxItem>
            )}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
    )
  }

  return (
    <Select
      items={options}
      value={value}
      onValueChange={(next) => onChange(String(next))}
      disabled={disabled}
    >
      <SelectTrigger
        size={isPill ? "sm" : "default"}
        className={cn(
          "w-full",
          // Default trigger grows with a two-line option (old min-h-11 py-2.5)
          !isPill && "h-auto min-h-11 py-2.5 data-[size=default]:h-auto",
          isPill && cn("w-auto", pillTrigger),
          className
        )}
      >
        <SelectValue>{() => triggerContent}</SelectValue>
      </SelectTrigger>
      <SelectContent align="start" className="min-w-60">
        {options.map((option) => (
          <SelectItem
            key={option.value}
            value={option.value}
            disabled={option.disabled}
            className={cn(option.description && "items-start py-3")}
          >
            <OptionContent option={option} inList />
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
