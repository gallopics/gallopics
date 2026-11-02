export interface UploadFile {
  id: string
  file: File
  progress: number
  status: "pending" | "uploading" | "completed" | "failed"
  isRemoving?: boolean
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
  isClearing?: boolean
  clearError?: string
}

export const isUploadInProgress = (file: UploadFile) =>
  file.status === "pending" || file.status === "uploading"

export const isUploadSessionBusy = (session?: UploadSession | null) =>
  !!session &&
  (!!session.isClearing ||
    session.files.some((file) => isUploadInProgress(file) || file.isRemoving))

type DeletePhotos = (photoIds: string[]) => Promise<void>

// Requests outlive UploadPage. Keep their locks and queue updates together.
export class UploadSessionStore {
  private sessions: Record<string, UploadSession> = {}
  private listeners = new Set<() => void>()

  getSnapshot = () => this.sessions

  subscribe = (listener: () => void) => {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }

  private setSession(eventId: string, session?: UploadSession) {
    const next = { ...this.sessions }
    if (session) next[eventId] = session
    else delete next[eventId]
    this.sessions = next
    this.listeners.forEach((listener) => listener())
  }

  addFiles(eventId: string, files: UploadFile[]) {
    const session = this.sessions[eventId]
    if (session?.isClearing || files.length === 0) return false

    this.setSession(eventId, {
      eventId,
      status: "uploading",
      startTime: session?.startTime ?? Date.now(),
      files: [...(session?.files ?? []), ...files],
    })
    return true
  }

  updateFile(eventId: string, fileId: string, updates: Partial<UploadFile>) {
    const session = this.sessions[eventId]
    if (!session?.files.some((file) => file.id === fileId)) return

    const files = session.files.map((file) =>
      file.id === fileId ? { ...file, ...updates } : file
    )
    this.setSession(eventId, {
      ...session,
      files,
      status: files.some(isUploadInProgress) ? "uploading" : "completed",
    })
  }

  private removeFile(eventId: string, fileId: string) {
    const session = this.sessions[eventId]
    if (!session) return
    this.setSession(eventId, {
      ...session,
      files: session.files.filter((file) => file.id !== fileId),
    })
  }

  private async deleteFilePhotos(
    eventId: string,
    file: UploadFile,
    deletePhotos: DeletePhotos
  ) {
    for (const photoId of file.uploadedPhotoIds ?? []) {
      await deletePhotos([photoId])
      const current = this.sessions[eventId]?.files.find(
        (item) => item.id === file.id
      )
      if (current) {
        this.updateFile(eventId, file.id, {
          uploadedPhotoIds: current.uploadedPhotoIds?.filter(
            (id) => id !== photoId
          ),
        })
      }
    }
  }

  async clear(eventId: string, deletePhotos?: DeletePhotos) {
    const session = this.sessions[eventId]
    if (!session || isUploadSessionBusy(session)) return false

    this.setSession(eventId, {
      ...session,
      isClearing: true,
      clearError: undefined,
    })
    try {
      const results = await Promise.allSettled(
        session.files.map(async (file) => {
          if (deletePhotos)
            await this.deleteFilePhotos(eventId, file, deletePhotos)
          this.removeFile(eventId, file.id)
        })
      )
      const failure = results.find((result) => result.status === "rejected")
      if (failure) throw failure.reason
      return true
    } catch (error) {
      const current = this.sessions[eventId]
      if (current) {
        this.setSession(eventId, {
          ...current,
          clearError:
            error instanceof Error
              ? error.message
              : "Unable to clear these photos. Please try again.",
        })
      }
      throw error
    } finally {
      const current = this.sessions[eventId]
      if (current) {
        this.setSession(
          eventId,
          current.files.length ? { ...current, isClearing: false } : undefined
        )
      }
    }
  }

  async remove(eventId: string, fileId: string, deletePhotos?: DeletePhotos) {
    const session = this.sessions[eventId]
    const file = session?.files.find((item) => item.id === fileId)
    if (
      session?.isClearing ||
      !file ||
      isUploadInProgress(file) ||
      file.isRemoving
    ) {
      return false
    }

    this.updateFile(eventId, fileId, { isRemoving: true })
    try {
      if (deletePhotos) await this.deleteFilePhotos(eventId, file, deletePhotos)
      this.removeFile(eventId, fileId)
      return true
    } finally {
      this.updateFile(eventId, fileId, { isRemoving: false })
    }
  }
}
