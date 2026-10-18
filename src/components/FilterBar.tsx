import { RotateCcw } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface FilterBarProps {
  /** Filter chips / dropdowns, ending with the reset button */
  filters: React.ReactNode
  /** Scoped search field */
  search?: React.ReactNode
  /** Short text at the end of the row, e.g. "Showing 24 photos" */
  meta?: React.ReactNode
  /**
   * `fill`: search takes the remaining width (old public pages);
   * `fixed`: max 520px (old workspace pages with shared-filters.css)
   */
  searchWidth?: "fill" | "fixed"
}

/**
 * Filters left, search right (old `.filter-container`).
 * Mobile: filters become a swipeable strip, search moves below.
 */
export function FilterBar({
  filters,
  search,
  meta,
  searchWidth = "fill",
}: FilterBarProps) {
  return (
    // develop: shared-filters.css .filters-wrapper got margin-top 24px (workspace pages)
    <div className={cn("mb-6", searchWidth === "fixed" && "mt-6")}>
      <div
        className={cn(
          "flex w-full items-center justify-between max-md:flex-col max-md:items-start",
          // old index.css .filter-container (public) gap 16 / shared-filters.css (workspace) gap 12
          searchWidth === "fixed" ? "gap-3" : "gap-4 max-md:gap-3"
        )}
      >
        <div
          className={cn(
            // old .filter-group gap: 12px on public pages, 8px on workspace pages
            searchWidth === "fixed" ? "gap-2" : "gap-3 max-md:gap-2",
            "flex flex-wrap items-center max-md:-mr-4 max-md:w-[calc(100%+16px)] max-md:scrollbar-none max-md:flex-nowrap max-md:overflow-x-auto max-md:mask-[linear-gradient(to_right,black_85%,transparent_100%)] max-md:pr-4 max-md:pb-2 max-md:*:shrink-0 max-md:[&::-webkit-scrollbar]:hidden"
          )}
        >
          {filters}
        </div>
        {search && (
          <div
            className={cn(
              "max-md:mt-1 max-md:w-full max-md:flex-none",
              searchWidth === "fixed"
                ? "min-w-70 flex-[0_1_520px]"
                : "min-w-50 flex-[1_1_auto]"
            )}
          >
            {search}
          </div>
        )}
        {meta && (
          <div className="text-[0.8125rem] font-medium whitespace-nowrap text-muted-foreground max-md:mt-1 max-md:ml-1 max-md:text-xs">
            {meta}
          </div>
        )}
      </div>
    </div>
  )
}

export function ResetFiltersButton({
  disabled,
  onClick,
}: {
  disabled?: boolean
  onClick: () => void
}) {
  return (
    <Button
      variant="outline"
      size="icon"
      title="Reset filters"
      aria-label="Reset filters"
      disabled={disabled}
      onClick={onClick}
      className="size-10 shrink-0 text-muted-foreground hover:-rotate-30 active:-rotate-180 disabled:opacity-35 max-md:mr-4"
    >
      <RotateCcw className="size-4.5" />
    </Button>
  )
}
