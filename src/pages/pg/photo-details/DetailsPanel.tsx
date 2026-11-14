import { useEffect, useId, useMemo, useState } from "react"
import {
  useForm,
  useSelector,
  type FormAsyncValidateOrFn,
  type FormValidateOrFn,
  type ReactFormExtendedApi,
} from "@tanstack/react-form"
import { useMutation } from "@tanstack/react-query"
import { FolderInput, Save, Trash2 } from "lucide-react"

import type { Photo } from "@/context/PhotographerContext"
import { savePhotosMutationOptions } from "@/data/queries/photographer"
import { Button } from "@/components/ui/button"
import { FieldError } from "@/components/ui/field"
import { SheetBody, SheetFooter } from "@/components/ui/sheet"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

import { PriceFields, SectionLabel, TagFields } from "./DetailsFields"
import {
  changedPrices,
  changedTags,
  detailsSchema,
  detailsValues,
  type DetailsValues,
} from "./detailsForm"
import { PhotoHeader } from "./PhotoHeader"
import { PricingInfo } from "./PricingInfo"

export type PanelTab = "tags" | "price"
export type PanelStatus = { isDirty: boolean; isSubmitting: boolean }
export const IDLE: PanelStatus = { isDirty: false, isSubmitting: false }

/**
 * The Sheet's content for one opening: Base UI mounts it on open and unmounts
 * it after the slide-out, so each opening starts a fresh form.
 * Tags and prices go in one request that the API saves whole or not at all,
 * so a failed save leaves the photos as they were and the draft stays for a
 * retry.
 */
export function DetailsPanel({
  photos,
  activeTab,
  onStatusChange,
  onClose,
  onDiscard,
  onDelete,
  onMove,
}: {
  photos: Photo[]
  activeTab?: PanelTab
  /** Lets the Sheet block closing while there are unsaved changes */
  onStatusChange: (status: PanelStatus) => void
  onClose: () => void
  onDiscard: () => void
  onDelete: () => void
  onMove: () => void
}) {
  const formId = useId()
  const isSingle = photos.length === 1
  const [tab, setTab] = useState<PanelTab>(activeTab ?? "tags")
  const [infoOpen, setInfoOpen] = useState(false)
  // The values of the last save. Cache refreshes don't change them, so an
  // edit in progress is never replaced.
  const [saved, setSaved] = useState(() => detailsValues(photos))
  const save = useMutation(savePhotosMutationOptions())
  const schema = useMemo(() => detailsSchema(isSingle), [isSingle])

  const form = useForm({
    defaultValues: saved,
    validators: { onChange: schema },
    // Only prices can be invalid
    onSubmitInvalid: () => setTab("price"),
    onSubmit: async ({ value, formApi }) => {
      const prices = changedPrices(value, saved)
      const changes = {
        ...changedTags(value, saved),
        ...(Object.keys(prices).length > 0 && { prices }),
      }
      if (Object.keys(changes).length > 0) {
        try {
          const photoIds = photos.map((photo) => photo.id)
          await save.mutateAsync({ photoIds, changes })
        } catch {
          // save.isError shows the message; the draft stays for a retry
          return
        }
      } else {
        // Nothing to send; clear an earlier error
        save.reset()
      }
      setSaved(value)
      formApi.reset(value)
    },
  })
  const isDirty = useSelector(form.store, (state) => !state.isDefaultValue)
  const isSubmitting = useSelector(form.store, (state) => state.isSubmitting)

  useEffect(() => {
    onStatusChange({ isDirty, isSubmitting })
    return () => onStatusChange(IDLE)
  }, [isDirty, isSubmitting, onStatusChange])

  return (
    <>
      <SheetBody className="relative min-h-0 leading-[1.3]">
        {!isSingle && photos.length > 0 && (
          <SectionLabel className="mb-8">
            Multiple selection ({photos.length})
          </SectionLabel>
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
                value={tab}
                onValueChange={(next) => setTab(next as PanelTab)}
                className="gap-6"
              >
                <TabsList variant="line" className="gap-4">
                  <TabsTrigger value="tags" className={tabClass}>
                    Tags
                  </TabsTrigger>
                  <TabsTrigger value="price" className={tabClass}>
                    Price
                  </TabsTrigger>
                </TabsList>
                {/* Kept mounted: Save only validates mounted fields, and an
                    invalid price must show its error from the Tags tab too */}
                <TabsContent value="tags" keepMounted>
                  <TagFields form={form} photos={photos} />
                </TabsContent>
                <TabsContent value="price" keepMounted>
                  <PriceFields
                    form={form}
                    photos={photos}
                    onInfo={() => setInfoOpen(true)}
                  />
                </TabsContent>
              </Tabs>
            </fieldset>
          </form>
        )}
      </SheetBody>
      <SheetFooter className="flex-col items-stretch border-muted">
        {save.isError && (
          <FieldError
            errors={[{ message: "Unable to save changes. Please try again." }]}
          />
        )}
        <div aria-live="polite" aria-atomic="true">
          {isSubmitting ? (
            <p role="status" className="text-xs text-muted-foreground">
              Saving…
            </p>
          ) : (
            save.isSuccess &&
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
                onClick={onDiscard}
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
                onClick={onDelete}
              >
                <Trash2 />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="md"
                className="text-muted-foreground"
                onClick={onMove}
              >
                <FolderInput />
                Move to folder
              </Button>
            </div>
          )}
        </div>
      </SheetFooter>
      {infoOpen && (
        <PricingInfo onBack={() => setInfoOpen(false)} onClose={onClose} />
      )}
    </>
  )
}

type Sync = FormValidateOrFn<DetailsValues> | undefined
type Async = FormAsyncValidateOrFn<DetailsValues> | undefined
/** The form TagFields and PriceFields read from: only onChange is set */
export type DetailsForm = ReactFormExtendedApi<
  DetailsValues,
  Sync,
  ReturnType<typeof detailsSchema>,
  Async,
  Sync,
  Async,
  Sync,
  Async,
  Sync,
  Async,
  Async,
  unknown
>

const tabClass =
  "group-data-[variant=line]/tabs-list:px-0 group-data-[variant=line]/tabs-list:py-2 group-data-[variant=line]/tabs-list:text-sm"
