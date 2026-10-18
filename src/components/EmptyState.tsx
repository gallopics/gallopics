import { cn } from "@/lib/utils"

interface EmptyStateProps {
  title: React.ReactNode
  description?: React.ReactNode
  /** Small light icon above the title */
  icon?: React.ReactNode
  className?: string
  /** Optional actions below the text */
  children?: React.ReactNode
}

/** Centered "nothing here" message (old `.pg-empty-state`). */
export function EmptyState({
  title,
  description,
  icon,
  className,
  children,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "col-span-full flex w-full flex-col items-center justify-center px-10 py-16 text-center text-muted-foreground",
        className
      )}
    >
      {icon && (
        <div className="mb-3.5 flex size-11 items-center justify-center text-border [&_svg:not([class*='size-'])]:size-6">
          {icon}
        </div>
      )}
      <h3 className="mb-1.5 text-base font-medium">{title}</h3>
      {description && (
        <p className="max-w-70 text-sm leading-normal opacity-70">
          {description}
        </p>
      )}
      {children}
    </div>
  )
}
