import { useNavigate } from "react-router"

import { cn } from "@/lib/utils"
import type { EventData } from "@/data/mockEvents"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"

interface FolderEventCardProps {
  event: EventData
  onClick: (id: string) => void
  /** Force the disabled look regardless of event status */
  forceDisabled?: boolean
}

/** True when today falls inside the event's dates. */
function isEventLive(event: EventData) {
  try {
    if (event.startDate) {
      const start = new Date(`${event.startDate}T00:00:00`)
      const end = new Date(`${event.endDate || event.startDate}T00:00:00`)
      const today = new Date()

      today.setHours(0, 0, 0, 0)
      start.setHours(0, 0, 0, 0)
      end.setHours(23, 59, 59, 999)

      return today >= start && today <= end
    }

    const today = new Date()
    const currentYear = today.getFullYear()
    const parts = event.period.split("–").map((s) => s.trim())

    let start, end
    if (parts.length === 2) {
      let startStr = parts[0]
      let endStr = parts[1]
      if (!startStr.match(/\d{4}/)) startStr += ` ${currentYear}`
      if (!endStr.match(/\d{4}/)) endStr += ` ${currentYear}`

      start = new Date(startStr)
      end = new Date(endStr)
    } else {
      let dateStr = parts[0]
      if (!dateStr.match(/\d{4}/)) dateStr += ` ${currentYear}`
      start = new Date(dateStr)
      end = new Date(dateStr)
    }

    const TODAY = new Date(today)
    TODAY.setHours(0, 0, 0, 0)
    start.setHours(0, 0, 0, 0)
    end.setHours(23, 59, 59, 999)

    return (
      TODAY.getTime() >= start.getTime() && TODAY.getTime() <= end.getTime()
    )
  } catch {
    return false
  }
}

const initials = (name: string) =>
  name
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()

export function FolderEventCard({
  event,
  onClick,
  forceDisabled,
}: FolderEventCardProps) {
  const navigate = useNavigate()
  const isDisabled = forceDisabled || event.status === "disabled"
  const isLive = isEventLive(event)

  const open = () => {
    if (!isDisabled) onClick(event.id)
  }

  return (
    <div
      role="link"
      tabIndex={isDisabled ? -1 : 0}
      aria-disabled={isDisabled}
      title={isDisabled ? "Not available" : ""}
      onClick={open}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault()
          open()
        }
      }}
      className={cn(
        "group relative mt-4 flex cursor-pointer flex-col overflow-visible rounded-[0_24px_24px_24px] transition-[translate] duration-300 outline-none hover:-translate-y-1 focus-visible:ring-4 focus-visible:ring-ring/12 max-md:hover:translate-y-0",
        // Folder tab above the card
        "before:absolute before:-top-3 before:left-0 before:z-0 before:h-[12.5px] before:w-30 before:rounded-[96px_144px_0_0] before:border before:border-b-0 before:border-primary/15 before:bg-primary/12 before:transition-[background-color,border-color] before:duration-600 before:ease-out before:content-[''] hover:before:border-primary/50 hover:before:bg-primary/50",
        isDisabled && "cursor-not-allowed opacity-60 grayscale"
      )}
    >
      <div className="flex [transform:translate3d(0,0,0)] flex-col overflow-hidden rounded-[0_24px_24px_24px] border border-black/4 bg-card p-3 shadow-[0_4px_16px_rgba(0,0,0,0.06)] transition-[border-color,box-shadow] duration-600 ease-out group-hover:border-primary/20 group-hover:shadow-[0_12px_32px_rgba(0,0,0,0.10)]">
        {!isDisabled && event.coverImage && (
          <div className="relative aspect-video w-full overflow-hidden rounded-xl">
            <img
              src={event.coverImage}
              alt={event.name}
              loading="lazy"
              className="size-full object-cover transition-[scale] duration-600 group-hover:scale-105"
            />
            {isLive && (
              <Badge className="absolute top-2.5 right-2.5 z-10 h-auto rounded-sm bg-[#FF0000] px-2 py-1 text-[10px] font-bold text-white uppercase">
                Live
              </Badge>
            )}
          </div>
        )}

        <div className={cn("flex flex-col gap-1", !isDisabled && "pt-4")}>
          <div className="mb-1 flex items-center gap-3">
            <Avatar className="size-10.5 rounded-xl border bg-muted after:rounded-xl after:border-0">
              {event.logo && (
                <AvatarImage
                  src={event.logo}
                  alt=""
                  className="rounded-xl object-contain p-0.5"
                />
              )}
              <AvatarFallback className="rounded-xl text-[0.8125rem] font-semibold">
                {event.name.trim().charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>

            <div className="flex flex-col gap-0.5">
              <h3 className="text-[0.8125rem] leading-[1.25] font-semibold text-foreground">
                {event.name}
              </h3>
              <span className="block text-xs leading-normal text-muted-foreground">
                {event.period}
              </span>
              {isDisabled && (
                <span className="block text-[10px] text-muted-foreground uppercase">
                  Not available yet
                </span>
              )}
            </div>
          </div>

          <div className="mt-2 flex items-center justify-between border-t pt-3">
            <div className="flex items-center gap-2 text-xs leading-normal font-medium text-foreground">
              <span>{event.flag}</span>
              <span>{event.city}</span>
            </div>

            <div className="flex items-center gap-2">
              {!isDisabled && event.photoCount && (
                <span className="text-xs leading-normal text-muted-foreground">
                  {event.photoCount} photos
                </span>
              )}
              {event.photographer && (
                <Avatar
                  title={`Photo: ${event.photographer.name}`}
                  className="size-7 cursor-pointer border border-white shadow-[0_1px_3px_rgba(0,0,0,0.1)]"
                  onClick={(e) => {
                    if (!event.photographer) return
                    e.stopPropagation()
                    navigate(`/photographer/${event.photographer.id}`)
                  }}
                >
                  <AvatarImage
                    src={event.photographer.avatar}
                    alt={event.photographer.name}
                  />
                  <AvatarFallback className="text-[10px]">
                    {initials(event.photographer.name)}
                  </AvatarFallback>
                </Avatar>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
