import { AlertCircle } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogBody,
  DialogCancel,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog"

interface ConfirmDialogProps {
  open: boolean
  /** Called when the dialog is dismissed (Cancel, Escape, overlay) */
  onCancel: () => void
  onConfirm: () => void
  title: React.ReactNode
  description: React.ReactNode
  confirmLabel: React.ReactNode
  /** Label of the dismiss button (default "Cancel") */
  cancelLabel?: React.ReactNode
  /** `danger` = red icon + red button, `info` = brand icon + primary button */
  tone?: "danger" | "info"
  /** Disables the buttons while the action runs */
  busy?: boolean
  /** Disables only the confirm button */
  confirmDisabled?: boolean
}

/** Confirmation dialog (delete, archive, publish…) with an alert icon. */
export function ConfirmDialog({
  open,
  onCancel,
  onConfirm,
  title,
  description,
  confirmLabel,
  cancelLabel = "Cancel",
  tone = "danger",
  busy = false,
  confirmDisabled = false,
}: ConfirmDialogProps) {
  const danger = tone === "danger"

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next && !busy) onCancel()
      }}
    >
      <DialogContent showCloseButton={false} className="sm:max-w-110">
        <DialogBody className="flex items-start gap-4">
          <div
            className={cn(
              "flex size-10 shrink-0 items-center justify-center rounded-full",
              danger
                ? "bg-destructive/10 text-destructive"
                : "bg-primary/10 text-primary"
            )}
          >
            <AlertCircle className="size-6" />
          </div>
          <div>
            <DialogTitle className="mb-2 font-bold">{title}</DialogTitle>
            <DialogDescription className="leading-normal">
              {description}
            </DialogDescription>
          </div>
        </DialogBody>
        <DialogFooter>
          <DialogCancel disabled={busy}>{cancelLabel}</DialogCancel>
          <Button
            className={cn(
              danger &&
                "bg-destructive text-white hover:bg-[color-mix(in_oklab,var(--destructive),var(--foreground)_15%)]"
            )}
            onClick={onConfirm}
            disabled={busy || confirmDisabled}
          >
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
