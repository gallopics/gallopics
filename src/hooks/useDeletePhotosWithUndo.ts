import { useMutation, useQueryClient } from "@tanstack/react-query"

import { notify } from "@/lib/notify"
import type { Photo } from "@/context/PhotographerContext"
import { ApiError } from "@/data/apiClient"
import {
  deletePhotosMutationOptions,
  restoreCachedPhotos,
  updateCachedPhotos,
} from "@/data/queries/photographer"

/**
 * Deletes photos behind an "Undo" toast. They leave the list at once, but the
 * API delete only runs when the toast goes away (about 5 s, longer while
 * hovered), so Undo really keeps them. Closing the tab before that keeps them.
 */
export function useDeletePhotosWithUndo() {
  const queryClient = useQueryClient()
  const deletePhotos = useMutation(deletePhotosMutationOptions())

  return (photos: Photo[], message: string, onUndo?: () => void) => {
    if (photos.length === 0) return
    const photoIds = photos.map((photo) => photo.id)
    updateCachedPhotos(queryClient, (prev) =>
      prev.filter((photo) => !photoIds.includes(photo.id))
    )

    let undone = false
    notify(
      message,
      "success",
      () => {
        undone = true
        restoreCachedPhotos(queryClient, photos)
        onUndo?.()
      },
      () => {
        if (undone) return
        // The mutation puts the photos back itself if the API refuses
        deletePhotos.mutate(
          { photoIds, hidden: photos },
          {
            // 409: the API refuses to delete a sold photo and says why
            onError: (error) =>
              notify(
                error instanceof ApiError && error.status === 409
                  ? error.message
                  : "Could not delete photo. Please try again.",
                "error"
              ),
          }
        )
      }
    )
  }
}
