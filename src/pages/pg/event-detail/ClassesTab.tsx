import { CalendarDays, Clock, Info, MapPin, UploadCloud } from "lucide-react"

import { formatDate } from "@/lib/dates"
import { plural } from "@/lib/plural"
import {
  mapApiScheduleToDailySchedule,
  type ApiEventSchedule,
} from "@/data/eventsApi"
import type { ClassSection } from "@/types"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"

import type { ClassContext } from "./photoFilters"

export type ScheduleClass = ClassSection & { arenaName: string }

export interface ClassDay {
  date: string
  classes: ScheduleClass[]
}

/** The schedule as one list of classes per day, by start time ("TBD" last) */
export const toClassDays = (schedule: ApiEventSchedule): ClassDay[] =>
  mapApiScheduleToDailySchedule(schedule)
    .map((day) => ({
      date: day.date,
      classes: day.arenas
        .flatMap((arena) =>
          arena.competitions.map((competition) => ({
            ...competition,
            arenaName: arena.name,
          }))
        )
        .sort((a, b) => a.startTime.localeCompare(b.startTime)),
    }))
    .filter((day) => day.classes.length > 0)

/** A schedule class in the shape the upload page reads from the URL */
export const toClassContext = (eventClass: ScheduleClass): ClassContext => ({
  id: eventClass.classSectionId,
  equipeClassSectionId: eventClass.equipeClassSectionId ?? "",
  name: eventClass.name,
  arenaName: eventClass.arenaName,
})

/** The event's classes by day, each with an Upload button for that class */
export function ClassesTab({
  days,
  isLoading,
  showHint,
  onUpload,
}: {
  days: ClassDay[]
  isLoading: boolean
  /** The main Upload button was pressed without a class */
  showHint: boolean
  onUpload: (eventClass: ScheduleClass) => void
}) {
  const classCount = days.reduce((sum, day) => sum + day.classes.length, 0)

  return (
    <div className="container pt-6 pb-16">
      {showHint ? (
        <p
          role="status"
          className="mb-4 flex items-start gap-2 rounded-lg border border-primary/20 bg-primary/8 px-3.5 py-3 text-sm font-medium text-foreground"
        >
          <Info className="mt-0.5 size-4 shrink-0 text-primary" />
          <span>
            Choose the class you're uploading to: press{" "}
            <strong className="font-semibold">Upload</strong> next to it.
          </span>
        </p>
      ) : (
        !isLoading && (
          <p className="mb-4 text-sm text-muted-foreground">
            {plural(classCount, "class", "classes")} in the schedule. Upload to
            a class so its riders and horses are tagged.
          </p>
        )
      )}

      {isLoading ? (
        <ClassesSkeleton />
      ) : (
        <div className="grid">
          {days.map((day) => (
            <section
              key={day.date}
              aria-label={formatDate(day.date, { weekday: "long" })}
              className="grid grid-cols-[160px_minmax(0,1fr)] items-start gap-4 border-t py-4 last:border-b max-[900px]:grid-cols-1 max-[900px]:gap-2.5"
            >
              <h3 className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-foreground max-[900px]:min-h-0">
                <CalendarDays className="size-4 shrink-0 text-muted-foreground" />
                {formatDate(day.date, { weekday: "short", year: undefined })}
              </h3>

              <ul className="grid grid-cols-2 gap-2 max-[1100px]:grid-cols-1">
                {day.classes.map((eventClass) => (
                  <li
                    key={eventClass.classSectionId}
                    className="flex min-w-0 items-center gap-3 rounded-lg border bg-card py-2 pr-2 pl-3"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="text-sm leading-[1.35] font-medium wrap-break-word text-foreground">
                        {eventClass.name}
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                        <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
                          <Clock className="size-3.5 shrink-0" />
                          {eventClass.startTime}
                        </span>
                        <span className="inline-flex min-w-0 items-center gap-1.5">
                          <MapPin className="size-3.5 shrink-0" />
                          <span className="min-w-0 wrap-break-word">
                            {eventClass.arenaName}
                          </span>
                        </span>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      className="h-11 shrink-0 px-4"
                      onClick={() => onUpload(eventClass)}
                      aria-label={`Upload to ${eventClass.name}`}
                    >
                      <UploadCloud />
                      Upload
                    </Button>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  )
}

/** First load of the schedule: one day with a few class rows */
function ClassesSkeleton() {
  return (
    <div aria-busy="true" className="grid border-t py-4">
      <span className="sr-only">Loading classes…</span>
      <div
        aria-hidden="true"
        className="grid grid-cols-[160px_minmax(0,1fr)] gap-4 max-[900px]:grid-cols-1 max-[900px]:gap-2.5"
      >
        <Skeleton className="h-5 w-24 self-center bg-border" />
        <div className="grid grid-cols-2 gap-2 max-[1100px]:grid-cols-1">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-15 rounded-lg bg-border" />
          ))}
        </div>
      </div>
    </div>
  )
}
