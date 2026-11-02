import { Fragment, useEffect, useMemo, useRef, useState } from "react"
import { useMutation } from "@tanstack/react-query"
import { FolderPlus, MoreVertical, Pencil, Trash2 } from "lucide-react"

import { notify } from "@/lib/notify"
import {
  ALL_FOLDERS,
  FOLDER_NAME_MAX_LENGTH,
  getFolderErrorMessage,
  getFolderNameError,
  getFolderValue,
  UNCATEGORISED,
  UNCATEGORISED_LABEL,
} from "@/lib/photoFolders"
import { cn } from "@/lib/utils"
import type { Photo } from "@/context/PhotographerContext"
import type { ApiPhotoFolder } from "@/data/apiClient"
import {
  createFolderMutationOptions,
  deleteFolderMutationOptions,
  renameFolderMutationOptions,
} from "@/data/queries/photographer"
import { Badge } from "@/components/ui/badge"
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Toggle } from "@/components/ui/toggle"
import { ConfirmDialog } from "@/components/ConfirmDialog"

interface PhotoFolderBarProps {
  eventId: string
  folders: ApiPhotoFolder[]
  /** The event's uploads, for the counts */
  photos: Photo[]
  /** All the event's photos, also those of other classes: what a delete moves */
  eventPhotos: Photo[]
  /** ALL_FOLDERS, UNCATEGORISED or a folder id */
  value: string
  onChange: (value: string) => void
}

/** The Uploads tab's folder filter, with creating, renaming and deleting folders */
export function PhotoFolderBar({
  eventId,
  folders,
  photos,
  eventPhotos,
  value,
  onChange,
}: PhotoFolderBarProps) {
  const rowRef = useRef<HTMLDivElement>(null)
  const createFolder = useMutation(createFolderMutationOptions())
  const renameFolder = useMutation(renameFolderMutationOptions())
  const deleteFolder = useMutation(deleteFolderMutationOptions())
  // Name dialog: a new folder, or the one being renamed
  const [nameDialog, setNameDialog] = useState<{
    folder?: ApiPhotoFolder
  } | null>(null)
  const [folderToDelete, setFolderToDelete] = useState<ApiPhotoFolder | null>(
    null
  )

  const counts = useMemo(() => {
    const byFolder = new Map<string, number>()
    photos.forEach((photo) => {
      const folder = getFolderValue(photo)
      byFolder.set(folder, (byFolder.get(folder) ?? 0) + 1)
    })
    return byFolder
  }, [photos])

  const items: Array<{
    value: string
    label: string
    count: number
    folder?: ApiPhotoFolder
  }> = [
    { value: ALL_FOLDERS, label: "All", count: photos.length },
    {
      value: UNCATEGORISED,
      label: UNCATEGORISED_LABEL,
      count: counts.get(UNCATEGORISED) ?? 0,
    },
    ...folders.map((folder) => ({
      value: folder.id,
      label: folder.name,
      count: counts.get(folder.id) ?? 0,
      folder,
    })),
  ]

  const handleSaveName = async (name: string) => {
    const folder = nameDialog?.folder
    try {
      if (folder) {
        const renamed = await renameFolder.mutateAsync({
          folderId: folder.id,
          name,
        })
        notify(`Folder renamed to ${renamed.name}`, "success")
      } else {
        const created = await createFolder.mutateAsync({ eventId, name })
        onChange(created.id)
        notify(`Folder ${created.name} created`, "success")
      }
      setNameDialog(null)
    } catch (error) {
      notify(
        getFolderErrorMessage(
          error,
          folder ? "Unable to rename the folder" : "Unable to create the folder"
        ),
        "error"
      )
    }
  }

  const handleConfirmDelete = () => {
    const folder = folderToDelete
    if (!folder) return
    setFolderToDelete(null)
    if (value === folder.id) onChange(ALL_FOLDERS)
    deleteFolder.mutate(folder, {
      onSuccess: () => notify(`Folder ${folder.name} deleted`, "success"),
      onError: () => notify("Unable to delete the folder", "error"),
    })
  }

  const deleteCount = folderToDelete
    ? eventPhotos.filter((photo) => photo.folderId === folderToDelete.id).length
    : 0

  // Keep the selected chip in view when the row scrolls (e.g. a new folder on mobile)
  useEffect(() => {
    rowRef.current
      ?.querySelector<HTMLElement>("[aria-pressed=true]")
      ?.scrollIntoView({ block: "nearest", inline: "nearest" })
  }, [value])

  return (
    <>
      {/* One row; scrolls sideways when the folders don't fit */}
      <div
        ref={rowRef}
        role="group"
        aria-label="Folders"
        className="-mx-1 mb-1 flex items-center gap-2 overflow-x-auto px-1 py-1"
      >
        {items.map((item) => {
          const isActive = value === item.value
          return (
            <Fragment key={item.value}>
              <Toggle
                variant="outline"
                pressed={isActive}
                onPressedChange={() => onChange(item.value)}
                title={item.label}
                className={cn(
                  "shrink-0 gap-1.5 pr-2.5 pl-3.5 text-[0.8125rem]",
                  "aria-pressed:border-primary aria-pressed:bg-primary aria-pressed:text-primary-foreground aria-pressed:hover:bg-primary/90"
                )}
              >
                <span className="max-w-45 truncate">{item.label}</span>
                <Badge
                  variant="secondary"
                  className={cn(
                    "h-5 min-w-5 border-border px-1.5 text-[0.6875rem]",
                    isActive &&
                      "border-white/30 bg-white/20 text-primary-foreground"
                  )}
                >
                  {item.count}
                </Badge>
              </Toggle>
              {item.folder && isActive && (
                <FolderActions
                  folder={item.folder}
                  onRename={(folder) => setNameDialog({ folder })}
                  onDelete={setFolderToDelete}
                />
              )}
            </Fragment>
          )
        })}
        <Button
          variant="ghost"
          size="sm"
          className="shrink-0 px-3 text-primary"
          onClick={() => setNameDialog({})}
        >
          <FolderPlus />
          New folder
        </Button>
      </div>

      <Dialog
        open={!!nameDialog}
        onOpenChange={(open) => {
          if (!open) setNameDialog(null)
        }}
      >
        <DialogContent className="sm:max-w-100">
          {nameDialog && (
            <FolderNameForm
              folder={nameDialog.folder}
              folders={folders}
              busy={createFolder.isPending || renameFolder.isPending}
              onSave={(name) => void handleSaveName(name)}
            />
          )}
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!folderToDelete}
        onCancel={() => setFolderToDelete(null)}
        onConfirm={handleConfirmDelete}
        title={`Delete "${folderToDelete?.name ?? ""}"?`}
        description={
          deleteCount === 0
            ? "The folder is empty."
            : `Its ${deleteCount === 1 ? "photo moves" : `${deleteCount} photos move`} to ${UNCATEGORISED_LABEL}. No photos are deleted.`
        }
        confirmLabel="Delete folder"
      />
    </>
  )
}

