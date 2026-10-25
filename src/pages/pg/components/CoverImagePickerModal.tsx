import { useMemo, useState } from "react"
import { Check, Upload } from "lucide-react"

import { cn } from "@/lib/utils"
import { useWorkspacePhotos } from "@/hooks/useWorkspaceData"
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

interface CoverImagePickerModalProps {
  isOpen: boolean
  onClose: () => void
  eventId: string
  onSelect: (photoUrl: string) => void
}

export function CoverImagePickerModal({
  isOpen,
  onClose,
  eventId,
  onSelect,
}: CoverImagePickerModalProps) {
  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
    >
      <DialogContent className="sm:max-w-200">
        {/* Mounted only while open, so the selection resets each time */}
        <CoverPicker eventId={eventId} onSelect={onSelect} onClose={onClose} />
      </DialogContent>
    </Dialog>
  )
}

function CoverPicker({
  eventId,
  onSelect,
  onClose,
}: Omit<CoverImagePickerModalProps, "isOpen">) {
  const allPhotos = useWorkspacePhotos()
  const [selectedUrl, setSelectedUrl] = useState<string | null>(null)

  const photos = useMemo(
    () =>
      eventId
        ? allPhotos.filter(
            (p) => p.eventId === eventId && p.status === "published"
          )
        : [],
    [eventId, allPhotos]
  )

  const handleSave = () => {
    if (selectedUrl) {
      onSelect(selectedUrl)
      onClose()
    }
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>Select event cover</DialogTitle>
      </DialogHeader>

      <DialogBody>
        <Button
          variant="outline"
          className="mb-6 h-20 w-full flex-col gap-2 rounded-xl border-dashed"
          onClick={() => {
            // Mock file picker, as in the old app
            alert("Browsing computer for image...")
          }}
        >
          <Upload className="size-5" />
          Upload from computer
        </Button>

        <div className="mb-3 text-[0.8125rem] text-muted-foreground">
          Choose from published photos
        </div>

        <div className="grid grid-cols-[repeat(auto-fill,minmax(140px,1fr))] gap-3">
          {photos.length === 0 ? (
            <div className="col-span-full py-10 text-center text-muted-foreground">
              No published photos found for this event.
            </div>
          ) : (
            photos.map((photo) => {
              const isSelected = selectedUrl === photo.url
              return (
                <button
                  key={photo.id}
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => setSelectedUrl(photo.url)}
                  className={cn(
                    "relative aspect-square cursor-pointer overflow-hidden rounded-lg bg-muted",
                    isSelected && "shadow-[inset_0_0_0_3px_var(--primary)]"
                  )}
                >
                  <img
                    src={photo.url}
                    alt=""
                    loading="lazy"
                    className={cn(
                      "size-full object-cover transition-[scale] duration-200",
                      isSelected ? "opacity-90" : "hover:scale-105"
                    )}
                  />
                  {isSelected && (
                    <span className="absolute top-2 right-2 z-2 flex size-6 items-center justify-center rounded-full bg-primary text-white shadow-[0_2px_4px_rgba(0,0,0,0.2)]">
                      <Check className="size-3.5 stroke-3" />
                    </span>
                  )}
                </button>
              )
            })
          )}
        </div>
      </DialogBody>

      <DialogFooter>
        <DialogCancel />
        <Button onClick={handleSave} disabled={!selectedUrl}>
          Set as cover
        </Button>
      </DialogFooter>
    </>
  )
}
