import { Pencil, Trash2 } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  ScopedSearchBar,
  type ScopedSearchOption,
} from "@/components/ScopedSearchBar"

/**
 * The search, and the selection actions (or the photo count and Select all).
 * Sticks under the site header while photos are selected.
 */
export function SelectionBar({
  showSearch,
  searchOptions,
  searchTerm,
  onSearchChange,
  selectedCount,
  shownCount,
  onEdit,
  onDelete,
  onClear,
  onSelectAll,
}: {
  showSearch: boolean
  searchOptions: ScopedSearchOption[]
  searchTerm: string
  onSearchChange: (term: string) => void
  selectedCount: number
  shownCount: number
  onEdit: () => void
  onDelete: () => void
  onClear: () => void
  onSelectAll: () => void
}) {
  const hasSelection = selectedCount > 0
  // The selection actions also show without the filters
  if (!showSearch && !hasSelection) return null
  return (
    <div
      className={cn(
        // Wraps when the search and the counts don't fit on one row
        "mb-3 flex flex-wrap items-center justify-between gap-x-6 gap-y-3 py-3 max-md:gap-x-3",
        // Padding (and a matching negative margin) keeps the search off the bar's edge
        hasSelection &&
          "sticky top-(--site-header-height) z-30 -mx-3 bg-background px-3 shadow-sm"
      )}
    >
      {showSearch && (
        <div
          className={cn(
            "max-w-150 flex-[1_1_16rem] max-md:basis-full",
            hasSelection && "max-md:hidden"
          )}
        >
          <ScopedSearchBar
            placeholder="Search riders, horses, photo ID..."
            options={searchOptions}
            currentValue={searchTerm}
            onSelect={(value) => onSearchChange(value === "All" ? "" : value)}
            onSearchChange={onSearchChange}
            variant="v2"
          />
        </div>
      )}

      <div className="ml-auto flex items-center">
        {hasSelection ? (
          <div className="flex items-center gap-2">
            <span className="mr-4 text-[0.8125rem] font-semibold whitespace-nowrap text-foreground">
              {selectedCount} selected
            </span>

            <Button
              variant="outline"
              size="icon"
              className={roundButton}
              onClick={onEdit}
              title="Edit selection"
              aria-label="Edit selection"
            >
              <Pencil className="size-4.5" />
            </Button>

            <Button
              variant="destructive"
              size="icon"
              className={roundDanger}
              onClick={onDelete}
              title="Delete selection"
              aria-label="Delete selection"
            >
              <Trash2 className="size-4.5" />
            </Button>

            <Separator
              orientation="vertical"
              className="mr-2 ml-4 h-6 data-vertical:self-center"
            />

            <Button
              variant="ghost"
              size="sm"
              className="px-3"
              onClick={onClear}
            >
              Clear
            </Button>
          </div>
        ) : (
          <>
            <div className="mr-4 flex h-6 items-center text-sm font-medium text-muted-foreground">
              Showing {shownCount} photos
            </div>

            <div className="flex shrink-0 items-center gap-2 border-l pl-4">
              <Button
                variant="ghost"
                size="sm"
                className="px-3 text-foreground"
                onClick={onSelectAll}
              >
                Select all
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// Old round 40px header buttons in the selection bar
const roundButton = "size-10 text-muted-foreground"

const roundDanger = "size-10 border-destructive/20 hover:border-destructive"
