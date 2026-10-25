import { useState } from "react"
import { Check, Link, Monitor } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface DesktopRecommendationModalProps {
  isOpen: boolean
  onClose: () => void
}

export function DesktopRecommendationModal({
  isOpen,
  onClose,
}: DesktopRecommendationModalProps) {
  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
    >
      <DialogContent className="sm:max-w-120">
        <RecommendationContent onClose={onClose} />
      </DialogContent>
    </Dialog>
  )
}

function RecommendationContent({ onClose }: { onClose: () => void }) {
  const [copied, setCopied] = useState(false)

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>Use desktop for photographer tools</DialogTitle>
      </DialogHeader>

      <DialogBody className="text-center">
        <div className="mx-auto mb-6 flex size-14 items-center justify-center rounded-lg bg-primary/8 text-primary">
          <Monitor size={32} />
        </div>
        <p className="text-sm leading-relaxed text-muted-foreground">
          For the best experience, please open Gallopics on a desktop or laptop
          to upload and manage photos.
        </p>
      </DialogBody>

      <DialogFooter className="flex-col items-stretch gap-3 sm:flex-col">
        <Button className="w-full" onClick={onClose}>
          Got it
        </Button>
        <Button
          variant="secondary"
          className={cn(
            "w-full",
            copied && "bg-success/10 text-success hover:bg-success/10"
          )}
          onClick={handleCopyLink}
        >
          {copied ? <Check /> : <Link />}
          {copied ? "Copied!" : "Copy link"}
        </Button>
      </DialogFooter>
    </>
  )
}
