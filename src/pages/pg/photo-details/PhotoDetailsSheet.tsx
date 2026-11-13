import { useId, useMemo, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { FolderInput, Save, Trash2 } from "lucide-react"

import { QUALITY_TIERS, type QualityTierId } from "@/constants/qualityTiers"
import { notify } from "@/lib/notify"
import { useDeletePhotosWithUndo } from "@/hooks/useDeletePhotosWithUndo"
import type { Photo } from "@/context/PhotographerContext"
import { classStartsQueryOptions } from "@/data/queries/events"
import { defaultPricesQueryOptions } from "@/data/queries/photographer"
import { Button } from "@/components/ui/button"
import { FieldError } from "@/components/ui/field"
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ConfirmDialog } from "@/components/ConfirmDialog"

import { PriceFields, TagFields } from "./DetailsFields"
import { MovePhotosDialog } from "./MovePhotosDialog"
import { PhotoHeader } from "./PhotoHeader"
import { PricingInfo } from "./PricingInfo"
import { useDetailsForm } from "./useDetailsForm"

type PanelTab = "tags" | "price"

interface PhotoDetailsSheetProps {
  isOpen: boolean
  selectedIds: Set<string>
  allPhotos: Photo[]
  onClose: () => void
  activeTab?: PanelTab
  onMoved?: () => void
}

/**
 * Edit tags and prices of the selected photos. Each opening starts a fresh
 * form; closing keeps it mounted for the slide-out.
 */
export function PhotoDetailsSheet(props: PhotoDetailsSheetProps) {
  const [session, setSession] = useState({ count: 0, open: props.isOpen })
  if (props.isOpen !== session.open) {
    setSession({
      count: session.count + (props.isOpen ? 1 : 0),
      open: props.isOpen,
    })
  }
  return <DetailsSheet key={session.count} {...props} />
}

