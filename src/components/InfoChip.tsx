import { cn } from "@/lib/utils"
import { ProfileAvatar } from "@/components/ProfileAvatar"

interface InfoChipProps {
  label: string
  name: string
  avatarUrl?: string
  variant?: "rider" | "horse" | "photographer"
  onClick?: () => void
  className?: string
  icon?: React.ReactNode
}

export function InfoChip({
  label,
  name,
  avatarUrl,
  variant,
  onClick,
  className,
}: InfoChipProps) {
  const Comp = onClick ? "button" : "div"

  return (
    <Comp
      type={onClick ? "button" : undefined}
      onClick={onClick}
      className={cn(
        "group/info-chip flex items-center gap-3 rounded-full border bg-muted py-1.5 pr-4 pl-2 text-left transition-all duration-200",
        onClick &&
          "hover:-translate-y-px hover:border-primary/30 hover:bg-primary/8 hover:shadow-sm",
        className
      )}
    >
      <ProfileAvatar variant={variant} url={avatarUrl} name={name} size={34} />
      <div className="flex flex-col">
        <span className="text-[9px] leading-[1.2] font-medium tracking-[0.5px] text-muted-foreground uppercase">
          {label}
        </span>
        <span className="text-sm leading-[1.2] font-semibold text-foreground group-hover/info-chip:underline">
          {name}
        </span>
      </div>
    </Comp>
  )
}
