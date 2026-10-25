import React, {
  createContext,
  useContext,
  useState,
  type ReactNode,
} from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"

import {
  getApiBaseUrl,
  getSessionToken,
  resolveApiAssetUrl,
  type ApiPhoto,
} from "../data/apiClient"
import { PHOTOGRAPHERS } from "../data/mockData"
import { invalidateEventPhotos } from "../data/queries/events"
import {
  deletePhotosMutationOptions,
  getApiPhotoClassId,
  getApiPhotoClassName,
  getApiPhotoTag,
  updateCachedPhotos,
} from "../data/queries/photographer"
import { useAuth } from "./AuthContext"

// --- Types ---

export type EventStatus = "upcoming" | "open" | "archived"

export interface PgEvent {
  id: string
  title: string
  date: string // Start date for sorting/simple display
  endDate?: string
  dateRange: string // Full range "26 Nov – 30 Nov 2026"
  location: string
  coverImage: string
  status: EventStatus

  // Stats for "My events"
  photosCount?: number
  publishedCount?: number
  soldCount?: number

  // For "Upcoming" logic
  isRegistered?: boolean
  logo: string
  venueName: string
  disciplines: string[]
  city: string
  assignedPhotographers?: { id: string; name: string; avatar: string }[]
  applicationsWelcomed?: boolean
  canUploadPhotos?: boolean
}

export interface Photo {
  id: string
  url: string
  eventId: string
  status:
    | "uploading"
    | "processing"
    | "needsReview"
    | "uploadedUnpublished"
    | "published"
    | "archived"
  soldCount: number
  /* Metadata */
  rider?: string
  riderId?: string
  horse?: string
  horseId?: string
  timestamp?: string
  width: number
  height: number
  title?: string
  description?: string
  isGeneric?: boolean
  /* New fields for Uploads tab */
  fileName?: string
  photoCode?: string // e.g. "PHT-9X2A1"
  uploadDate?: string // ISO date string
  batch?: string // Batch name (empty = Uncategorised)
  classId?: string
  className?: string
  isDuplicate?: boolean
  duplicateResolved?: boolean // True after "Keep" action resolves duplicates
  duplicateGroupId?: string // Identifies which duplicate group this instance belongs to
  storedLocation?: "Random" | "Misc" | "Uncategorised" | "Published" // Where this instance lives
  priceStandard?: number // e.g. 499
  priceHigh?: number // e.g. 999
  priceCommercial?: number // e.g. 1500
}

export interface UploadFile {
  id: string
  file: File
  progress: number
  status: "pending" | "uploading" | "completed" | "failed"
  error?: string
  uploadedPhotoIds?: string[]
  takenAt?: string
  matchedRider?: string
  matchedHorse?: string
  matchConfidence?: string
}

export interface UploadSession {
  eventId: string
  status: "uploading" | "completed"
  files: UploadFile[]
  startTime: number
}

// Server data (booked events, photos, highlights) and its writes live in
// TanStack Query: see data/queries/photographer.ts and the hooks in
// useWorkspaceData. This context keeps the studio's local state (uploads).
interface PhotographerContextType {
  photographerId: string

  // Upload System
  uploadSessions: Record<string, UploadSession> // Keyed by eventId
  setCurrentUploadEventId: (eventId: string | null) => void
  startUpload: (files: File[], metadata?: UploadMetadata) => void
  clearUploadSession: (
    eventId: string,
    options?: { deleteUploaded?: boolean }
  ) => Promise<void>
  removeUploadFile: (
    eventId: string,
    fileId: string,
    options?: { deleteUploaded?: boolean }
  ) => Promise<void>

  // Profile
  availableToHire: boolean
  toggleAvailableToHire: (val: boolean) => void
}

const generatePhotoCode = () => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
  return (
    "PHT-" +
    Array.from(
      { length: 5 },
      () => chars[Math.floor(Math.random() * chars.length)]
    ).join("")
  )
}

const isUuid = (value: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  )

export interface UploadMetadata {
  classId?: string
  eventClassId?: string
  classSectionId?: string
  equipeClassSectionId?: string
  className?: string
  takenAt?: string
}

const getUploadErrorMessage = (status: number) => {
  if (status === 413) {
    return "File is too large for the current upload limit."
  }
  return `Upload failed: ${status}`
}

const readUint16 = (view: DataView, offset: number, littleEndian: boolean) =>
  view.getUint16(offset, littleEndian)

const readUint32 = (view: DataView, offset: number, littleEndian: boolean) =>
  view.getUint32(offset, littleEndian)

