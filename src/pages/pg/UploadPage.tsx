import { useEffect, useMemo, useRef, useState } from "react"
import { useNavigate, useSearchParams } from "react-router"
import { CheckCircle, Trash2, UploadCloud, X } from "lucide-react"

import { notify } from "@/lib/notify"
import { cn } from "@/lib/utils"
import { usePhotographer } from "@/context/PhotographerContext"
import { useWorkspace } from "@/context/WorkspaceContext"
import { Button } from "@/components/ui/button"
import { ConfirmDialog } from "@/components/ConfirmDialog"

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export function UploadPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const {
    events,
    startUpload,
    uploadSessions,
    clearUploadSession,
    removeUploadFile,
    setCurrentUploadEventId,
  } = usePhotographer()
  const { basePath } = useWorkspace()

  // Local State
  const urlEventId = searchParams.get("eventId")
  const urlClassId = searchParams.get("classId")
  const urlEventClassId = searchParams.get("eventClassId")
  const urlEquipeClassSectionId = searchParams.get("equipeClassSectionId")
  const urlClassSectionId =
    searchParams.get("classSectionId") || searchParams.get("class_section_id")
  const urlClassName = searchParams.get("className")
  const urlArenaName = searchParams.get("arenaName")
  const [selectedEventId, setSelectedEventId] = useState<string>(
    urlEventId || ""
  )
  const [isDragActive, setIsDragActive] = useState(false)
  const [confirmClearOpen, setConfirmClearOpen] = useState(false)
  const [isClearing, setIsClearing] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const previewUrlsRef = useRef<Record<string, string>>({})

  // Initial Event Selection Logic
  useEffect(() => {
    if (!selectedEventId && events.length > 0) {
      const sorted = [...events].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      )
      const defaultEvent = sorted[0]
      if (defaultEvent) setSelectedEventId(defaultEvent.id)
    }
  }, [events, selectedEventId])

  // Sync Context whenever selectedEventId changes
  useEffect(() => {
    if (selectedEventId) {
      setSearchParams(
        (currentParams) => {
          const nextParams = new URLSearchParams(currentParams)
          nextParams.set("eventId", selectedEventId)
          return nextParams
        },
        { replace: true }
      )
      setCurrentUploadEventId(selectedEventId)
    }
  }, [selectedEventId, setSearchParams, setCurrentUploadEventId])

  // Derived Data
  const session = selectedEventId ? uploadSessions[selectedEventId] : null
  const files = session?.files || []
  const hasFiles = files.length > 0

  const previewUrls = useMemo(() => {
    const activeFileIds = new Set(files.map((file) => file.id))

    Object.entries(previewUrlsRef.current).forEach(([fileId, url]) => {
      if (!activeFileIds.has(fileId)) {
        URL.revokeObjectURL(url)
        delete previewUrlsRef.current[fileId]
      }
    })

    files.forEach((file) => {
      if (!previewUrlsRef.current[file.id]) {
        previewUrlsRef.current[file.id] = URL.createObjectURL(file.file)
      }
    })

    return previewUrlsRef.current
  }, [files])

  useEffect(() => {
    return () => {
      Object.values(previewUrlsRef.current).forEach((url) => {
        URL.revokeObjectURL(url)
      })
      previewUrlsRef.current = {}
    }
  }, [])

  const selectedEvent = events.find((event) => event.id === selectedEventId)
  const canUploadPhotos = selectedEvent?.canUploadPhotos !== false

  const selectedEventTitle = selectedEvent?.title || "Selected event"

  // Handlers
  const handleClose = () => {
    const from = searchParams.get("from")
    const urlEventId = searchParams.get("eventId")

    if (from === "event" && urlEventId) {
      // Explicitly go back to the event we came from
      navigate(`${basePath}/events/${urlEventId}`)
    } else if (from === "eventProfile" && urlEventId) {
      navigate(`/event/${urlEventId}`, {
        state: { from: "/pg/events", fromTab: "my" },
      })
    } else if (from === "sidebar") {
      // Usually means we came from "anywhere", so events list is a safe home
      navigate(`${basePath}/events`)
    } else if (window.history.length > 1) {
      // General fallback: standard back button behavior
      navigate(-1)
    } else {
      // Emergency fallback: events list
      navigate(`${basePath}/events`)
    }
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") setIsDragActive(true)
    else if (e.type === "dragleave") setIsDragActive(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragActive(false)
    if (!canUploadPhotos) return
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(Array.from(e.dataTransfer.files))
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!canUploadPhotos) return
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(Array.from(e.target.files))
    }
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  const handleFiles = (newFiles: File[]) => {
    if (!canUploadPhotos) return
    const validFiles = newFiles.filter((f) => f.type.startsWith("image/"))

    if (validFiles.length === 0) {
      notify("Please upload image files only.", "error")
      return
    }

    const urlClassIdIsInternal = urlClassId && UUID_PATTERN.test(urlClassId)
    const internalClassSectionId = urlClassIdIsInternal
      ? urlClassId
      : urlClassSectionId && UUID_PATTERN.test(urlClassSectionId)
        ? urlClassSectionId
        : undefined
    const equipeClassSectionId =
      urlEquipeClassSectionId ||
      (urlClassSectionId && !UUID_PATTERN.test(urlClassSectionId)
        ? urlClassSectionId
        : undefined)
    const eventClassId =
      urlEventClassId || (!urlClassIdIsInternal ? urlClassId : undefined)

    startUpload(validFiles, {
      classId: !urlClassIdIsInternal ? urlClassId || undefined : undefined,
      eventClassId: eventClassId || undefined,
      classSectionId: internalClassSectionId || undefined,
      equipeClassSectionId,
      className: urlClassName || undefined,
    })
  }

  const handleClearAll = () => {
    if (selectedEventId && hasFiles) {
      setConfirmClearOpen(true)
    }
  }

  const handleConfirmClear = async () => {
    if (!selectedEventId) return

    try {
      setIsClearing(true)
      await clearUploadSession(selectedEventId, { deleteUploaded: true })
      setConfirmClearOpen(false)
    } finally {
      setIsClearing(false)
    }
  }

  const handleViewPhotos = () => {
    if (!selectedEventId) return
    void clearUploadSession(selectedEventId)
    const params = new URLSearchParams()
    if (urlClassSectionId) params.set("classSectionId", urlClassSectionId)
    if (urlEquipeClassSectionId) {
      params.set("equipeClassSectionId", urlEquipeClassSectionId)
    }
    if (urlClassName) params.set("className", urlClassName)
    if (urlArenaName) params.set("arenaName", urlArenaName)

    const query = params.toString()
    navigate(`${basePath}/events/${selectedEventId}${query ? `?${query}` : ""}`)
  }

  return (
    <div className="fixed inset-0 z-40 flex flex-col overflow-hidden bg-secondary bg-[radial-gradient(at_0%_0%,--alpha(var(--primary)/5%)_0px,transparent_50%),radial-gradient(at_100%_0%,rgb(139_92_246/0.05)_0px,transparent_50%)]">
      <header className="z-10 flex h-18 shrink-0 items-center justify-between border-b border-black/5 bg-card/85 px-10 backdrop-blur-md max-md:px-4">
        <h1 className="text-lg font-bold text-foreground">Upload photos</h1>
        <Button
          variant="secondary"
          size="icon"
          className="size-9 hover:rotate-90"
          onClick={handleClose}
          aria-label="Close upload"
        >
          <X className="size-5" />
        </Button>
      </header>

      <div className="grid min-h-0 flex-1 grid-cols-[360px_1fr] max-[1000px]:grid-cols-1">
        {/* Sidebar: event context + drop zone */}
        <aside className="z-5 flex flex-col gap-8 overflow-y-auto border-r border-black/5 bg-card p-8 shadow-[10px_0_30px_rgba(0,0,0,0.02)] max-[1000px]:hidden">
          <div className="flex flex-col gap-5">
            <Eyebrow>Event Details</Eyebrow>

            {urlClassName && (
              <div className="rounded-xl border border-primary/16 bg-primary/8 p-3.5">
                <div className="mb-1 text-[0.6875rem] leading-[1.2] font-bold tracking-[0.06em] text-primary uppercase">
                  Class upload
                </div>
                <div className="text-[0.9375rem] leading-[1.35] font-bold text-foreground">
                  {urlClassName}
                </div>
                <div className="mt-1 text-xs leading-[1.4] text-muted-foreground">
                  {selectedEventTitle}
                  {urlArenaName ? ` • ${urlArenaName}` : ""}
                </div>
              </div>
            )}
          </div>

          <div className="mt-auto flex flex-col gap-5">
            <Eyebrow>Add Photos</Eyebrow>
            <button
              type="button"
              className={cn(
                "group/drop flex min-h-50 w-full cursor-pointer flex-col items-center justify-center rounded-3xl border border-dashed border-input bg-secondary p-8 shadow-[0_4px_6px_-1px_rgba(0,0,0,0.05)] transition-all duration-300 outline-none hover:-translate-y-0.5 hover:border-primary hover:bg-primary/8 hover:shadow-[0_12px_20px_-5px_rgba(0,0,0,0.06)] focus-visible:ring-4 focus-visible:ring-ring/12",
                isDragActive &&
                  "scale-[1.02] border-solid border-primary bg-primary/8"
              )}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => {
                if (canUploadPhotos) fileInputRef.current?.click()
              }}
              aria-disabled={!canUploadPhotos}
            >
              <span className="mb-5 flex size-16 items-center justify-center rounded-[20px] bg-primary/8 text-primary transition-transform duration-300 group-hover/drop:scale-110 group-hover/drop:rotate-5">
                <UploadCloud className="size-6" />
              </span>
              <span className="mt-4 text-lg font-bold text-foreground/80">
                {canUploadPhotos ? "Click or Drag photos" : "Uploads closed"}
              </span>
              <span className="mt-1.5 text-[0.6875rem] font-medium text-muted-foreground/50">
                {canUploadPhotos
                  ? "Upload multiple photos at once"
                  : "This event is read-only because the booking was cancelled."}
              </span>
            </button>
            <input
              type="file"
              multiple
              accept="image/*"
              ref={fileInputRef}
              className="hidden"
              onChange={handleFileSelect}
              disabled={!canUploadPhotos}
            />
          </div>
        </aside>

        {/* Main stage: upload queue */}
        <main className="relative min-h-0 overflow-hidden">
          <div className="h-full overflow-y-auto px-15 py-10 max-md:px-4">
            {hasFiles ? (
              <div className="mt-2 grid grid-cols-5 gap-5 pb-35 max-[1200px]:grid-cols-4 max-[1000px]:grid-cols-3">
                {files.map((item) => (
                  <div
                    key={item.id}
                    className="group/item relative aspect-square overflow-hidden rounded-md border border-black/5 bg-card shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md"
                  >
                    <img
                      src={previewUrls[item.id]}
                      alt={item.file.name}
                      className="size-full object-cover"
                    />
                    <div className="pointer-events-none absolute inset-0 flex flex-col justify-end bg-linear-to-t from-black/60 via-black/20 via-40% to-transparent p-3">
                      <div className="mb-1.5 truncate text-xs font-semibold text-white [text-shadow:0_1px_3px_rgba(0,0,0,0.5)]">
                        {item.file.name}
                      </div>
                      <div className="h-1 overflow-hidden rounded bg-white/30 backdrop-blur-xs">
                        <div
                          className={cn(
                            "h-full transition-[width] duration-300",
                            item.status === "failed"
                              ? "bg-destructive"
                              : "bg-primary"
                          )}
                          style={{ width: `${item.progress}%` }}
                        />
                      </div>
                      {item.status === "failed" && item.error && (
                        <div className="mt-1 text-xs leading-[1.3] text-destructive">
                          {item.error}
                        </div>
                      )}
                      {item.status === "completed" &&
                        (item.matchedRider || item.matchedHorse) && (
                          <div className="mt-1 text-xs leading-[1.3] text-white/70">
                            Matched{" "}
                            {[item.matchedRider, item.matchedHorse]
                              .filter(Boolean)
                              .join(" / ")}
                            {item.matchConfidence
                              ? ` (${item.matchConfidence})`
                              : ""}
                          </div>
                        )}
                    </div>

                    {item.status === "completed" ? (
                      <button
                        type="button"
                        className="group/check absolute top-2.5 right-2.5 z-2 flex size-7 items-center justify-center rounded-full bg-white shadow-[0_4px_12px_rgba(0,0,0,0.1)] transition-all duration-200 hover:scale-105 hover:bg-destructive/15"
                        onClick={(e) => {
                          e.stopPropagation()
                          if (selectedEventId) {
                            void removeUploadFile(selectedEventId, item.id)
                          }
                        }}
                        title="Remove uploaded photo"
                        aria-label="Remove uploaded photo"
                      >
                        <CheckCircle className="size-5 text-primary group-hover/check:text-destructive" />
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="absolute top-2 right-2 z-10 flex size-8 scale-90 items-center justify-center rounded-full bg-white/95 text-destructive opacity-0 shadow-[0_2px_8px_rgba(0,0,0,0.15)] transition-all duration-200 group-hover/item:scale-100 group-hover/item:opacity-100 hover:scale-110! hover:bg-destructive/15 focus-visible:opacity-100"
                        onClick={(e) => {
                          e.stopPropagation()
                          if (selectedEventId)
                            void removeUploadFile(selectedEventId, item.id)
                        }}
                        title="Remove photo"
                        aria-label="Remove photo"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex h-[60vh] flex-col items-center justify-center text-center text-muted-foreground/50">
                <div className="mb-6 flex size-25 items-center justify-center rounded-[32px] bg-secondary text-border">
                  <UploadCloud className="size-12" />
                </div>
                <h3 className="mb-2 text-lg font-bold text-foreground/85">
                  Your queue is empty
                </h3>
                <p className="max-w-80 text-sm leading-[1.6]">
                  {canUploadPhotos
                    ? "Select an event, then drag photos into the sidebar to start uploading."
                    : "This event is read-only because the booking was cancelled."}
                </p>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Floating action pill */}
      {hasFiles && (
        <div className="pointer-events-none fixed inset-x-4 bottom-4 z-50 flex justify-center">
          <div className="pointer-events-auto flex items-center gap-10 rounded-full border border-black/8 bg-card/90 py-2 pr-2 pl-6 shadow-[0_12px_32px_rgba(0,0,0,0.12),0_2px_8px_rgba(0,0,0,0.04)] backdrop-blur-lg">
            <span className="text-[0.8125rem] font-semibold tracking-[0.05em] text-foreground uppercase">
              {files.length} Item{files.length === 1 ? "" : "s"}
            </span>
            <div className="flex items-center gap-5">
              <Button
                variant="link"
                className="h-auto p-0 font-medium text-muted-foreground hover:text-foreground hover:no-underline"
                onClick={handleClearAll}
              >
                Clear all
              </Button>
              <Button className="px-9 font-bold" onClick={handleViewPhotos}>
                Done
              </Button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={confirmClearOpen}
        onCancel={() => setConfirmClearOpen(false)}
        onConfirm={handleConfirmClear}
        busy={isClearing}
        title="Clear all items?"
        description="This will remove all photos from the current queue. This action cannot be undone."
        confirmLabel={isClearing ? "Clearing..." : "Clear All"}
      />
    </div>
  )
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-1 text-[0.6875rem] font-semibold tracking-[0.06em] text-muted-foreground/70 uppercase">
      {children}
    </div>
  )
}
