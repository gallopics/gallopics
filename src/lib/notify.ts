import { toast } from "@/components/ui/toast"

export type NotifyType = "success" | "info" | "warning" | "error"

/** Shows a toast; with `onUndo` it gets an "Undo" button that closes it. */
export function notify(title: string, type: NotifyType, onUndo?: () => void) {
  const id: string = toast.add({
    title,
    type,
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
