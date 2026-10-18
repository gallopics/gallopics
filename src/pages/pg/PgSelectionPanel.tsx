import { useEffect, useMemo, useState } from "react"
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  HelpCircle,
  Info,
  MoreVertical,
  Pencil,
  Plus,
  Save,
  Slash,
  Trash2,
  X,
} from "lucide-react"

import { notify, type NotifyType } from "@/lib/notify"
import { cn } from "@/lib/utils"
import { usePhotographer, type Photo } from "@/context/PhotographerContext"
import { TOAST_TOKENS } from "@/context/ToastTokens"
import { fetchClassSectionStarts } from "@/data/eventsApi"
import { HORSES, RIDERS } from "@/data/mockData"
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
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { ConfirmDialog } from "@/components/ConfirmDialog"
import { ModernDropdown } from "@/components/ModernDropdown"

export type PanelToastType = "success" | "moved" | "warning" | "danger"

const PANEL_TOAST_TYPES: Record<PanelToastType, NotifyType> = {
  success: "success",
  moved: "success",
  warning: "info",
  danger: "error",
}

interface PgSelectionPanelProps {
  isOpen: boolean
  selectedIds: Set<string>
  allPhotos: Photo[]
  onClose: () => void
  activeTab?: "tags" | "price"
  currentTab?: "uploads" | "published" | "archive"
  onShowToast?: (msg: string, type: PanelToastType, onUndo?: () => void) => void
}

const BATCHES = ["Random", "Misc", "Uncategorised"]

const BUNDLES = {
  basic: { web: 499, high: 999, commercial: 1500, label: "Basic" },
  standard: { web: 499, high: 999, commercial: 1500, label: "Standard" },
  premium: { web: 499, high: 999, commercial: 1500, label: "Premium" },
}

