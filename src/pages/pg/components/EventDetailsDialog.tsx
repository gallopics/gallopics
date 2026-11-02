import type { PgEvent } from "@/context/PhotographerContext"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogBody,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

/** "Event details" (ⓘ next to the event title in the studio): read only */
export function EventDetailsDialog({
  event,
  open,
  onOpenChange,
}: {
  event: PgEvent
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const eventPhotographer = event.assignedPhotographers?.[0]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-120">
        <DialogHeader>
          <DialogTitle>Event details</DialogTitle>
        </DialogHeader>
        <DialogBody className="flex flex-col gap-5">
          <div className="flex items-center gap-4">
            <div className="size-20 shrink-0 overflow-hidden rounded-xl border">
              <img
                src={event.logo}
                alt=""
                className="size-full object-contain p-2"
              />
            </div>
            <div>
              <div className="mb-2 text-xl leading-[1.2] font-bold text-foreground">
                {event.title}
              </div>
              <div className="text-sm text-muted-foreground">
                {event.dateRange}
              </div>
            </div>
          </div>

          {event.organiser && (
            <InfoField label="Organiser">
              <span className="font-medium">{event.organiser}</span>
            </InfoField>
          )}

          <div className="grid grid-cols-2 gap-5">
            {event.city && <InfoField label="City">{event.city}</InfoField>}
            {event.venueName && (
              <InfoField label="Venue">{event.venueName}</InfoField>
            )}
            {event.county && (
              <InfoField label="County">{event.county}</InfoField>
            )}
            {event.country && (
              <InfoField label="Country">{event.country}</InfoField>
            )}
          </div>

          <InfoField label="Disciplines">
            <div className="flex flex-wrap gap-2">
              {(event.disciplines || []).map((d) => (
                <span
                  key={d}
                  className="rounded-full bg-muted px-3 py-1.5 text-sm font-medium text-foreground/80"
                >
                  {d}
                </span>
              ))}
            </div>
          </InfoField>

          {eventPhotographer && (
            <InfoField label="Photographer">
              <div className="inline-flex items-center gap-2 rounded-full bg-muted py-1 pr-3 pl-1 text-sm font-medium">
                <span className="flex size-6 items-center justify-center rounded-full bg-border text-[0.6875rem] font-semibold text-muted-foreground">
                  {eventPhotographer.name.charAt(0)}
                </span>
                {eventPhotographer.name}
              </div>
            </InfoField>
          )}
        </DialogBody>
        <DialogFooter>
          <DialogClose render={<Button />}>Close</DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function InfoField({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div>
      <div className="mb-1.5 text-xs font-semibold tracking-[0.02em] text-muted-foreground/70 uppercase">
        {label}
      </div>
      <div className="text-base text-foreground">{children}</div>
    </div>
  )
}
