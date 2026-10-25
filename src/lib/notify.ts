import { toast } from "@/components/ui/toast"

export type NotifyType = "success" | "info" | "warning" | "error"

/**
 * Shows a toast; with `onUndo` it gets an "Undo" button that closes it.
 * `onClose` runs when it goes away for any reason (timeout, close, Undo).
 */
export function notify(
  title: string,
  type: NotifyType,
  onUndo?: () => void,
  onClose?: () => void
) {
  const id: string = toast.add({
    title,
    type,
    onClose,
    actionProps: onUndo
      ? {
          children: "Undo",
          onClick: () => {
            onUndo()
            toast.close(id)
          },
        }
      : undefined,
  })
  return id
}
