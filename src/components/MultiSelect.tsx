import {
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxItem,
  ComboboxList,
  ComboboxValue,
  useComboboxAnchor,
} from "@/components/ui/combobox"

export interface MultiSelectOption {
  label: string
  value: string
  subtext?: string
  /** Avatar image URL */
  icon?: string
}

interface MultiSelectProps {
  label?: string
  values: string[]
  options: MultiSelectOption[]
  onChange: (values: string[]) => void
  placeholder?: string
  searchPlaceholder?: string
  disabled?: boolean
}

/** Searchable multi-select with removable chips (old MultiSelect API). */
export function MultiSelect({
  values,
  options,
  onChange,
  placeholder = "Select options",
  disabled = false,
}: MultiSelectProps) {
  const anchor = useComboboxAnchor()
  const selected = options.filter((o) => values.includes(o.value))

  return (
    <Combobox
      multiple
      items={options}
      value={selected}
      onValueChange={(next: MultiSelectOption[]) =>
        onChange(next.map((o) => o.value))
      }
      itemToStringLabel={(o: MultiSelectOption) => o.label}
      isItemEqualToValue={(a: MultiSelectOption, b: MultiSelectOption) =>
        a.value === b.value
      }
      disabled={disabled}
    >
      <ComboboxChips ref={anchor} className="w-full">
        <ComboboxValue>
          {(chips: MultiSelectOption[]) => (
            <>
              {chips.map((o) => (
                <ComboboxChip
                  key={o.value}
                  className="h-7 gap-1.5 rounded-full bg-primary/8 px-2.5 text-[0.8125rem] text-primary"
                >
                  {o.icon && (
                    <img
                      src={o.icon}
                      alt=""
                      className="-ml-1 size-5 rounded-full object-cover"
                    />
                  )}
                  {o.label}
                </ComboboxChip>
              ))}
              <ComboboxChipsInput
                placeholder={chips.length ? "" : placeholder}
              />
            </>
          )}
        </ComboboxValue>
      </ComboboxChips>
      <ComboboxContent anchor={anchor}>
        <ComboboxEmpty>No results</ComboboxEmpty>
        <ComboboxList>
          {(o: MultiSelectOption) => (
            <ComboboxItem key={o.value} value={o} className="min-h-12 gap-3">
              {o.icon && (
                <img
                  src={o.icon}
                  alt=""
                  className="size-6 shrink-0 rounded-full object-cover"
                />
              )}
              <span className="truncate">{o.label}</span>
              {o.subtext && (
                <span className="ml-auto text-xs font-normal whitespace-nowrap text-muted-foreground">
                  {o.subtext}
                </span>
              )}
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  )
}