export function PgSelectionPanel({
  isOpen,
  selectedIds,
  allPhotos,
  onClose: propsOnClose,
  activeTab: activeTabProp,
  currentTab,
  onShowToast,
}: PgSelectionPanelProps) {
  const { updatePhotoMetadata, deletePhotos, restorePhotos } = usePhotographer()

  // Derived Selection
  const selectedPhotos = useMemo(() => {
    return allPhotos.filter((p) => selectedIds.has(p.id))
  }, [selectedIds, allPhotos])

  const isSingle = selectedPhotos.length === 1
  const count = selectedPhotos.length
  const firstPhoto = selectedPhotos[0]

  // State for Edits (Tags)
  const [rider, setRider] = useState<string>("")
  const [horse, setHorse] = useState<string>("")
  const [cls, setCls] = useState<string>("")
  const [isGeneric, setIsGeneric] = useState(false)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [viewMode, setViewMode] = useState<"edit" | "summary">("edit")
  const [editFromSummary, setEditFromSummary] = useState(false)

  // State for Edits (Price)
  const [priceBundle, setPriceBundle] = useState<
    "basic" | "standard" | "premium" | "custom"
  >("standard")
  const [customPriceWeb, setCustomPriceWeb] = useState<string>("")
  const [customPriceHigh, setCustomPriceHigh] = useState<string>("")
  const [customPriceCommercial, setCustomPriceCommercial] = useState<string>("")

  // Panel Tab State
  const [panelTab, setPanelTab] = useState<"tags" | "price">("tags")

  // Info Panel State
  const [isInfoOpen, setIsInfoOpen] = useState(false)

  // Original State for dirty check (stores VALUES for price)
  const [originalState, setOriginalState] = useState<{
    rider: string
    horse: string
    cls: string
    isGeneric: boolean
    title: string
    description: string
    priceWeb: number
    priceHigh: number
    priceCommercial: number
    priceBundle: string
  } | null>(null)

  // Modal State
  const [isMoveModalOpen, setIsMoveModalOpen] = useState(false)
  const [targetBatch, setTargetBatch] = useState<string>("")
  const [isCreatingBatch, setIsCreatingBatch] = useState(false)
  const [newBatchName, setNewBatchName] = useState("")
  const [classStarts, setClassStarts] = useState<
    Array<{ riderName?: string | null; horseName?: string | null }>
  >([])

  // Confirmation Modals State
  const [confirmModal, setConfirmModal] = useState<{
    type: "delete" | "close"
    isOpen: boolean
  }>({ type: "close", isOpen: false })

  const selectedClassId = useMemo(() => {
    const ids = new Set(
      selectedPhotos
        .map((photo) => photo.classId)
        .filter((value): value is string => Boolean(value))
    )
    return ids.size === 1 ? Array.from(ids)[0] : ""
  }, [selectedPhotos])

  useEffect(() => {
    let cancelled = false
    setClassStarts([])

    if (!isOpen || !selectedClassId) return

    fetchClassSectionStarts(selectedClassId)
      .then((starts) => {
        if (cancelled) return
        setClassStarts(
          starts.map((start) => ({
            riderName: start.rider_name,
            horseName: start.horse_name,
          }))
        )
      })
      .catch(() => {
        if (!cancelled) setClassStarts([])
      })

    return () => {
      cancelled = true
    }
  }, [isOpen, selectedClassId])

  const riderOptions = useMemo(() => {
    const names = new Set<string>()
    classStarts.forEach((start) => {
      if (start.riderName) names.add(start.riderName)
    })
    selectedPhotos.forEach((photo) => {
      if (photo.rider && photo.rider !== "None") names.add(photo.rider)
    })

    if (names.size === 0) {
      RIDERS.forEach((rider) =>
        names.add(`${rider.firstName} ${rider.lastName}`)
      )
    }

    return Array.from(names)
      .sort((a, b) => a.localeCompare(b))
      .map((name) => ({ label: name, value: name }))
  }, [classStarts, selectedPhotos])

  const horseOptions = useMemo(() => {
    const names = new Set<string>()
    classStarts.forEach((start) => {
      if (start.horseName) names.add(start.horseName)
    })
    selectedPhotos.forEach((photo) => {
      if (photo.horse && photo.horse !== "None") names.add(photo.horse)
    })

    if (names.size === 0) {
      HORSES.forEach((horse) => names.add(horse.name))
    }

    return Array.from(names)
      .sort((a, b) => a.localeCompare(b))
      .map((name) => ({ label: name, value: name }))
  }, [classStarts, selectedPhotos])

  // Toasts: "global" ones go to the parent when it handles them
  const triggerToast = (
    msg: string,
    type: PanelToastType,
    _context: "global" | "panel",
    undo?: () => void
  ) => {
    if (_context === "global" && onShowToast) {
      onShowToast(msg, type, undo)
      return
    }
    notify(msg, PANEL_TOAST_TYPES[type], undo)
  }

  // Helper to get effective current price based on selection
  const getEffectivePrice = () => {
    if (priceBundle === "custom") {
      return {
        web: Number(customPriceWeb) || 0,
        high: Number(customPriceHigh) || 0,
        commercial: Number(customPriceCommercial) || 0,
      }
    } else {
      const b = BUNDLES[priceBundle]
      return {
        web: b.web,
        high: b.high,
        commercial: b.commercial,
      }
    }
  }

  // Sync State on Selection Change
  useEffect(() => {
    if (isOpen && activeTabProp) {
      setPanelTab(activeTabProp)
    }
  }, [isOpen, activeTabProp])

  useEffect(() => {
    if (selectedPhotos.length > 0) {
      const p = selectedPhotos[0]
      const inMissingBucket = !p.batch || p.batch === "Uncategorised"

      // Metadata State
      const displayTitle = /^Photo \d+$/.test(p.title || "")
        ? ""
        : p.title || ""

      // Price State (Multi: take first)
      const pWeb = p.priceStandard || 499
      const pHigh = p.priceHigh || 999
      const pComm = p.priceCommercial || 1500

      let bundle: "basic" | "standard" | "premium" | "custom" = "custom"
      if (
        pWeb === BUNDLES.basic.web &&
        pHigh === BUNDLES.basic.high &&
        pComm === BUNDLES.basic.commercial
      )
        bundle = "basic"
      else if (
        pWeb === BUNDLES.standard.web &&
        pHigh === BUNDLES.standard.high &&
        pComm === BUNDLES.standard.commercial
      )
        bundle = "standard"
      else if (
        pWeb === BUNDLES.premium.web &&
        pHigh === BUNDLES.premium.high &&
        pComm === BUNDLES.premium.commercial
      )
        bundle = "premium"

      // Special case logic for Multi selection:
      if (selectedPhotos.length > 1) {
        setRider("")
        setHorse("")
        setCls("")
        setIsGeneric(false)
        setTitle("")
        setDescription("")

        setPriceBundle(bundle)
        // If custom bundle, pre-fill custom inputs. If standard bundle, empty.
        if (bundle === "custom") {
          setCustomPriceWeb(pWeb.toString())
          setCustomPriceHigh(pHigh.toString())
          setCustomPriceCommercial(pComm.toString())
        } else {
          setCustomPriceWeb("")
          setCustomPriceHigh("")
          setCustomPriceCommercial("")
        }

        setOriginalState({
          rider: "",
          horse: "",
          cls: "",
          isGeneric: false,
          title: "",
          description: "",
          priceWeb: pWeb,
          priceHigh: pHigh,
          priceCommercial: pComm,
          priceBundle: bundle,
        })
        setViewMode("edit")
      } else {
        // Single
        setRider(p.rider || (inMissingBucket ? "None" : ""))
        setHorse(p.horse || (inMissingBucket ? "None" : ""))
        setCls(p.className || (inMissingBucket ? "None" : ""))
        setIsGeneric(p.isGeneric || false)
        setTitle(displayTitle)
        setDescription(p.description || "")

        setPriceBundle(bundle)
        if (bundle === "custom") {
          setCustomPriceWeb(pWeb.toString())
          setCustomPriceHigh(pHigh.toString())
          setCustomPriceCommercial(pComm.toString())
        } else {
          setCustomPriceWeb("")
          setCustomPriceHigh("")
          setCustomPriceCommercial("")
        }

        setOriginalState({
          rider: p.rider || (inMissingBucket ? "None" : ""),
          horse: p.horse || (inMissingBucket ? "None" : ""),
          cls: p.className || (inMissingBucket ? "None" : ""),
          isGeneric: p.isGeneric || false,
          title: displayTitle,
          description: p.description || "",
          priceWeb: pWeb,
          priceHigh: pHigh,
          priceCommercial: pComm,
          priceBundle: bundle,
        })

        if (p.isGeneric && (displayTitle || p.description)) {
          setViewMode("summary")
        } else {
          setViewMode("edit")
        }
      }
    }
  }, [selectedPhotos])

  // Computed Dirty
  const [touched, setTouched] = useState(false)

  const isDirty = useMemo(() => {
    if (!originalState) return false

    // Price check
    const currentPrice = getEffectivePrice()
    const priceDirty =
      priceBundle !== originalState.priceBundle ||
      currentPrice.web !== originalState.priceWeb ||
      currentPrice.high !== originalState.priceHigh ||
      currentPrice.commercial !== originalState.priceCommercial

    // Tags and Mode check
    let tagsDirty = false
    let modeDirty = false

    if (isSingle) {
      tagsDirty =
        rider !== originalState.rider ||
        horse !== originalState.horse ||
        cls !== originalState.cls
      modeDirty = isGeneric !== originalState.isGeneric
      if (isGeneric) {
        // If currently generic, check title/description
        tagsDirty =
          tagsDirty ||
          title !== originalState.title ||
          description !== originalState.description
      }
    } else {
      // For multi-selection, we rely on the 'touched' state for tags.
      // If any tag field was edited, 'touched' would be true.
      // If the current values are different from the original (which would be empty for multi-edit), it's dirty.
      // This is a simplified check for multi-select tags.
      tagsDirty = touched && (!!rider || !!horse || !!cls || isGeneric)
    }

    return tagsDirty || modeDirty || priceDirty
  }, [
    rider,
    horse,
    cls,
    isGeneric,
    title,
    description,
    priceBundle,
    customPriceWeb,
    customPriceHigh,
    customPriceCommercial,
    originalState,
    isSingle,
    touched,
    description,
  ])

  // Handlers
  const handleChange = (field: string, value: string) => {
    setTouched(true)
    if (field === "rider") setRider(value)
    if (field === "horse") setHorse(value)
    if (field === "cls") setCls(value)
    if (field === "title") setTitle(value)
    if (field === "description") setDescription(value)

    if (field === "customPriceWeb") {
      setCustomPriceWeb(value)
      setCustomPriceHigh(value)
      setCustomPriceCommercial(value)
      setPriceBundle("custom")
    }
  }

  const handleBundleSelect = (
    bundle: "basic" | "standard" | "premium" | "custom"
  ) => {
    setTouched(true)
    setPriceBundle(bundle)
    // Do NOT overwrite custom inputs from bundle values
  }

  const enterEditMode = () => {
    setViewMode("edit")
    setEditFromSummary(true)
  }

  const onCloseSafe = () => {
    if (isDirty) {
      setConfirmModal({ type: "close", isOpen: true })
    } else {
      propsOnClose()
    }
  }

  const confirmCloseDiscard = () => {
    setTouched(false)
    setConfirmModal({ type: "close", isOpen: false })
    propsOnClose()
  }

  const handleSave = async () => {
    const ids = selectedPhotos.map((p) => p.id)
    const prevMetadata = selectedPhotos.map((p) => ({
      id: p.id,
      rider: p.rider,
      horse: p.horse,
      className: p.className,
      isGeneric: p.isGeneric,
      title: p.title,
      description: (p as any).description,
      priceStandard: p.priceStandard,
      priceHigh: p.priceHigh,
      priceCommercial: p.priceCommercial,
    }))

    const updates: Partial<Photo> & {
      description?: string
      isGeneric?: boolean
    } = {}

    // Tag Updates
    if (isSingle) {
      updates.rider = rider === "None" ? "" : rider
      updates.horse = horse === "None" ? "" : horse
      updates.className = cls === "None" ? "" : cls
      updates.isGeneric = isGeneric
      if (isGeneric) {
        updates.title = title
        updates.description = description
      }
    } else {
      if (rider) updates.rider = rider === "None" ? "" : rider
      if (horse) updates.horse = horse === "None" ? "" : horse
      if (cls) updates.className = cls === "None" ? "" : cls
      if (isGeneric) {
        updates.isGeneric = true
        updates.rider = ""
        updates.horse = ""
        updates.className = ""
      }
    }

    // Price Updates
    const finalPrice = getEffectivePrice()
    updates.priceStandard = finalPrice.web
    updates.priceHigh = finalPrice.high
    updates.priceCommercial = finalPrice.commercial

    const restorePrevious = () => {
      prevMetadata.forEach((meta) => {
        void updatePhotoMetadata([meta.id], {
          rider: meta.rider,
          horse: meta.horse,
          className: meta.className,
          isGeneric: meta.isGeneric,
          title: meta.title || "",
          description: meta.description || "",
          priceStandard: meta.priceStandard,
          priceHigh: meta.priceHigh,
          priceCommercial: meta.priceCommercial,
        }).catch(() => undefined)
      })
    }

    try {
      await updatePhotoMetadata(ids, updates)
      triggerToast("Changes saved", "success", "panel", restorePrevious)
    } catch {
      restorePrevious()
      triggerToast("Unable to save changes", "danger", "panel")
      return
    }

    setOriginalState({
      rider,
      horse,
      cls,
      isGeneric,
      title,
      description,
      priceWeb: finalPrice.web,
      priceHigh: finalPrice.high,
      priceCommercial: finalPrice.commercial,
      priceBundle,
    })
    setTouched(false)

    if (isSingle && isGeneric && (title || description)) {
      setViewMode("summary")
    }
    setEditFromSummary(false)
  }

  const handleCancel = () => {
    if (originalState) {
      setRider(originalState.rider)
      setHorse(originalState.horse)
      setCls(originalState.cls)
      setIsGeneric(originalState.isGeneric)
      setTitle(originalState.title)
      setDescription(originalState.description)

      // Re-calc bundle from original state
      const pWeb = originalState.priceWeb
      const pHigh = originalState.priceHigh
      const pComm = originalState.priceCommercial

      let bundle: "basic" | "standard" | "premium" | "custom" = "custom"
      if (
        pWeb === BUNDLES.basic.web &&
        pHigh === BUNDLES.basic.high &&
        pComm === BUNDLES.basic.commercial
      )
        bundle = "basic"
      else if (
        pWeb === BUNDLES.standard.web &&
        pHigh === BUNDLES.standard.high &&
        pComm === BUNDLES.standard.commercial
      )
        bundle = "standard"
      else if (
        pWeb === BUNDLES.premium.web &&
        pHigh === BUNDLES.premium.high &&
        pComm === BUNDLES.premium.commercial
      )
        bundle = "premium"

      setPriceBundle(bundle)
      if (bundle === "custom") {
        setCustomPriceWeb(pWeb.toString())
        setCustomPriceHigh(pHigh.toString())
        setCustomPriceCommercial(pComm.toString())
      } else {
        setCustomPriceWeb("")
        setCustomPriceHigh("")
        setCustomPriceCommercial("")
      }
      // Ensure inputs are reset if we were in custom mode editing but then cancelled to a bundle?
      // "If user typed custom values, switching away... preserve custom values internally... switching back restores".
      // If I Cancel, I should restore the *Saved* state.
      // My implementation clears custom inputs if restored state is Bundle. Correct.
      // If restored state was Custom, it restores custom inputs. Correct.

      setTouched(false)
      if (
        originalState.isGeneric &&
        (originalState.title || originalState.description)
      ) {
        setViewMode("summary")
      } else {
        setViewMode("edit")
      }
      setEditFromSummary(false)
    }
  }

  const handleDeleteInit = () => {
    setConfirmModal({ type: "delete", isOpen: true })
  }

  const confirmDelete = () => {
    const ids = selectedPhotos.map((p) => p.id)
    const undoSnapshot = [...selectedPhotos]

    deletePhotos(ids)
    setConfirmModal({ type: "delete", isOpen: false })
    propsOnClose()

    triggerToast("Photo deleted", TOAST_TOKENS.DELETE.type, "global", () => {
      restorePhotos(undoSnapshot)
      triggerToast("Delete undone", "moved", "global")
    })
  }

  const handleMoveInit = () => {
    setIsMoveModalOpen(true)
    setTargetBatch("")
    setIsCreatingBatch(false)
  }

  const handleMoveConfirm = () => {
    const finalBatch = isCreatingBatch ? newBatchName : targetBatch
    if (!finalBatch) return

    const ids = selectedPhotos.map((p) => p.id)
    const prevMetadata = selectedPhotos.map((p) => ({
      id: p.id,
      batch: p.batch || "Uncategorised",
      storedLocation: p.storedLocation,
    }))

    updatePhotoMetadata(ids, {
      batch: finalBatch,
      storedLocation: (["Random", "Misc", "Uncategorised"].includes(finalBatch)
        ? finalBatch
        : "Misc") as any,
    })

    const undoAction = () => {
      const batches = new Set(prevMetadata.map((p) => p.batch))
      batches.forEach((b) => {
        const idsForBatch = prevMetadata
          .filter((p) => p.batch === b)
          .map((p) => p.id)
        const loc = (
          ["Random", "Misc", "Uncategorised"].includes(b) ? b : "Misc"
        ) as any
        updatePhotoMetadata(idsForBatch, {
          batch: b === "Uncategorised" ? "" : b,
          storedLocation: loc,
        })
      })
      triggerToast("Move undone", "moved", "global")
    }

    triggerToast(
      `Moved ${isSingle ? "photo" : `${count} photos`} to ${finalBatch}`,
      "moved",
      "global",
      undoAction
    )

    setIsMoveModalOpen(false)
    propsOnClose()
  }

  const currentBatch = useMemo(() => {
    if (selectedPhotos.length === 0) return null
    const first = selectedPhotos[0].batch || "Uncategorised"
    const allMatch = selectedPhotos.every(
      (p) => (p.batch || "Uncategorised") === first
    )
    return allMatch ? first : null
  }, [selectedPhotos])

  const confirmCopy = {
    delete: {
      title: "Delete photo?",
      description:
        "This will remove the photo from this event. You can undo right after deleting.",
      label: "Delete",
      tone: "danger",
      onConfirm: confirmDelete,
    },
    close: {
      title: "Discard changes?",
      description:
        "You have unsaved changes. Are you sure you want to discard them?",
      label: "Discard",
      tone: "danger",
      onConfirm: confirmCloseDiscard,
    },
  } as const
  const confirm = confirmCopy[confirmModal.type]

  return (
    <>
      <aside
        aria-label="Selection details"
        inert={!isOpen}
        className={cn(
          "fixed inset-y-0 right-0 z-50 flex w-100 max-w-full flex-col bg-card shadow-[-4px_0_24px_rgba(0,0,0,0.12)] transition-transform duration-300 ease-[cubic-bezier(0.2,0,0.2,1)]",
          isOpen ? "translate-x-0" : "translate-x-[110%]"
        )}
      >
        <PanelHeader title="Selection details" onClose={onCloseSafe} />

        <div className="relative flex-1 overflow-y-auto p-6 leading-[1.3]">
          {!isSingle && count > 0 && (
            <div className="mb-8">
              <SectionLabel>Multiple selection ({count})</SectionLabel>
            </div>
          )}

          {isSingle && firstPhoto && (
            <div className="mb-4 flex items-start gap-4">
              <img
                src={firstPhoto.url}
                alt=""
                className="size-20 rounded-lg bg-muted object-cover"
              />
              <div className="min-w-0 flex-1">
                <div
                  className="mb-1 truncate text-sm font-semibold text-foreground"
                  title={firstPhoto.fileName}
                >
                  {firstPhoto.fileName}
                </div>
                <div className="mb-2 inline-block rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-muted-foreground">
                  {firstPhoto.photoCode || firstPhoto.id}
                </div>
                <div className="flex items-center gap-1.5 text-[0.8125rem] text-muted-foreground">
                  <Clock className="size-3.5" />
                  <span>
                    {firstPhoto.uploadDate} • {firstPhoto.timestamp}
                  </span>
                </div>
              </div>
            </div>
          )}

          {(isSingle || count > 0) && (
            <div className="mb-8">
              <Tabs
                value={panelTab}
                onValueChange={(next) => setPanelTab(next as "tags" | "price")}
              >
                <TabsList variant="line" className="mb-6 gap-4">
                  <TabsTrigger value="tags" className={compactTab}>
                    Tags
                  </TabsTrigger>
                  <TabsTrigger value="price" className={compactTab}>
                    Price
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              {panelTab === "tags" && (
                <>
                  {/* develop: "Refresh tags" button removed */}
                  <div className="mb-3 flex items-center justify-between">
                    <SectionLabel>What do you see in the image</SectionLabel>
                  </div>

                  {viewMode === "edit" ? (
                    <>
                      {!isGeneric ? (
                        <>
                          <FormGroup label="Rider">
                            <ModernDropdown
                              showSearch
                              value={rider}
                              onChange={(val) => handleChange("rider", val)}
                              options={[
                                { label: "None", value: "None" },
                                ...riderOptions,
                              ]}
                              placeholder={
                                isSingle
                                  ? "Select Rider..."
                                  : rider
                                    ? "Mixed (Overwriting)"
                                    : "Mixed (Keep existing)"
                              }
                              className={selectClass}
                            />
                          </FormGroup>

                          <FormGroup label="Horse">
                            <ModernDropdown
                              showSearch
                              value={horse}
                              onChange={(val) => handleChange("horse", val)}
                              options={[
                                { label: "None", value: "None" },
                                ...horseOptions,
                              ]}
                              placeholder={
                                isSingle
                                  ? "Select Horse..."
                                  : "Mixed (Keep existing)"
                              }
                              className={selectClass}
                            />
                          </FormGroup>

                          <FormGroup label="Class">
                            {/* develop: class comes from Equipe and is read-only */}
                            <div className="w-full rounded-lg border bg-muted px-3 py-2 text-[15px] text-foreground">
                              {cls && cls !== "None"
                                ? cls
                                : "No class selected"}
                            </div>
                          </FormGroup>
                        </>
                      ) : (
                        <div className="mb-6 py-3 text-xs text-muted-foreground/60 italic">
                          No rider, horse, or class info.
                        </div>
                      )}

                      {/* develop: the "generic photo" checkbox and OR divider are hidden */}
                      {isGeneric && (
                        <div className="mt-4 rounded-lg bg-muted p-4">
                          <FormGroup label="Title">
                            <Input
                              className="h-10"
                              value={title}
                              onChange={(e) =>
                                handleChange("title", e.target.value)
                              }
                              maxLength={20}
                              placeholder="Pricing ceremony"
                            />
                          </FormGroup>
                          <FormGroup label="Description" className="mb-0">
                            <Textarea
                              className="min-h-20"
                              value={description}
                              onChange={(e) =>
                                handleChange("description", e.target.value)
                              }
                              maxLength={30}
                              rows={2}
                            />
                          </FormGroup>
                        </div>
                      )}
                    </>
                  ) : (
                    /* Summary mode (saved generic photo) */
                    <div className="mt-4 rounded-lg bg-muted p-4">
                      <div className="mb-2 flex items-start justify-between">
                        <SectionLabel className="text-muted-foreground">
                          Generic photo
                        </SectionLabel>
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          onClick={enterEditMode}
                          title="Edit"
                          aria-label="Edit"
                          className="text-muted-foreground/60 hover:bg-transparent"
                        >
                          <Pencil className="size-3.5" />
                        </Button>
                      </div>
                      {title && (
                        <div className="mb-1 text-sm font-medium text-foreground">
                          {title}
                        </div>
                      )}
                      {description && (
                        <div className="text-[0.8125rem] leading-[1.4] text-muted-foreground">
                          {description}
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}

              {panelTab === "price" && (
                <div>
                  <div className="mb-3 flex items-center justify-between">
                    <SectionLabel>Pricing bundle</SectionLabel>
                    <RoundIconButton
                      onClick={() => setIsInfoOpen(!isInfoOpen)}
                      title="Pricing Info"
                      aria-label="Pricing info"
                    >
                      <Info />
                    </RoundIconButton>
                  </div>

                  <div
                    role="radiogroup"
                    aria-label="Pricing bundle"
                    className="mb-6 flex flex-col gap-3"
                  >
                    {(Object.keys(BUNDLES) as Array<keyof typeof BUNDLES>).map(
                      (key) => {
                        const b = BUNDLES[key]
                        const isSelected = priceBundle === key
                        const info = {
                          basic: {
                            subtitle: "Web quality",
                            support: "Best for social media and screen use.",
                            primaryPrice: b.web,
                          },
                          standard: {
                            subtitle: "High quality",
                            support: "Best for printing and large displays.",
                            primaryPrice: b.high,
                          },
                          premium: {
                            subtitle: "Commercial use",
                            support: "Best for printing and large displays.",
                            primaryPrice: b.commercial,
                          },
                        }[key]

                        return (
                          <BundleOption
                            key={key}
                            selected={isSelected}
                            onSelect={() => handleBundleSelect(key)}
                            className={cn(
                              "relative overflow-hidden py-3 pr-3 pl-4",
                              isSelected && BUNDLE_COLORS[key].selected
                            )}
                          >
                            {/* Left accent bar */}
                            <div
                              className={cn(
                                "absolute inset-y-0 left-0 w-1",
                                BUNDLE_COLORS[key].bar
                              )}
                            />
                            <RadioDot selected={isSelected} />
                            <div className="flex-1">
                              <div className="mb-0.5 flex items-baseline justify-between">
                                <div className="text-[0.8125rem] font-medium text-foreground">
                                  {b.label}
                                </div>
                                <div className="text-[0.8125rem] text-muted-foreground">
                                  {info.primaryPrice} SEK
                                </div>
                              </div>
                              <div className="mb-0.5 text-xs text-muted-foreground">
                                {info.subtitle}
                              </div>
                              <div className="text-xs leading-[1.4] text-muted-foreground">
                                {info.support}
                              </div>
                            </div>
                          </BundleOption>
                        )
                      }
                    )}

                    <BundleOption
                      selected={priceBundle === "custom"}
                      onSelect={() => handleBundleSelect("custom")}
                      className={cn(
                        "flex-col gap-0 p-3",
                        priceBundle === "custom" &&
                          "border-[#facc15] bg-[#fef9c3]"
                      )}
                    >
                      <div className="flex w-full items-start gap-3">
                        <RadioDot
                          selected={priceBundle === "custom"}
                          className={
                            priceBundle === "custom"
                              ? "border-[#facc15] *:bg-[#facc15]"
                              : undefined
                          }
                        />
                        <div className="flex-1">
                          <div className="text-[0.8125rem] font-medium text-foreground">
                            Custom
                          </div>
                          {priceBundle !== "custom" && (
                            <div className="text-xs text-muted-foreground">
                              Set your own price for all levels
                            </div>
                          )}
                        </div>
                      </div>
                      {priceBundle === "custom" && (
                        <div className="mt-3 ml-7">
                          <div className="mb-1 text-xs text-muted-foreground">
                            Price (SEK)
                          </div>
                          <Input
                            className="h-10 w-1/2"
                            type="text"
                            inputMode="numeric"
                            value={customPriceWeb}
                            onChange={(e) => {
                              const val = e.target.value.replace(/[^0-9]/g, "")
                              handleChange("customPriceWeb", val)
                            }}
                            placeholder="0"
                          />
                        </div>
                      )}
                    </BundleOption>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          className={cn(
            "flex shrink-0 items-center justify-between gap-3 border-t border-muted px-6 py-4",
            (isDirty || editFromSummary) && "justify-end"
          )}
        >
          {isDirty || editFromSummary ? (
            <>
              <Button
                variant="outline"
                size="md"
                className={panelSecondary}
                onClick={handleCancel}
              >
                <Slash /> Cancel
              </Button>
              <Button size="md" className="min-w-25" onClick={handleSave}>
                <Save /> Save changes
              </Button>
            </>
          ) : (
            <>
              {/* develop: Publish / Unpublish removed */}
              <div className="flex gap-2">
                {currentTab !== "published" && (
                  <Button
                    variant="outline"
                    size="icon"
                    className={cn(
                      panelSecondary,
                      "size-10 min-w-0 hover:text-destructive"
                    )}
                    title="Delete"
                    aria-label="Delete"
                    onClick={handleDeleteInit}
                  >
                    <Trash2 className="size-4.5" />
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="icon"
                  className={cn(panelSecondary, "size-10 min-w-0")}
                  title="Move to..."
                  aria-label="Move to..."
                  onClick={handleMoveInit}
                >
                  <MoreVertical className="size-4.5" />
                </Button>
              </div>
            </>
          )}
        </div>

        {/* Info overlay (covers the whole panel) */}
        {isInfoOpen && (
          <div className="absolute inset-0 z-10 flex animate-in flex-col bg-card duration-200 fade-in-0">
            <PanelHeader
              title="Info"
              onClose={onCloseSafe}
              onBack={() => setIsInfoOpen(false)}
            />

            <div className="flex-1 overflow-y-auto p-6 leading-[1.3]">
              <div className="mb-6">
                <div className="mb-4 text-sm font-semibold text-foreground">
                  Quality info
                </div>
                <div className="flex flex-col gap-4">
                  {[
                    ["Web quality", "Best for screen and social media."],
                    ["High quality", "Best for print and large displays."],
                    ["Commercial use", "Best for print and large displays."],
                  ].map(([name, text]) => (
                    <div key={name}>
                      <div className="mb-0.5 text-sm font-medium text-foreground">
                        {name}
                      </div>
                      <div className="text-[0.8125rem] text-muted-foreground">
                        {text}
                      </div>
                    </div>
                  ))}
                  <div className="text-xs leading-normal text-muted-foreground/70">
                    Gallopics automatically delivers the right resolution—no
                    extra prep needed.
                  </div>
                </div>
              </div>

              <div className="mb-6 border-b border-muted" />

              <div className="mb-6">
                <div className="mb-4 text-sm font-semibold text-foreground">
                  Earnings split
                </div>
                <div className="flex flex-col gap-2">
                  {[
                    ["Photographer", "75%"],
                    ["Gallopics", "15%"],
                    ["Organiser", "10%"],
                  ].map(([name, share]) => (
                    <div key={name} className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{name}</span>
                      <span className="font-semibold text-foreground">
                        {share}
                      </span>
                    </div>
                  ))}
                  <div className="mt-2 text-[0.8125rem] leading-normal text-muted-foreground/70">
                    Taxes depend on your status (freelancer vs business).
                    Receipts are generated automatically.
                  </div>
                </div>
              </div>

              <div className="mb-6 border-b border-muted" />

              <div className="flex flex-col gap-3">
                {[
                  { label: "Terms of Service", Icon: ChevronRight },
                  { label: "Privacy Policy", Icon: ChevronRight },
                  { label: "FAQ", Icon: HelpCircle },
                ].map(({ label, Icon }) => (
                  <a
                    key={label}
                    href="#"
                    className="flex items-center justify-between py-1 text-[0.8125rem] text-foreground transition-colors hover:text-primary"
                  >
                    {label} <Icon className="size-3.75 text-border" />
                  </a>
                ))}
              </div>
            </div>
          </div>
        )}
      </aside>

      <Dialog
        open={isMoveModalOpen}
        onOpenChange={(open) => {
          if (!open) setIsMoveModalOpen(false)
        }}
      >
        <DialogContent className="sm:max-w-100">
          <DialogHeader>
            <DialogTitle>Move to other folder</DialogTitle>
          </DialogHeader>
          <DialogBody>
            {!isCreatingBatch ? (
              <FormGroup label="Select Folder" className="mb-0">
                <ModernDropdown
                  value={targetBatch}
                  onChange={(val) => {
                    if (val === NEW_FOLDER) {
                      setIsCreatingBatch(true)
                      setTargetBatch("")
                    } else {
                      setTargetBatch(val)
                    }
                  }}
                  options={[
                    ...BATCHES.map((b) => ({
                      label: b,
                      value: b,
                      disabled: b === currentBatch,
                      subtext:
                        b === currentBatch ? "Current folder" : undefined,
                    })),
                    {
                      label: "Create new folder...",
                      value: NEW_FOLDER,
                      icon: <Plus className="size-3.5 text-primary" />,
                    },
                  ]}
                  placeholder="Select folder..."
                />
              </FormGroup>
            ) : (
              <FormGroup label="New Folder Name" className="mb-0">
                <div className="flex gap-2">
                  <Input
                    placeholder="Enter name..."
                    value={newBatchName}
                    onChange={(e) => setNewBatchName(e.target.value)}
                    autoFocus
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    className={cn(panelSecondary, "min-w-0")}
                    aria-label="Back to folder list"
                    onClick={() => setIsCreatingBatch(false)}
                  >
                    <X />
                  </Button>
                </div>
              </FormGroup>
            )}
          </DialogBody>
          <DialogFooter>
            <DialogCancel />
            <Button
              onClick={handleMoveConfirm}
              disabled={!isCreatingBatch ? !targetBatch : !newBatchName}
            >
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={confirmModal.isOpen}
        onCancel={() => setConfirmModal({ ...confirmModal, isOpen: false })}
        onConfirm={confirm.onConfirm}
        title={confirm.title}
        description={confirm.description}
        confirmLabel={confirm.label}
        tone={confirm.tone}
      />
    </>
  )
}

const NEW_FOLDER = "__new__"

const BUNDLE_COLORS: Record<
  keyof typeof BUNDLES,
  { bar: string; selected: string }
> = {
  basic: {
    bar: "bg-muted-foreground",
    selected: "border-muted-foreground bg-muted",
  },
  standard: { bar: "bg-[#f97316]", selected: "border-[#f97316] bg-[#ffedd5]" },
  premium: { bar: "bg-[#a855f7]", selected: "border-[#a855f7] bg-[#f3e8ff]" },
}

// Old .pg-panel-btn.secondary: white, gray text, gray hover (no brand tint)
const panelSecondary = "min-w-25 text-muted-foreground"

const selectClass = "h-10 min-h-10 py-0 data-[size=default]:h-10"

// Old .pg-panel-compact-tab: smaller underline tabs
const compactTab =
  "group-data-[variant=line]/tabs-list:px-0 group-data-[variant=line]/tabs-list:py-2 group-data-[variant=line]/tabs-list:text-sm"

function PanelHeader({
  title,
  onClose,
  onBack,
}: {
  title: string
  onClose: () => void
  onBack?: () => void
}) {
  return (
    <div className="flex h-16 shrink-0 items-center justify-between border-b border-muted px-6">
      <div className="flex items-center gap-3">
        {onBack && (
          <Button
            variant="ghost"
            size="icon-sm"
            className="-ml-2 text-foreground"
            onClick={onBack}
            aria-label="Back"
          >
            <ChevronLeft className="size-5" />
          </Button>
        )}
        <span className="text-base font-semibold text-foreground">{title}</span>
      </div>
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={onClose}
        title="Close"
        aria-label="Close"
      >
        <X className="size-5" />
      </Button>
    </div>
  )
}

function SectionLabel({
  className,
  children,
}: {
  className?: string
  children: React.ReactNode
}) {
  return (
    <span
      className={cn(
        "text-[0.6875rem] leading-none font-semibold tracking-[0.06em] text-muted-foreground/70 uppercase",
        className
      )}
    >
      {children}
    </span>
  )
}

function FormGroup({
  label,
  className,
  children,
}: {
  label: string
  className?: string
  children: React.ReactNode
}) {
  return (
    <div className={cn("mb-5", className)}>
      <div className="mb-1.5 text-xs font-semibold text-muted-foreground">
        {label}
      </div>
      {children}
    </div>
  )
}

function RoundIconButton(props: React.ComponentProps<typeof Button>) {
  return (
    <Button
      variant="secondary"
      size="icon-xs"
      className="text-muted-foreground/70 [&_svg:not([class*='size-'])]:size-3.5"
      {...props}
    />
  )
}

function BundleOption({
  selected,
  onSelect,
  className,
  children,
}: {
  selected: boolean
  onSelect: () => void
  className?: string
  children: React.ReactNode
}) {
  return (
    <div
      role="radio"
      aria-checked={selected}
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.target !== e.currentTarget) return
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault()
          onSelect()
        }
      }}
      className={cn(
        "flex cursor-pointer items-start gap-3 rounded-lg border bg-card outline-none focus-visible:ring-4 focus-visible:ring-ring/12",
        className
      )}
    >
      {children}
    </div>
  )
}

function RadioDot({
  selected,
  className,
}: {
  selected: boolean
  className?: string
}) {
  return (
    <span
      className={cn(
        "mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full border bg-card",
        selected && "border-primary",
        className
      )}
    >
      {selected && <span className="size-2 rounded-full bg-primary" />}
    </span>
  )
}