const parseExifDateTime = (value: string) => {
  const match = value
    .trim()
    .match(/^(\d{4}):(\d{2}):(\d{2}) (\d{2}):(\d{2}):(\d{2})$/)
  if (!match) return null

  const [, year, month, day, hour, minute, second] = match
  const date = new Date(
    Number(year),
    Number(month) - 1,
    Number(day),
    Number(hour),
    Number(minute),
    Number(second)
  )

  return Number.isNaN(date.getTime()) ? null : date.toISOString()
}

const readExifAscii = (
  view: DataView,
  tiffStart: number,
  valueOffset: number,
  count: number,
  littleEndian: boolean
) => {
  const inlineValueSize = 4
  const stringOffset =
    count <= inlineValueSize
      ? valueOffset
      : tiffStart + readUint32(view, valueOffset, littleEndian)

  if (stringOffset < 0 || stringOffset + count > view.byteLength) return null

  const bytes = new Uint8Array(view.buffer, stringOffset, count)
  return new TextDecoder("ascii").decode(bytes).replace(/\0+$/g, "").trim()
}

const findExifDateInIfd = (
  view: DataView,
  tiffStart: number,
  ifdOffset: number,
  littleEndian: boolean
) => {
  if (ifdOffset < 0 || ifdOffset + 2 > view.byteLength) return null

  const tagCount = readUint16(view, ifdOffset, littleEndian)
  for (let index = 0; index < tagCount; index += 1) {
    const entryOffset = ifdOffset + 2 + index * 12
    if (entryOffset + 12 > view.byteLength) return null

    const tag = readUint16(view, entryOffset, littleEndian)
    const type = readUint16(view, entryOffset + 2, littleEndian)
    const count = readUint32(view, entryOffset + 4, littleEndian)
    const valueOffset = entryOffset + 8

    if ((tag === 0x9003 || tag === 0x9004) && type === 2) {
      const value = readExifAscii(
        view,
        tiffStart,
        valueOffset,
        count,
        littleEndian
      )
      const parsed = value ? parseExifDateTime(value) : null
      if (parsed) return parsed
    }
  }

  return null
}

const extractJpegTakenAt = async (file: File) => {
  if (!file.type.includes("jpeg") && !/\.(jpe?g)$/i.test(file.name)) {
    return null
  }

  const buffer = await file.slice(0, 256 * 1024).arrayBuffer()
  const view = new DataView(buffer)
  let offset = 2

  if (view.byteLength < 4 || view.getUint16(0) !== 0xffd8) return null

  while (offset + 4 <= view.byteLength) {
    if (view.getUint8(offset) !== 0xff) return null

    const marker = view.getUint8(offset + 1)
    const segmentLength = view.getUint16(offset + 2)
    const segmentStart = offset + 4
    const segmentEnd = offset + 2 + segmentLength

    if (marker === 0xe1 && segmentEnd <= view.byteLength) {
      const header = new TextDecoder("ascii").decode(
        new Uint8Array(view.buffer, segmentStart, 6)
      )
      if (header === "Exif\0\0") {
        const tiffStart = segmentStart + 6
        const byteOrder = view.getUint16(tiffStart)
        const littleEndian = byteOrder === 0x4949
        if (!littleEndian && byteOrder !== 0x4d4d) return null

        const firstIfdOffset =
          tiffStart + readUint32(view, tiffStart + 4, littleEndian)
        const tagCount = readUint16(view, firstIfdOffset, littleEndian)
        for (let index = 0; index < tagCount; index += 1) {
          const entryOffset = firstIfdOffset + 2 + index * 12
          if (entryOffset + 12 > view.byteLength) return null

          const tag = readUint16(view, entryOffset, littleEndian)
          if (tag === 0x8769) {
            const exifIfdOffset =
              tiffStart + readUint32(view, entryOffset + 8, littleEndian)
            return findExifDateInIfd(
              view,
              tiffStart,
              exifIfdOffset,
              littleEndian
            )
          }
        }
      }
    }

    offset = segmentEnd
  }

  return null
}

const getFileTakenAt = async (file: File) => {
  try {
    const exifTakenAt = await extractJpegTakenAt(file)
    if (exifTakenAt) return exifTakenAt
  } catch {
    // Fall back to the browser file timestamp when EXIF is absent or unreadable.
  }

  return file.lastModified ? new Date(file.lastModified).toISOString() : null
}

