import { cn } from "@/lib/utils"
import { ProfileAvatar } from "@/components/ProfileAvatar"

type TitleHeaderVariant = "default" | "workspace" | "upload" | "info"

interface TitleHeaderProps {
  title: React.ReactNode
  topSubtitle?: React.ReactNode
  subtitle?: React.ReactNode
  stats?: React.ReactNode
  rightContent?: React.ReactNode
  avatar?: string | React.ReactNode
  avatarVariant?: "rider" | "horse" | "photographer" | "default"
  description?: React.ReactNode
  /** Smaller header (old `.pg-compact-header`, EventDetail) */
  compact?: boolean
  // TODO: "ehome" hero variant is added with the EventsPage migration
  variant?: TitleHeaderVariant
  optionalClose?: React.ReactNode
  avatarShape?: "circle" | "square"
  avatarMobileRow?: boolean
  className?: string
}

const sectionClasses: Record<TitleHeaderVariant, string> = {
  default: "pt-6 pb-8",
  workspace: "py-6",
  upload: "py-4",
  // Old `.info-page .title-header` overrides
  info: "pt-8 pb-9",
}

const titleClasses: Record<TitleHeaderVariant, string> = {
  default: "text-4xl leading-[1.05] max-md:text-[1.75rem]",
  workspace: "text-2xl leading-[1.05]",
  upload: "text-xl leading-[1.05] font-bold",
  info: "text-[1.75rem] leading-[1.1] max-md:text-[1.375rem]",
}

const subtitleClasses: Record<TitleHeaderVariant, string> = {
  default: "mt-4 text-base",
  workspace: "mt-4 text-sm",
  upload: "mt-4 text-base",
  info: "mt-1 text-base",
}

export function TitleHeader({
  title,
  topSubtitle,
  subtitle,
  stats,
  rightContent,
  avatar,
  avatarVariant,
  description,
  compact = false,
  variant = "default",
  optionalClose,
  avatarShape = "circle",
  avatarMobileRow = false,
  className,
}: TitleHeaderProps) {
  const isSquare = avatarShape === "square"
  const alignClass =
    variant === "upload" || variant === "workspace"
      ? "items-center"
      : "items-end"

  return (
    <section
      className={cn(
        "border-b bg-card",
        sectionClasses[variant],
        compact && "py-4",
        className
      )}
    >
      <div className="container">
        <div
          className={cn(
            "flex justify-between gap-8 max-md:flex-col max-md:items-start max-md:gap-6",
            alignClass
          )}
        >
          <div className="flex flex-col gap-3">
            <div
              className={cn(
                "flex items-center gap-6",
                avatarMobileRow
                  ? "max-md:flex-row max-md:items-start max-md:gap-5"
                  : "max-md:flex-col max-md:items-start max-md:gap-4"
              )}
            >
              {(avatar || avatarVariant) && (
                <div
                  className={cn(
                    "flex shrink-0 items-center justify-center",
                    isSquare &&
                      "size-25 overflow-hidden rounded-2xl border bg-card p-2",
                    isSquare &&
                      compact &&
                      "size-13.5 rounded-lg p-[3px] max-md:size-13.5 max-md:p-[3px]",
                    isSquare &&
                      !compact &&
                      (avatarMobileRow
                        ? "max-md:size-14 max-md:p-1"
                        : "max-md:size-20 max-md:p-1.5")
                  )}
                >
                  {typeof avatar === "string" || avatarVariant ? (
                    <ProfileAvatar
                      variant={avatarVariant}
                      url={typeof avatar === "string" ? avatar : undefined}
                      name={typeof title === "string" ? title : ""}
                      size={isSquare ? 100 : 80}
                      className={cn(
                        // Square logos: fill the frame with rounded corners
                        isSquare &&
                          "size-full! rounded-xl! bg-card *:rounded-xl! after:rounded-xl",
                        isSquare &&
                          compact &&
                          "rounded-md! *:rounded-md! after:rounded-md"
                      )}
                    />
                  ) : isSquare ? (
                    // e.g. a loading placeholder: fills the square frame
                    avatar
                  ) : (
                    <div className="flex size-20 items-center justify-center overflow-hidden rounded-full bg-muted">
                      {avatar}
                    </div>
                  )}
                </div>
              )}
              <div className="flex flex-col max-md:w-full">
                {topSubtitle && (
                  <div
                    className={cn(
                      "font-medium text-muted-foreground",
                      compact ? "mb-0.5 text-[0.6875rem]" : "text-xs",
                      "leading-normal"
                    )}
                  >
                    {topSubtitle}
                  </div>
                )}
                <h1
                  className={cn(
                    "font-heading font-semibold tracking-[-0.01em] text-foreground",
                    titleClasses[variant],
                    compact && "text-xl leading-[1.3]"
                  )}
                >
                  {title}
                </h1>
                {subtitle && (
                  <div
                    className={cn(
                      "text-muted-foreground",
                      subtitleClasses[variant],
                      compact && "mt-0.5 text-sm",
                      // last, so text-* sizes above do not override it
                      "leading-none"
                    )}
                  >
                    {subtitle}
                  </div>
                )}
                {stats && (
                  <div className="mt-4 flex flex-wrap items-baseline gap-x-3 gap-y-1 text-sm leading-[1.15] text-muted-foreground">
                    {stats}
                  </div>
                )}
                {description && (
                  <div className="mt-4 max-w-150 text-base leading-[1.4] text-muted-foreground">
                    {description}
                  </div>
                )}
              </div>
            </div>
          </div>
          {rightContent && (
            <div className="flex items-center">{rightContent}</div>
          )}
          {optionalClose && (
            <div className="ml-4 flex items-center">{optionalClose}</div>
          )}
        </div>
      </div>
    </section>
  )
}
