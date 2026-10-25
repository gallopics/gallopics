import { Dialog as DialogPrimitive } from "@base-ui/react/dialog"
import { X } from "lucide-react"

import { Button } from "@/components/ui/button"

/** Full-screen black photo preview used in the photographer workspace. */
export function PhotoPreviewDialog({
  src,
  onClose,
}: {
  /** Image to show; `null` closes the preview */
  src: string | null | undefined
  onClose: () => void
}) {
  return (
    <DialogPrimitive.Root
      open={!!src}
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
    >
      <DialogPrimitive.Portal>
        <DialogPrimitive.Backdrop className="fixed inset-0 z-50 bg-black/95 duration-200 data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0" />
        <DialogPrimitive.Popup className="fixed inset-0 z-50 flex items-center justify-center outline-none">
          <DialogPrimitive.Title className="sr-only">
            Photo preview
          </DialogPrimitive.Title>
          {/* Clicking the dark area closes the preview */}
          <DialogPrimitive.Close
            aria-label="Close preview"
            className="absolute inset-0 cursor-default"
          />
          {src && (
            <img
              src={src}
              alt=""
              className="relative max-h-[95vh] max-w-[95vw] rounded-sm object-contain shadow-[0_20px_50px_rgba(0,0,0,0.5)]"
            />
          )}
          <DialogPrimitive.Close
            render={
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-6 right-6 bg-white/10 text-white backdrop-blur-md hover:bg-white/20 hover:text-white"
              />
            }
            aria-label="Close"
          >
            <X className="size-6" />
          </DialogPrimitive.Close>
        </DialogPrimitive.Popup>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}