function DetailsSheet({
  isOpen,
  selectedIds,
  allPhotos,
  onClose,
  activeTab,
  onMoved,
}: PhotoDetailsSheetProps) {
  const formId = useId()
  const photos = useMemo(
    () => allPhotos.filter((photo) => selectedIds.has(photo.id)),
    [allPhotos, selectedIds]
  )
  const [panelTab, setPanelTab] = useState<PanelTab>(activeTab ?? "tags")
  const { form, isSingle, isDirty, isSubmitting, result } = useDetailsForm(
    photos,
    // Only prices can be invalid
    () => setPanelTab("price")
  )
  const [infoOpen, setInfoOpen] = useState(false)
  const [moveOpen, setMoveOpen] = useState(false)
  const [confirmation, setConfirmation] = useState<"delete" | "close" | null>(
    null
  )
  const deletePhotos = useDeletePhotosWithUndo()
  const defaults = useQuery({ ...defaultPricesQueryOptions(), enabled: isOpen })
  const classIds = [
    ...new Set(photos.map((photo) => photo.classId).filter(Boolean)),
  ]
  const classId = classIds.length === 1 ? classIds[0]! : ""
  const starts = useQuery({
    ...classStartsQueryOptions(classId),
    enabled: isOpen && !!classId,
  })
  const classNames = new Set(photos.map((photo) => photo.className || ""))
  const className =
    classNames.size === 1 ? [...classNames][0] : isSingle ? "" : "Mixed"
  const defaultCounts = Object.fromEntries(
    QUALITY_TIERS.map(({ id }) => [
      id,
      photos.filter((photo) => photo.ownPrices?.[id] == null).length,
    ])
  ) as Record<QualityTierId, number>
  const close = () => {
    if (isSubmitting) return
    if (isDirty) setConfirmation("close")
    else onClose()
  }
  const discard = () => {
    setConfirmation(null)
    onClose()
  }
  const confirmDelete = () => {
    setConfirmation(null)
    onClose()
    deletePhotos(photos, "Photo deleted", () =>
      notify("Delete undone", "success")
    )
  }
  return (
    <Sheet
      open={isOpen}
      disablePointerDismissal
      onOpenChange={(next, details) => {
        if (!next) {
          if (isDirty || isSubmitting) details.cancel()
          close()
        }
      }}
    >
      <SheetContent className="max-w-full bg-card data-[side=right]:w-100">
        <SheetHeader className="h-16 py-0">
          <SheetTitle>Selection details</SheetTitle>
          <SheetDescription className="sr-only">
            Edit tags and prices for the selected photos.
          </SheetDescription>
        </SheetHeader>
        <SheetBody className="relative min-h-0 leading-[1.3]">
          {!isSingle && photos.length > 0 && (
            <div className="mb-8 text-[0.6875rem] font-semibold tracking-[0.06em] text-muted-foreground/70 uppercase">
              Multiple selection ({photos.length})
            </div>
          )}
          {isSingle && <PhotoHeader photo={photos[0]} />}
          {photos.length > 0 && (
            <form
              id={formId}
              onSubmit={(e) => {
                e.preventDefault()
                void form.handleSubmit()
              }}
            >
              <fieldset disabled={isSubmitting} className="min-w-0">
                <Tabs
                  value={panelTab}
                  onValueChange={(next) => setPanelTab(next as PanelTab)}
                >
                  <TabsList variant="line" className="mb-6 gap-4">
                    <TabsTrigger value="tags" className={tabClass}>
                      Tags
                    </TabsTrigger>
                    <TabsTrigger value="price" className={tabClass}>
                      Price
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
                {panelTab === "tags" ? (
                  <>
                    <div className="mb-3 text-[0.6875rem] font-semibold tracking-[0.06em] text-muted-foreground/70 uppercase">
                      What do you see in the image
                    </div>
                    <TagFields
                      form={form}
                      isSingle={isSingle}
                      riderNames={[
                        ...(starts.data ?? []).map((start) => start.rider_name),
                        ...photos.map((photo) => photo.rider),
                      ]}
                      horseNames={[
                        ...(starts.data ?? []).map((start) => start.horse_name),
                        ...photos.map((photo) => photo.horse),
                      ]}
                      className={className}
                    />
                  </>
                ) : (
                  <PriceFields
                    form={form}
                    isSingle={isSingle}
                    effectivePrices={defaults.data?.effective}
                    defaultCounts={defaultCounts}
                    onInfo={() => setInfoOpen(true)}
                  />
                )}
              </fieldset>
            </form>
          )}
        </SheetBody>
        <SheetFooter className="flex-col items-stretch border-muted">
          {result && "error" in result && (
            <FieldError errors={[{ message: result.error }]} />
          )}
          <div aria-live="polite" aria-atomic="true">
            {isSubmitting ? (
              <p role="status" className="text-xs text-muted-foreground">
                Saving…
              </p>
            ) : (
              result &&
              "saved" in result &&
              !isDirty && (
                <p role="status" className="text-xs text-muted-foreground">
                  Changes saved
                </p>
              )
            )}
          </div>
          <div className="flex items-center gap-3">
            {isDirty || isSubmitting ? (
              <div className="ml-auto flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  size="md"
                  className="min-w-25 text-muted-foreground"
                  disabled={isSubmitting}
                  onClick={discard}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  form={formId}
                  size="md"
                  className="min-w-25"
                  disabled={isSubmitting}
                >
                  <Save />
                  {isSubmitting ? "Saving…" : "Save changes"}
                </Button>
              </div>
            ) : (
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="size-10 text-muted-foreground hover:text-destructive"
                  aria-label="Delete"
                  onClick={() => setConfirmation("delete")}
                >
                  <Trash2 />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="md"
                  className="text-muted-foreground"
                  onClick={() => setMoveOpen(true)}
                >
                  <FolderInput />
                  Move to folder
                </Button>
              </div>
            )}
          </div>
        </SheetFooter>
        {infoOpen && (
          <PricingInfo onBack={() => setInfoOpen(false)} onClose={close} />
        )}
      </SheetContent>
      <MovePhotosDialog
        open={moveOpen}
        onOpenChange={setMoveOpen}
        photos={photos}
        onClosePanel={onClose}
        onMoved={onMoved}
      />
      <ConfirmDialog
        open={confirmation !== null}
        onCancel={() => setConfirmation(null)}
        onConfirm={confirmation === "delete" ? confirmDelete : discard}
        title={confirmation === "delete" ? "Delete photo?" : "Discard changes?"}
        description={
          confirmation === "delete"
            ? "This will remove the photo from this event. You can undo right after deleting."
            : "You have unsaved changes. Are you sure you want to discard them?"
        }
        confirmLabel={confirmation === "delete" ? "Delete" : "Discard"}
        tone="danger"
      />
    </Sheet>
  )
}

const tabClass =
  "group-data-[variant=line]/tabs-list:px-0 group-data-[variant=line]/tabs-list:py-2 group-data-[variant=line]/tabs-list:text-sm"
