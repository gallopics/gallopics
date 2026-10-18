import { useNavigate } from "react-router"
import { Image as ImageIcon } from "lucide-react"

import type { PgEvent } from "@/context/PhotographerContext"
import { useWorkspace } from "@/context/WorkspaceContext"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { GlassButton } from "@/components/PhotoCard"

interface PgEventCardProps {
  event: PgEvent
  onCoverChange: (eventId: string) => void
  onEdit?: (event: PgEvent) => void
  onCancelBooking?: (event: PgEvent, e: React.MouseEvent) => void
  fromTab?: string
  eventProfilePath?: string
  eventProfileState?: unknown
  hideLogo?: boolean
}

/** Folder-style event card in the photographer's "My events" grid. */
export function PgEventCard({
  event,
  onCoverChange,
  onCancelBooking,
  fromTab,
  eventProfilePath,
  eventProfileState,
  hideLogo = false,
}: PgEventCardProps) {
  const { basePath } = useWorkspace()
  const navigate = useNavigate()
  const hasCover = !!event.coverImage
  const eventTargetPath = eventProfilePath ?? `${basePath}/events/${event.id}`
  const eventTargetState = eventProfileState ?? { fromTab: fromTab ?? "my" }

  const open = () => navigate(eventTargetPath, { state: eventTargetState })

  return (
    <div
      role="link"
      tabIndex={0}
      onClick={open}
      onKeyDown={(e) => {
        if (e.key === "Enter" && e.target === e.currentTarget) open()
      }}
      className="group relative mt-4 flex cursor-pointer flex-col rounded-[0_24px_24px_24px] transition-[translate,box-shadow] duration-300 ease-[cubic-bezier(0.2,0,0.2,1)] outline-none hover:-translate-y-1 focus-visible:ring-4 focus-visible:ring-ring/12"
    >
      {/* Folder tab */}
      <div className="absolute -top-3 left-0 z-0 h-3.25 w-27.5 rounded-[96px_144px_0_0] border border-b-0 border-black/8 bg-primary/8 transition-all duration-300" />

      <div className="flex flex-col overflow-hidden rounded-[0_24px_24px_24px] border border-black/4 bg-card p-4 shadow-[0_4px_16px_rgba(0,0,0,0.06)] transition-all duration-300 group-hover:shadow-[0_12px_32px_rgba(0,0,0,0.10)]">
        <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-muted">
          {/* develop: no placeholder photo when the event has no cover */}
          {hasCover && (
            <img
              src={event.coverImage}
              alt={event.title}
              className="size-full object-cover transition-[scale] duration-500 ease-[cubic-bezier(0.2,0,0.2,1)] will-change-transform group-hover:scale-[1.04]"
            />
          )}

          {!hasCover && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <span className="text-[0.8125rem] font-medium text-muted-foreground">
                Add cover photo
              </span>
            </div>
          )}

          <div className="pointer-events-none absolute top-3 right-3 z-30 -translate-y-1 opacity-0 transition-[translate,opacity] duration-250 group-hover:translate-y-0 group-hover:opacity-100">
            <GlassButton
              title={hasCover ? "Change cover image" : "No cover to edit"}
              aria-label="Change cover image"
              disabled={!hasCover}
              onClick={(e) => {
                e.stopPropagation()
                if (hasCover) onCoverChange(event.id)
              }}
              className="pointer-events-auto text-foreground disabled:opacity-30 [&_svg:not([class*='size-'])]:size-4"
            >
              <ImageIcon />
            </GlassButton>
          </div>
        </div>

        <div className="flex flex-col pt-4">
          <div className="mb-4 flex items-center gap-4">
            {!hideLogo && (
              <div className="size-13 shrink-0 overflow-hidden rounded-xl border border-black/6 bg-card">
                <img
                  src={event.logo}
                  alt=""
                  className="size-full object-contain p-0.5"
                />
              </div>
            )}
            <div className="flex flex-1 flex-col justify-center">
              <div className="mb-0.5 flex items-center gap-1">
                <span className="text-xs leading-none">🇸🇪</span>
                <span className="text-xs leading-normal font-semibold tracking-[0.02em] text-muted-foreground uppercase">
                  {event.city}
                </span>
              </div>
              <h3 className="my-1 text-[0.8125rem] leading-normal font-bold text-foreground">
                {event.title}
              </h3>
              <span className="mt-0.5 text-xs leading-normal text-muted-foreground">
                {event.dateRange}
              </span>
            </div>
          </div>

          <Separator className="mb-4 bg-muted" />

          {/* Footer: stats are hidden in the old app too */}
          <div className="flex items-center justify-between gap-3">
            {onCancelBooking && (
              <Button
                size="xs"
                onClick={(e) => onCancelBooking(event, e)}
                className="h-auto rounded-lg border border-destructive/25 bg-destructive/8 px-3.5 py-1.5 text-xs text-destructive hover:bg-card"
              >
                Cancel booking
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
