import { Fragment } from "react"

interface MasonryGridProps {
  children: React.ReactNode
  isLoading?: boolean
  skeletonCount?: number
  renderSkeleton?: () => React.ReactNode
}

/** CSS-columns masonry: 2 → 3 → 4 → 5 → 6 columns as the screen grows. */
const gridClass =
  "w-full columns-2 gap-x-4 pb-8 max-[480px]:gap-x-3 min-[481px]:columns-3 min-[769px]:columns-4 min-[1025px]:columns-5 min-[1441px]:columns-6"

export function MasonryGrid({
  children,
  isLoading = false,
  skeletonCount = 12,
  renderSkeleton,
}: MasonryGridProps) {
  if (isLoading && renderSkeleton) {
    return (
      <div aria-busy="true" className={gridClass}>
        <span className="sr-only">Loading photos…</span>
        {Array.from({ length: skeletonCount }).map((_, index) => (
          <Fragment key={`skel-${index}`}>{renderSkeleton()}</Fragment>
        ))}
      </div>
    )
  }

  return <div className={gridClass}>{children}</div>
}
