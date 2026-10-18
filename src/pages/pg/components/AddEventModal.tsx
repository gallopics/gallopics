import { useState } from "react"

import type { PgEvent } from "@/context/PhotographerContext"
import { PHOTOGRAPHERS } from "@/data/mockData"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogBody,
  DialogCancel,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { ModernDropdown } from "@/components/ModernDropdown"
import { MultiSelect } from "@/components/MultiSelect"

interface AddEventModalProps {
  isOpen: boolean
  onClose: () => void
  /** When set, the form is prefilled for editing */
  eventToEdit?: PgEvent | null
}

// Mock options, as in the old app
const countryOptions = [
  { label: "Sweden", value: "Sweden", icon: "🇸🇪" },
  { label: "Norway", value: "Norway", icon: "🇳🇴" },
  { label: "Denmark", value: "Denmark", icon: "🇩🇰" },
  { label: "Finland", value: "Finland", icon: "🇫🇮" },
]

const countyOptions = [
  { label: "Stockholm", value: "Stockholm" },
  { label: "Västra Götaland", value: "Vastra Gotaland" },
  { label: "Skåne", value: "Skane" },
  { label: "Uppsala", value: "Uppsala" },
]

const swedishCities = [
  { label: "Stockholm", value: "Stockholm" },
  { label: "Göteborg", value: "Goteborg" },
  { label: "Malmö", value: "Malmo" },
  { label: "Uppsala", value: "Uppsala" },
  { label: "Jönköping", value: "Jonkoping" },
]

const otherCities = [
  { label: "Oslo", value: "Oslo" },
  { label: "Copenhagen", value: "Copenhagen" },
  { label: "Helsinki", value: "Helsinki" },
]

const categoryOptions = [
  { label: "Show jumping", value: "Show jumping" },
  { label: "Dressage", value: "Dressage" },
  { label: "Eventing", value: "Eventing" },
  { label: "Western", value: "Western" },
]

const photographerOptions = PHOTOGRAPHERS.map((p) => ({
  label: `${p.firstName} ${p.lastName}`,
  value: p.id,
  subtext: p.city,
  icon: "",
}))

export function AddEventModal({
  isOpen,
  onClose,
  eventToEdit,
}: AddEventModalProps) {
  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
    >
      <DialogContent className="sm:max-w-150">
        {/* Mounted only while open, so the form is prefilled/reset each time */}
        <EventForm eventToEdit={eventToEdit} onClose={onClose} />
      </DialogContent>
    </Dialog>
  )
}

function EventForm({
  eventToEdit,
  onClose,
}: {
  eventToEdit?: PgEvent | null
  onClose: () => void
}) {
  const isEditMode = !!eventToEdit

  // Edit mode uses mock dates/organiser, as in the old app
  const [eventName, setEventName] = useState(eventToEdit?.title || "")
  const [startDate, setStartDate] = useState(
    eventToEdit?.dateRange ? "2024-05-15" : ""
  )
  const [endDate, setEndDate] = useState(
    eventToEdit?.dateRange ? "2024-05-17" : ""
  )
  const [country, setCountry] = useState("Sweden")
  const [county, setCounty] = useState("")
  const [city, setCity] = useState(eventToEdit?.city || "")
  const [arena, setArena] = useState(eventToEdit?.venueName || "")
  const [category, setCategory] = useState(eventToEdit?.disciplines?.[0] || "")
  const [organiser, setOrganiser] = useState(
    eventToEdit ? "Mock Organiser Ltd" : ""
  )
  const [selectedPhotographers, setSelectedPhotographers] = useState<string[]>(
    eventToEdit?.assignedPhotographers?.map((p) => p.id) || []
  )
  const [applicationsWelcomed, setApplicationsWelcomed] = useState(
    eventToEdit ? eventToEdit.applicationsWelcomed !== false : true
  )

  const cityOptions = country === "Sweden" ? swedishCities : otherCities

  const handleDone = () => {
    console.log("New Event Data:", {
      eventName,
      startDate,
      endDate,
      country,
      city,
      arena,
      category,
      organiser,
      selectedPhotographers,
      applicationsWelcomed,
    })
    onClose()
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>{isEditMode ? "Edit event" : "Add an event"}</DialogTitle>
      </DialogHeader>

      <DialogBody>
        <div className="grid grid-cols-2 gap-5 max-[600px]:grid-cols-1">
          <Field className="col-span-full">
            <FieldLabel htmlFor="event-name">Event name</FieldLabel>
            <Input
              id="event-name"
              value={eventName}
              onChange={(e) => setEventName(e.target.value)}
              placeholder="Enter event name"
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="event-start">Start date</FieldLabel>
            <Input
              id="event-start"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="event-end">End date</FieldLabel>
            <Input
              id="event-end"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </Field>

          <div className="col-span-full grid grid-cols-3 gap-3 max-[600px]:grid-cols-1">
            <Field className="min-w-0">
              <FieldLabel>Country</FieldLabel>
              <ModernDropdown
                value={country}
                options={countryOptions}
                onChange={(val) => {
                  setCountry(val)
                  setCity("")
                }}
                placeholder="Select country"
              />
            </Field>
            <Field className="min-w-0">
              <FieldLabel>County</FieldLabel>
              <ModernDropdown
                value={county}
                options={countyOptions}
                onChange={setCounty}
                placeholder="Select county"
              />
            </Field>
            <Field className="min-w-0">
              <FieldLabel>City</FieldLabel>
              <ModernDropdown
                value={city}
                options={cityOptions}
                onChange={setCity}
                placeholder="Select city"
              />
            </Field>
          </div>

          <Field className="min-w-0">
            <FieldLabel htmlFor="event-arena">Arena</FieldLabel>
            <Input
              id="event-arena"
              value={arena}
              onChange={(e) => setArena(e.target.value)}
              placeholder="Enter arena name"
            />
          </Field>
          <Field className="min-w-0">
            <FieldLabel>Category</FieldLabel>
            <ModernDropdown
              value={category}
              options={categoryOptions}
              onChange={setCategory}
              placeholder="Select category"
            />
          </Field>

          <Field className="col-span-full">
            <FieldLabel htmlFor="event-organiser">Organiser</FieldLabel>
            <Input
              id="event-organiser"
              value={organiser}
              onChange={(e) => setOrganiser(e.target.value)}
              placeholder="Enter organiser name"
            />
          </Field>

          <Separator className="col-span-full mt-2 bg-muted" />

          <Field className="col-span-full">
            <FieldLabel>Photographers</FieldLabel>
            <MultiSelect
              values={selectedPhotographers}
              options={photographerOptions}
              onChange={setSelectedPhotographers}
              placeholder="Assign photographers"
            />
          </Field>

          <Separator className="col-span-full mt-2 bg-muted" />

          <div className="col-span-full">
            <Field orientation="horizontal">
              <Switch
                id="applications-welcomed"
                checked={applicationsWelcomed}
                onCheckedChange={setApplicationsWelcomed}
              />
              <FieldLabel htmlFor="applications-welcomed">
                Applications welcomed
              </FieldLabel>
            </Field>
            <FieldDescription className="mt-2 ml-14 text-[0.8125rem] leading-[1.4]">
              If enabled, photographers can apply for this event.
            </FieldDescription>
          </div>
        </div>
      </DialogBody>

      <DialogFooter>
        <DialogCancel />
        <Button onClick={handleDone}>{isEditMode ? "Save" : "Done"}</Button>
      </DialogFooter>
    </>
  )
}
