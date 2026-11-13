import { FilterChip } from "@/components/FilterChip"

import { ALL_CHIP, type PhotoChip } from "./photoFilters"

/** Tag filters beside the photos; on phones one scrolling row above them */
export function FilterSidebar({
  chips,
  activeChip,
  onChange,
}: {
  chips: PhotoChip[]
  activeChip: string
  onChange: (chipId: string) => void
}) {
  return (
    <div className="w-55 shrink-0 self-start pt-3 max-md:w-full">
      <div className="flex w-full flex-col items-stretch gap-2 pr-2 max-md:flex-row max-md:overflow-x-auto max-md:pr-0 max-md:pb-1">
        {chips.map((chip) => (
          <FilterChip
            key={chip.id}
            // Full-width rows, count on the right; long names wrap to two lines
            className="h-auto min-h-9 w-full justify-between rounded-xl py-1.5 text-left whitespace-normal max-md:w-auto max-md:max-w-60 max-md:shrink-0"
            label={
              <span
                className="flex min-w-0 items-center gap-1.5"
                title={chip.label}
              >
                <span className="line-clamp-2 leading-[1.3]">{chip.label}</span>
              </span>
            }
            isActive={activeChip === chip.id}
            // The active chip turns the filter off
            onClick={() =>
              onChange(activeChip === chip.id ? ALL_CHIP : chip.id)
            }
            variant="filterCount"
            count={chip.count}
          />
        ))}
      </div>
    </div>
  )
}
