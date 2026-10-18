import { useState } from "react"
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog"
import { ChevronLeft, ChevronRight, X } from "lucide-react"

import type { Photo } from "@/types"
import { Button } from "@/components/ui/button"

interface HighlightsProps {
  items: Photo[]
}

const navButtonClass =
  "absolute top-1/2 z-10 size-auto -translate-y-1/2 rounded-full bg-white/10 p-3 text-white hover:bg-white/20 hover:text-white max-md:p-2 [&_svg:not([class*='size-'])]:size-8"

/** Square photo grid; clicking opens a full-screen viewer with arrows. */
export function Highlights({ items }: HighlightsProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null)
  const count = items.length

  const step = (delta: number) =>
    setOpenIndex((i) => (i === null ? i : (i + delta + count) % count))

  return (
    <>
      <div className="mx-auto grid w-full max-w-233.75 grid-cols-3 gap-1 max-md:gap-0.5 md:grid-cols-4">
        {items.map((photo, index) => (
          <button
            key={photo.id}
            type="button"
            onClick={() => setOpenIndex(index)}
            className="group aspect-square cursor-pointer overflow-hidden bg-muted"
          >
            <img
              src={photo.src}
              alt=""
              loading="lazy"
              className="block size-full object-cover transition-opacity duration-200 group-hover:opacity-90"
            />
          </button>
        ))}
      </div>

      <DialogPrimitive.Root
        open={openIndex !== null}
        onOpenChange={(open) => {
          if (!open) setOpenIndex(null)
        }}
      >
        <DialogPrimitive.Portal>
          <DialogPrimitive.Backdrop className="fixed inset-0 z-50 bg-black/95 backdrop-blur-[5px] duration-200 data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0" />
          <DialogPrimitive.Popup
            aria-label="Highlight photo"
            className="fixed inset-0 z-50 flex items-center justify-center outline-none"
            onKeyDown={(e) => {
              if (e.key === "ArrowRight") step(1)
              if (e.key === "ArrowLeft") step(-1)
            }}
          >
            {/* Clicking around the photo closes the viewer */}
            <DialogPrimitive.Close
              aria-label="Close"
              className="absolute inset-0 cursor-default"
              tabIndex={-1}
            />
            <DialogPrimitive.Close
              render={
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-6 right-6 z-10 text-white opacity-80 hover:bg-transparent hover:text-white hover:opacity-100 [&_svg:not([class*='size-'])]:size-8"
                />
              }
            >
              <X />
            </DialogPrimitive.Close>

            {openIndex !== null && (
              <img
                src={items[openIndex].src}
                alt=""
                className="relative max-h-[90vh] max-w-[90%] object-contain shadow-[0_0_20px_rgba(0,0,0,0.5)]"
              />
            )}

            {count > 1 && (
              <>
                <Button
                  variant="ghost"
                  aria-label="Previous photo"
                  onClick={() => step(-1)}
                  className={`${navButtonClass} left-6 max-md:left-3`}
                >
                  <ChevronLeft />
                </Button>
                <Button
                  variant="ghost"
                  aria-label="Next photo"
                  onClick={() => step(1)}
                  className={`${navButtonClass} right-6 max-md:right-3`}
                >
                  <ChevronRight />
                </Button>
              </>
            )}
          </DialogPrimitive.Popup>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>
    </>
  )
}
