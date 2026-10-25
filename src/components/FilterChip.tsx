import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Toggle } from "@/components/ui/toggle"

interface FilterChipProps {
  label: string | React.ReactNode
  isActive?: boolean
  onClick: () => void
  badge?: number
  className?: string
  /** `filterCount`: PG uploads filter chip with a count badge, brand when active */
  variant?: "default" | "filterCount"
  /** Count shown in the badge (filterCount variant) */
  count?: number
  /** Disabled chip (filterCount variant also disables itself when count is 0) */
  disabled?: boolean
  accent?: "red"
}

export function FilterChip({
  label,
  isActive = false,
  onClick,
  badge,
  className,
  variant = "default",
  count,
  disabled = false,
  accent,
}: FilterChipProps) {
  if (variant === "filterCount") {
    const isDisabled = disabled || count === 0
    const isRed = accent === "red" && !isActive

    return (
      <Toggle
        variant="outline"
        pressed={isActive}
        onPressedChange={() => onClick()}
        disabled={isDisabled}
        className={cn(
          "gap-1.5 pr-2.5 pl-3.5 text-[0.8125rem]",
          "aria-pressed:border-primary aria-pressed:bg-primary aria-pressed:text-primary-foreground aria-pressed:hover:bg-primary/90",
          isRed &&
            "border-destructive/10 bg-destructive/10 text-destructive hover:bg-destructive/15",
          className
        )}
      >
        {label}
        <Badge
          variant="secondary"
          className={cn(
            "h-5 min-w-5 border-border px-1.5 text-[0.6875rem]",
            isActive && "border-white/30 bg-white/20 text-primary-foreground",
            isRed && "border-destructive bg-destructive text-white"
          )}
        >
          {count ?? 0}
        </Badge>
      </Toggle>
    )
  }

  return (
    <Toggle
      variant="outline"
      pressed={isActive}
      onPressedChange={() => onClick()}
      className={cn("gap-2 px-4", className)}
    >
      {label}
      {badge !== undefined && badge > 0 && (
        <Badge className="h-4.5 bg-destructive px-1.5 text-white">
          {badge}
        </Badge>
      )}
    </Toggle>
  )
}
