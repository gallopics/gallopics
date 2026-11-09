import { Link } from "react-router"

import { cn } from "@/lib/utils"
import { ProfileAvatar } from "@/components/ProfileAvatar"

interface InfoChipProps {
  label: string
  name: string
  avatarUrl?: string
  variant?: "rider" | "horse" | "photographer"
  /** Renders the chip as a real link (crawlable, opens in a new tab) */
  href?: string
  onClick?: () => void
  className?: string
  icon?: React.ReactNode
}

export function InfoChip({
  label,
  name,
  avatarUrl,
  variant,
  href,
  onClick,
  className,
}: InfoChipProps) {
  const isInteractive = Boolean(href || onClick)
  const chipClassName = cn(
    "group/info-chip flex items-center gap-3 rounded-full border bg-muted py-1.5 pr-4 pl-2 text-left transition-all duration-200",
    isInteractive &&
      "hover:-translate-y-px hover:border-primary/30 hover:bg-primary/8 hover:shadow-[0_4px_8px_rgba(0,0,0,0.04)]",
    className
  )

  const content = (
    <>
      <ProfileAvatar variant={variant} url={avatarUrl} name={name} size={34} />
      <div className="flex flex-col">
        <span className="text-[9px] leading-[1.2] font-medium tracking-[0.5px] text-muted-foreground uppercase">
          {label}
        </span>
        <span
          className={cn(
            "text-sm leading-[1.2] font-semibold text-foreground",
            isInteractive && "group-hover/info-chip:underline"
          )}
        >
          {name}
        </span>
      </div>
    </>
  )

  if (href) {
    return (
      <Link to={href} className={chipClassName}>
        {content}
      </Link>
    )
  }

  const Comp = onClick ? "button" : "div"

  return (
    <Comp
      type={onClick ? "button" : undefined}
      onClick={onClick}
      className={chipClassName}
    >
      {content}
    </Comp>
  )
}