function FolderActions({
  folder,
  onRename,
  onDelete,
}: {
  folder: ApiPhotoFolder
  onRename: (folder: ApiPhotoFolder) => void
  onDelete: (folder: ApiPhotoFolder) => void
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="icon-sm"
            className="-ml-1 shrink-0 text-muted-foreground"
            title="Folder actions"
            aria-label={`Actions for folder ${folder.name}`}
          />
        }
      >
        <MoreVertical className="size-4.5" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-40">
        <DropdownMenuItem onClick={() => onRename(folder)}>
          <Pencil />
          Rename
        </DropdownMenuItem>
        <DropdownMenuItem
          variant="destructive"
          onClick={() => onDelete(folder)}
        >
          <Trash2 />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

/** Mounted inside the dialog, so it starts fresh each time it opens */
function FolderNameForm({
  folder,
  folders,
  busy,
  onSave,
}: {
  folder?: ApiPhotoFolder
  folders: ApiPhotoFolder[]
  busy: boolean
  onSave: (name: string) => void
}) {
  const [name, setName] = useState(folder?.name ?? "")
  const error = name ? getFolderNameError(name, folders, folder?.id) : null
  const unchanged = !!folder && name.trim() === folder.name
  const canSave = !!name && !error && !unchanged && !busy

  return (
    <form
      className="flex min-h-0 flex-col"
      onSubmit={(e) => {
        e.preventDefault()
        if (canSave) onSave(name.trim())
      }}
    >
      <DialogHeader>
        <DialogTitle>{folder ? "Rename folder" : "New folder"}</DialogTitle>
      </DialogHeader>
      <DialogBody>
        <label
          htmlFor="folder-name"
          className="mb-1.5 block text-xs font-semibold text-muted-foreground"
        >
          Folder name
        </label>
        <Input
          id="folder-name"
          placeholder="Enter name..."
          value={name}
          maxLength={FOLDER_NAME_MAX_LENGTH}
          aria-invalid={!!error || undefined}
          onChange={(e) => setName(e.target.value)}
          autoFocus
        />
        {error && <p className="mt-1.5 text-xs text-destructive">{error}</p>}
      </DialogBody>
      <DialogFooter>
        <DialogCancel />
        <Button type="submit" disabled={!canSave}>
          {folder ? "Save" : "Create"}
        </Button>
      </DialogFooter>
    </form>
  )
}
