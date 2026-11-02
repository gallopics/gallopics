import { ApiError, type ApiPhotoFolder } from "@/data/apiClient"

// The photographer's own folders for their uploads in one event (private)

/** Filter value for every upload in the event */
export const ALL_FOLDERS = "all"
/** Value for photos without a folder; folder ids are UUIDs, so it can't clash */
export const UNCATEGORISED = "uncategorised"
export const UNCATEGORISED_LABEL = "Uncategorised"

/** Same limit as the API */
export const FOLDER_NAME_MAX_LENGTH = 60

/** The folder a photo is in, as a filter value */
export const getFolderValue = (photo: { folderId?: string }) =>
  photo.folderId ?? UNCATEGORISED

/** Why a typed name can't be used (null when it can); `folderId`: the one being renamed */
export function getFolderNameError(
  value: string,
  folders: ApiPhotoFolder[],
  folderId?: string
) {
  const name = value.trim().toLowerCase()
  if (!name) return "Enter a name"
  if (name.length > FOLDER_NAME_MAX_LENGTH)
    return `At most ${FOLDER_NAME_MAX_LENGTH} characters`
  if (name === UNCATEGORISED_LABEL.toLowerCase())
    return `"${UNCATEGORISED_LABEL}" is already used for photos without a folder`
  if (folders.some((f) => f.id !== folderId && f.name.toLowerCase() === name))
    return "A folder with this name already exists"
  return null
}

/** The API's reason for a taken name, else `fallback` */
export const getFolderErrorMessage = (error: unknown, fallback: string) =>
  error instanceof ApiError && error.status === 409 ? error.message : fallback