const normalizeUploadMetadata = (metadata?: UploadMetadata) => {
  const classId = metadata?.classId
  const classIdIsInternal = classId ? isUuid(classId) : false

  return {
    classSectionId:
      metadata?.classSectionId || (classIdIsInternal ? classId : undefined),
    equipeClassSectionId: metadata?.equipeClassSectionId,
    eventClassId:
      metadata?.eventClassId || (!classIdIsInternal ? classId : undefined),
    className: metadata?.className,
    takenAt: metadata?.takenAt,
  }
}

// --- Context & Provider ---

const PhotographerContext = createContext<PhotographerContextType | undefined>(
  undefined
)

export const PhotographerProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const photographerId = user?.id || ""

  // Upload State
  const [currentUploadEventId, setCurrentUploadEventId] = useState<
    string | null
  >(null)
  // Keyed by eventId
  const [uploadSessions, setUploadSessions] = useState<
    Record<string, UploadSession>
  >({})

  // Not stored by the API yet: the mock profile's value until changed here
  const [availableToHireOverride, setAvailableToHireOverride] = useState<
    boolean | null
  >(null)
  const availableToHire =
    availableToHireOverride ??
    PHOTOGRAPHERS.find((p) => p.id === photographerId)?.isAvailableToHire ??
    true

  const toggleAvailableToHire = (val: boolean) => {
    setAvailableToHireOverride(val)
    const p = PHOTOGRAPHERS.find((p) => p.id === photographerId)
    if (p) {
      p.isAvailableToHire = val
    }
  }

  // --- Upload Logic ---

  const removePhotos = useMutation(deletePhotosMutationOptions())
  const deletePhotos = async (photoIds: string[]) => {
    if (photoIds.length === 0) return
    await removePhotos.mutateAsync({ photoIds })
  }

  const clearUploadSession = async (
    eventId: string,
    options?: { deleteUploaded?: boolean }
  ) => {
    const uploadedPhotoIds =
      uploadSessions[eventId]?.files.flatMap((f) => f.uploadedPhotoIds || []) ||
      []

    if (options?.deleteUploaded && uploadedPhotoIds.length > 0) {
      await deletePhotos(uploadedPhotoIds)
    }

    setUploadSessions((prev) => {
      const next = { ...prev }
      delete next[eventId]
      return next
    })
  }

  const removeUploadFile = async (
    eventId: string,
    fileId: string,
    options?: { deleteUploaded?: boolean }
  ) => {
    const uploadedPhotoIds =
      uploadSessions[eventId]?.files.find((f) => f.id === fileId)
        ?.uploadedPhotoIds || []

    if (options?.deleteUploaded !== false && uploadedPhotoIds.length > 0) {
      await deletePhotos(uploadedPhotoIds)
    }

    setUploadSessions((prev) => {
      const session = prev[eventId]
      if (!session) return prev

      const updatedFiles = session.files.filter((f) => f.id !== fileId)

      return {
        ...prev,
        [eventId]: {
          ...session,
          files: updatedFiles,
        },
      }
    })
  }

  const startUpload = async (files: File[], metadata?: UploadMetadata) => {
    if (!currentUploadEventId) return
    const eventId = currentUploadEventId
    const uploadMetadata = normalizeUploadMetadata(metadata)

    // Create local tracking for each file
    const newFiles: UploadFile[] = files.map((f) => ({
      id: Math.random().toString(36).substr(2, 9),
      file: f,
      progress: 0,
      status: "pending",
    }))

    setUploadSessions((prev) => {
      const existing = prev[eventId]
      return {
        ...prev,
        [eventId]: {
          eventId,
          startTime: existing ? existing.startTime : Date.now(),
          status: "uploading",
          files: existing ? [...existing.files, ...newFiles] : newFiles,
        },
      }
    })

    const updateQueuedFile = (fileId: string, updates: Partial<UploadFile>) => {
      setUploadSessions((prev) => {
        const session = prev[eventId]
        if (!session) return prev
        return {
          ...prev,
          [eventId]: {
            ...session,
            files: session.files.map((f) => ({
              ...f,
              ...(f.id === fileId ? updates : {}),
            })),
          },
        }
      })
    }

    const getUploadToken = async (skipCache = false) => {
      const token = await getSessionToken({ skipCache })
      if (!token) throw new Error("Not authenticated")
      return token
    }

    const uploadFormData = async (formData: FormData) => {
      let token = await getUploadToken()
      let response = await fetch(
        `${getApiBaseUrl()}/api/v1/photographer/uploads`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        }
      )

      if (response.status === 401) {
        token = await getUploadToken(true)
        response = await fetch(
          `${getApiBaseUrl()}/api/v1/photographer/uploads`,
          {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` },
            body: formData,
          }
        )
      }

      return response
    }

    let uploadedCount = 0
    for (const [index, file] of files.entries()) {
      const queuedFile = newFiles[index]
      if (!queuedFile) continue

      try {
        const takenAt = uploadMetadata.takenAt || (await getFileTakenAt(file))
        const formData = new FormData()
        formData.set("event_id", eventId)
        if (uploadMetadata.classSectionId) {
          formData.set("class_section_id", uploadMetadata.classSectionId)
        }
        if (uploadMetadata.equipeClassSectionId) {
          formData.set(
            "equipe_class_section_id",
            uploadMetadata.equipeClassSectionId
          )
        }
        if (uploadMetadata.eventClassId) {
          formData.set("event_class_id", uploadMetadata.eventClassId)
        }
        if (uploadMetadata.className) {
          formData.set("class_name", uploadMetadata.className)
        }
        if (takenAt) {
          formData.set("taken_at", takenAt)
        }
        formData.append("files", file)

        updateQueuedFile(queuedFile.id, {
          status: "uploading",
          progress: 50,
          error: undefined,
          takenAt: takenAt || undefined,
        })

        const response = await uploadFormData(formData)

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(
            errorData.detail || getUploadErrorMessage(response.status)
          )
        }

        const photos: ApiPhoto[] = await response.json()

        const newPhotoList: Photo[] = photos.map((p, photoIndex) => {
          const rider = getApiPhotoTag(p, "rider")
          const horse = getApiPhotoTag(p, "horse")

          return {
            id: p.id || queuedFile.id || `api-${Date.now()}-${photoIndex}`,
            url:
              p.status === "ready"
                ? resolveApiAssetUrl(
                    `/api/v1/photographer/photos/${p.id}/preview`
                  ) || ""
                : "",
            eventId: p.event_id,
            status: p.status === "ready" ? "uploadedUnpublished" : "processing",
            soldCount: 0,
            rider,
            riderId: p.equipe_rider_id || undefined,
            horse,
            horseId: p.equipe_horse_id || undefined,
            timestamp: new Date(
              p.taken_at || takenAt || p.created_at || Date.now()
            ).toLocaleTimeString("en-GB", {
              hour: "2-digit",
              minute: "2-digit",
            }),
            width: 600,
            height: 800,
            fileName: file.name,
            photoCode: generatePhotoCode(),
            uploadDate: new Date().toISOString(),
            batch: "",
            classId:
              getApiPhotoClassId(p) ||
              uploadMetadata.equipeClassSectionId ||
              uploadMetadata.classSectionId ||
              uploadMetadata.eventClassId ||
              "",
            className:
              getApiPhotoClassName(p) ||
              uploadMetadata.className ||
              uploadMetadata.equipeClassSectionId ||
              uploadMetadata.classSectionId ||
              uploadMetadata.eventClassId ||
              "",
          }
        })

        // Into the cached list (fetched in full later if not loaded yet)
        updateCachedPhotos(queryClient, (prev) => [...newPhotoList, ...prev])
        uploadedCount += 1
        updateQueuedFile(queuedFile.id, {
          progress: 100,
          status: "completed",
          error: undefined,
          uploadedPhotoIds: newPhotoList.map((photo) => photo.id),
          matchedRider: newPhotoList[0]?.rider,
          matchedHorse: newPhotoList[0]?.horse,
          matchConfidence: photos[0]?.match_confidence || undefined,
        })
      } catch (error) {
        const errorMsg =
          error instanceof Error ? error.message : "Upload failed"
        updateQueuedFile(queuedFile.id, {
          progress: 0,
          status: "failed",
          error: errorMsg,
        })
      }
    }

    // New photos change the event's public gallery and photo counts
    if (uploadedCount > 0) invalidateEventPhotos(queryClient, [eventId])
  }

  return (
    <PhotographerContext.Provider
      value={{
        photographerId,
        // Upload controls
        uploadSessions,
        setCurrentUploadEventId,
        startUpload,
        clearUploadSession,
        removeUploadFile,
        // Profile
        availableToHire,
        toggleAvailableToHire,
      }}
    >
      {children}
    </PhotographerContext.Provider>
  )
}

export const usePhotographer = () => {
  const context = useContext(PhotographerContext)
  if (!context) {
    throw new Error(
      "usePhotographer must be used within a PhotographerProvider"
    )
  }
  return context
}
