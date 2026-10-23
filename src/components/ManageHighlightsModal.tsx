import { useMemo, useState } from "react"

import { cn } from "@/lib/utils"
import {
  useWorkspaceEvents,
  useWorkspacePhotos,
} from "@/hooks/useWorkspaceData"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogBody,
  DialogCancel,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { toast } from "@/components/ui/toast"
import { ModernDropdown } from "@/components/ModernDropdown"

const MAX_HIGHLIGHTS = 10

interface ManageHighlightsModalProps {
  isOpen: boolean
  onClose: () => void
  initialIds: string[]
  onSave: (ids: string[]) => void
}

export function ManageHighlightsModal({
  isOpen,
  onClose,
  initialIds,
  onSave,
}: ManageHighlightsModalProps) {
  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
    >
      <DialogContent className="sm:max-w-200">
        {/* Mounted only while open, so the selection resets on every open */}
        <ManageHighlightsForm
          initialIds={initialIds}
          onSave={onSave}
          onClose={onClose}
        />
      </DialogContent>
    </Dialog>
  )
}

function ManageHighlightsForm({
  initialIds,
  onSave,
  onClose,
}: Omit<ManageHighlightsModalProps, "isOpen">) {
  const events = useWorkspaceEvents()
  const allPhotos = useWorkspacePhotos()

  const myEvents = useMemo(() => events.filter((e) => e.isRegistered), [events])
  const [selectedIds, setSelectedIds] = useState(
    () => new Set(initialIds.slice(0, MAX_HIGHLIGHTS))
  )
  // The first event until one is picked (events may still be loading on open)
  const [pickedEventId, setActiveEventId] = useState("")
  const activeEventId = pickedEventId || myEvents[0]?.id || ""

  const currentPhotos = useMemo(
    () =>
      activeEventId ? allPhotos.filter((p) => p.eventId === activeEventId) : [],
    [activeEventId, allPhotos]
  )

  const eventOptions = myEvents.map((e) => ({
    label: `${e.title} (${e.date})`,
    value: e.id,
  }))

  const handleToggle = (photoId: string) => {
    const next = new Set(selectedIds)
    if (next.has(photoId)) {
      next.delete(photoId)
    } else {
      if (next.size >= MAX_HIGHLIGHTS) {
        toast.add({
          title: `Maximum ${MAX_HIGHLIGHTS} highlights allowed.`,
          type: "warning",
        })
        return
      }
      next.add(photoId)
    }
    setSelectedIds(next)
  }

  const handleSave = () => {
    onSave(Array.from(selectedIds))
    onClose()
  }

  const isFull = selectedIds.size >= MAX_HIGHLIGHTS

  return (
    <>
      <DialogHeader>
        <DialogTitle>Manage highlights</DialogTitle>
      </DialogHeader>

      <DialogBody>
        <div className="mb-5 flex items-center gap-3">
          <Label className="whitespace-nowrap">Select from event:</Label>
          <div className="min-w-65">
            <ModernDropdown
              value={activeEventId}
              options={eventOptions}
              onChange={setActiveEventId}
              placeholder="Select event..."
              showSearch
              searchPlaceholder="Search events..."
            />
          </div>
        </div>

        <div className="mb-4 flex items-center justify-between text-[0.8125rem] text-muted-foreground">
          <div>
            Selected:{" "}
            <span
              className={cn(
                "font-medium",
                isFull && "font-semibold text-destructive"
              )}
            >
              {selectedIds.size} / {MAX_HIGHLIGHTS}
            </span>
          </div>
          {selectedIds.size > 0 && (
            <Button
              variant="ghost"
              size="xs"
              onClick={() => setSelectedIds(new Set())}
              className="rounded-sm text-[0.8125rem] font-medium text-destructive hover:bg-destructive/8 hover:text-destructive"
            >
              Clear all
            </Button>
          )}
        </div>

        <div className="grid grid-cols-[repeat(auto-fill,minmax(140px,1fr))] gap-3">
          {currentPhotos.length === 0 ? (
            <div className="col-span-full py-10 text-center text-muted-foreground">
              No photos in this event.
            </div>
          ) : (
            currentPhotos.map((photo) => {
              const isSelected = selectedIds.has(photo.id)
              return (
                <button
                  key={photo.id}
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => handleToggle(photo.id)}
                  className={cn(
                    "group relative aspect-square cursor-pointer overflow-hidden rounded-xl bg-muted select-none",
                    isSelected && "ring-[2.5px] ring-primary"
                  )}
                >
                  <img
                    src={photo.url}
                    alt=""
                    loading="lazy"
                    className={cn(
                      "size-full object-cover transition-[scale,filter] duration-200",
                      isSelected ? "brightness-90" : "group-hover:scale-105"
                    )}
                  />
                  {isSelected && (
                    <div className="pointer-events-none absolute inset-0 bg-primary/8" />
                  )}
                  <Checkbox
                    checked={isSelected}
                    tabIndex={-1}
                    aria-hidden="true"
                    className={cn(
                      "pointer-events-none absolute top-2 left-2 z-10 size-5.5 rounded-[5px] border-2 border-white/60 bg-white/90 backdrop-blur-sm transition-opacity duration-150",
                      isSelected
                        ? "opacity-100"
                        : "opacity-0 group-hover:opacity-100"
                    )}
                  />
                </button>
              )
            })
          )}
        </div>
      </DialogBody>

      <DialogFooter>
        <DialogCancel />
        <Button onClick={handleSave}>Save changes</Button>
      </DialogFooter>
    </>
  )
}
