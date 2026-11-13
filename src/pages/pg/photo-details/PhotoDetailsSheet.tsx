import { useMemo, useState } from "react"

import { notify } from "@/lib/notify"
import { useDeletePhotosWithUndo } from "@/hooks/useDeletePhotosWithUndo"
import type { Photo } from "@/context/PhotographerContext"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { ConfirmDialog } from "@/components/ConfirmDialog"

import { DetailsPanel, IDLE, type PanelTab } from "./DetailsPanel"
import { MovePhotosDialog } from "./MovePhotosDialog"

interface PhotoDetailsSheetProps {
  isOpen: boolean
  selectedIds: Set<string>
  allPhotos: Photo[]
  onClose: () => void
  activeTab?: PanelTab
  onMoved?: () => void
}

/** Edit tags and prices of the selected photos */
export function PhotoDetailsSheet({
  isOpen,
  selectedIds,
  allPhotos,
  onClose,
  activeTab,
  onMoved,
}: PhotoDetailsSheetProps) {
  const photos = useMemo(
    () => allPhotos.filter((photo) => selectedIds.has(photo.id)),
    [allPhotos, selectedIds]
  )
  const [status, setStatus] = useState(IDLE)
  // A discarded form is replaced at once, so reopening during the
  // slide-out (while the panel is still mounted) starts fresh
  const [panelKey, setPanelKey] = useState(0)
  const [moveOpen, setMoveOpen] = useState(false)
  const [confirmation, setConfirmation] = useState<"delete" | "close" | null>(
    null
  )
  const deletePhotos = useDeletePhotosWithUndo()
  const close = () => {
    if (status.isSubmitting) return
    if (status.isDirty) setConfirmation("close")
    else onClose()
  }
  const discard = () => {
    setConfirmation(null)
    setPanelKey((key) => key + 1)
    onClose()
  }
  const confirmDelete = () => {
    setConfirmation(null)
    onClose()
    deletePhotos(photos, "Photo deleted", () =>
      notify("Delete undone", "success")
    )
  }
  return (
    <Sheet
      open={isOpen}
      disablePointerDismissal
      onOpenChange={(next, details) => {
        if (!next) {
          if (status.isDirty || status.isSubmitting) details.cancel()
          close()
        }
      }}
    >
      {/* Slides fully in and out without fading, like the old side panel */}
      <SheetContent className="max-w-full bg-card data-ending-style:opacity-100 data-starting-style:opacity-100 data-[side=right]:w-100 data-[side=right]:data-ending-style:translate-x-full data-[side=right]:data-starting-style:translate-x-full">
        <SheetHeader className="h-16 py-0">
          <SheetTitle>Selection details</SheetTitle>
          <SheetDescription className="sr-only">
            Edit tags and prices for the selected photos.
          </SheetDescription>
        </SheetHeader>
        <DetailsPanel
          key={panelKey}
          photos={photos}
          activeTab={activeTab}
          onStatusChange={setStatus}
          onClose={close}
          onDiscard={discard}
          onDelete={() => setConfirmation("delete")}
          onMove={() => setMoveOpen(true)}
        />
      </SheetContent>
      <MovePhotosDialog
        open={moveOpen}
        onOpenChange={setMoveOpen}
        photos={photos}
        onClosePanel={onClose}
        onMoved={onMoved}
      />
      <ConfirmDialog
        open={confirmation !== null}
        onCancel={() => setConfirmation(null)}
        onConfirm={confirmation === "delete" ? confirmDelete : discard}
        title={confirmation === "delete" ? "Delete photo?" : "Discard changes?"}
        description={
          confirmation === "delete"
            ? "This will remove the photo from this event. You can undo right after deleting."
            : "You have unsaved changes. Are you sure you want to discard them?"
        }
        confirmLabel={confirmation === "delete" ? "Delete" : "Discard"}
        tone="danger"
      />
    </Sheet>
  )
}
