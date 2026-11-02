import { Children, Fragment } from "react"

import { cn } from "@/lib/utils"

interface DotListProps {
  children: React.ReactNode
  /** On mobile, stack the items and hide the dots */
  stackOnMobile?: boolean
  className?: string
}

/** Inline items separated by "•" (old `.meta-item` rows). */
export function DotList({ children, stackOnMobile, className }: DotListProps) {
  const items = Children.toArray(children).filter(Boolean)

  return (
    <div
      className={cn(
        "flex flex-wrap items-baseline",
        stackOnMobile && "max-md:flex-col max-md:gap-1.5",
        className,
        // last, so a text-* size in className does not override it (old .meta-item)
        "leading-[1.15]"
      )}
    >
      {items.map((item, i) => (
        <Fragment key={i}>
          {i > 0 && (
            <span
              aria-hidden="true"
              className={cn(
                "mx-2 text-[0.8em] opacity-35",
                stackOnMobile && "max-md:hidden"
              )}
            >
              •
            </span>
          )}
          <span className="inline-flex items-baseline gap-1.5 whitespace-nowrap">
            {item}
          </span>
        </Fragment>
      ))}
    </div>
  )
}
