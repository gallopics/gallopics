import { useId, useState } from "react"
import { useMutation, useQuery } from "@tanstack/react-query"
import { Plus, X } from "lucide-react"

import { notify } from "@/lib/notify"
import {
  FOLDER_NAME_MAX_LENGTH,
  getFolderErrorMessage,
  getFolderNameError,
  getFolderValue,
  UNCATEGORISED,
  UNCATEGORISED_LABEL,
} from "@/lib/photoFolders"
import type { Photo } from "@/context/PhotographerContext"
import {
  createFolderMutationOptions,
  foldersQueryOptions,
  movePhotosToFolderMutationOptions,
} from "@/data/queries/photographer"
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
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { ModernDropdown } from "@/components/ModernDropdown"

const NEW_FOLDER = "__new__"

export function MovePhotosDialog({
  open,
  onOpenChange,
  photos,
  onClosePanel,
  onMoved,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  photos: Photo[]
  onClosePanel: () => void
  onMoved?: () => void
}) {
  const id = useId()
  const eventId = photos[0]?.eventId ?? ""
  const { data: folders = [] } = useQuery({
    ...foldersQueryOptions(eventId),
    enabled: open && !!eventId,
  })
  const createFolder = useMutation(createFolderMutationOptions())
  const movePhotos = useMutation(movePhotosToFolderMutationOptions())
  const [creating, setCreating] = useState(false)
  const [folder, setFolder] = useState("")
  const [name, setName] = useState("")
  const [busy, setBusy] = useState(false)
  /** From the server (creating the folder) */
  const [error, setError] = useState<string>()
  const currentFolder =
    photos.length > 0 &&
    photos.every((photo) => getFolderValue(photo) === getFolderValue(photos[0]))
      ? getFolderValue(photos[0])
      : null
  const nameError = creating && name ? getFolderNameError(name, folders) : null
  const canSubmit = creating ? !!name.trim() && !nameError : !!folder

  const move = async () => {
    // Enter in the name field submits even while Confirm is disabled
    if (!photos.length || !canSubmit) return
    setError(undefined)
    let target: { id: string | null; name: string } | undefined
    if (creating) {
      try {
        target = await createFolder.mutateAsync({ eventId, name: name.trim() })
      } catch (e) {
        setError(getFolderErrorMessage(e, "Unable to create the folder"))
        return
      }
    } else if (folder === UNCATEGORISED) {
      target = { id: null, name: UNCATEGORISED_LABEL }
    } else target = folders.find((f) => f.id === folder)
    if (!target) return
    onOpenChange(false)
    onClosePanel()
    try {
      await movePhotos.mutateAsync({
        photoIds: photos.map((photo) => photo.id),
        folderId: target.id,
      })
    } catch {
      notify("Unable to move the photos", "error")
      return
    }
    onMoved?.()
    const undo = () => {
      const byFolder = new Map<string, string[]>()
      photos.forEach((photo) => {
        const folder = getFolderValue(photo)
        byFolder.set(folder, [...(byFolder.get(folder) ?? []), photo.id])
      })
      void Promise.all(
        Array.from(byFolder, ([folder, photoIds]) =>
          movePhotos.mutateAsync({
            photoIds,
            folderId: folder === UNCATEGORISED ? null : folder,
          })
        )
      )
        .then(() => notify("Move undone", "success"))
        .catch(() => notify("Unable to undo the move", "error"))
    }
    notify(
      `Moved ${photos.length === 1 ? "photo" : `${photos.length} photos`} to ${target.name}`,
      "success",
      undo
    )
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!busy) onOpenChange(next)
      }}
      onOpenChangeComplete={(next) => {
        if (!next) {
          setFolder("")
          setName("")
          setCreating(false)
          setError(undefined)
        }
      }}
    >
      <DialogContent className="sm:max-w-100">
        <DialogHeader>
          <DialogTitle>Move to other folder</DialogTitle>
        </DialogHeader>
        <DialogBody>
          <form
            id={id}
            onSubmit={(e) => {
              e.preventDefault()
              setBusy(true)
              void move().finally(() => setBusy(false))
            }}
          >
            <fieldset disabled={busy}>
              {creating ? (
                <Field className="gap-1.5" data-invalid={!!nameError}>
                  <FieldLabel
                    htmlFor={`${id}-name`}
                    className="text-xs font-semibold text-muted-foreground"
                  >
                    New Folder Name
                  </FieldLabel>
                  <div className="flex gap-2">
                    <Input
                      id={`${id}-name`}
                      autoFocus
                      maxLength={FOLDER_NAME_MAX_LENGTH}
                      placeholder="Enter name..."
                      value={name}
                      onChange={(e) => {
                        setError(undefined)
                        setName(e.target.value)
                      }}
                      aria-invalid={!!nameError}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      aria-label="Back to folder list"
                      onClick={() => setCreating(false)}
                    >
                      <X />
                    </Button>
                  </div>
                  {nameError && (
                    <FieldError errors={[{ message: nameError }]} />
                  )}
                </Field>
              ) : (
                <Field className="gap-1.5">
                  <FieldLabel
                    htmlFor={`${id}-folder`}
                    className="text-xs font-semibold text-muted-foreground"
                  >
                    Select Folder
                  </FieldLabel>
                  <ModernDropdown
                    id={`${id}-folder`}
                    value={folder}
                    onChange={(value) => {
                      if (value === NEW_FOLDER) {
                        setCreating(true)
                        setFolder("")
                      } else setFolder(value)
                    }}
                    options={[
                      {
                        value: UNCATEGORISED,
                        label: UNCATEGORISED_LABEL,
                        disabled: currentFolder === UNCATEGORISED,
                      },
                      ...folders.map((f) => ({
                        value: f.id,
                        label: f.name,
                        disabled: f.id === currentFolder,
                        subtext:
                          f.id === currentFolder ? "Current folder" : undefined,
                      })),
                      {
                        value: NEW_FOLDER,
                        label: "Create new folder...",
                        icon: <Plus />,
                      },
                    ]}
                    placeholder="Select folder..."
                  />
                </Field>
              )}
            </fieldset>
            {error && (
              <FieldError className="mt-3" errors={[{ message: error }]} />
            )}
          </form>
        </DialogBody>
        <DialogFooter>
          <DialogCancel disabled={busy} />
          <Button type="submit" form={id} disabled={busy || !canSubmit}>
            {busy ? "Moving…" : "Confirm"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
