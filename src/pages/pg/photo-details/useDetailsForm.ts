import { useMemo, useState } from "react"
import { useForm, useStore } from "@tanstack/react-form"
import { useMutation } from "@tanstack/react-query"

import {
  LINKED_PRICES,
  type OwnPhotoPrices,
  type QualityTierId,
} from "@/constants/qualityTiers"
import type { Photo } from "@/context/PhotographerContext"
import {
  PhotoPricesSaveError,
  savePhotoDetailsMutationOptions,
  savePhotoPricesMutationOptions,
} from "@/data/queries/photographer"

import {
  changedPrices,
  changedTags,
  detailsSchema,
  detailsValues,
  type DetailsValues,
} from "./detailsForm"

const NO_VALUES: DetailsValues = {
  rider: "",
  horse: "",
  prices: { web: "", high: "", commercial: "" } satisfies Record<
    QualityTierId,
    string
  >,
}

type SaveResult = { saved: true } | { error: string }

/**
 * The Sheet's form for one editing session (the Sheet remounts it on open).
 * Prices are saved first, then tags; if a step fails, the photos that already
 * changed are put back and the draft stays for a retry.
 */
export function useDetailsForm(photos: Photo[], onInvalid: () => void) {
  const isSingle = photos.length === 1
  // The values of the last save. Cache refreshes don't change them, so an
  // edit in progress is never replaced. Set once the photos have loaded.
  const [saved, setSaved] = useState(() =>
    photos.length ? detailsValues(photos) : undefined
  )
  if (!saved && photos.length) setSaved(detailsValues(photos))
  const [result, setResult] = useState<SaveResult>()
  const saveTags = useMutation(savePhotoDetailsMutationOptions())
  const savePrices = useMutation(savePhotoPricesMutationOptions())
  const schema = useMemo(() => detailsSchema(isSingle), [isSingle])

  /** Put back the photos' values from before the save; false if some failed */
  const restore = async (pricedIds: string[], tagsSent: boolean) => {
    const priceGroups = new Map<
      string,
      { photoIds: string[]; prices: OwnPhotoPrices }
    >()
    for (const photo of photos.filter((p) => pricedIds.includes(p.id))) {
      const prices = photo.ownPrices ?? LINKED_PRICES
      const key = JSON.stringify(prices)
      const group = priceGroups.get(key) ?? { photoIds: [], prices }
      group.photoIds.push(photo.id)
      priceGroups.set(key, group)
    }
    const results = await Promise.allSettled([
      ...Array.from(priceGroups.values(), (group) =>
        savePrices.mutateAsync(group)
      ),
      ...(tagsSent ? photos : []).map((photo) =>
        saveTags.mutateAsync({
          photoIds: [photo.id],
          details: { rider: photo.rider ?? "", horse: photo.horse ?? "" },
        })
      ),
    ])
    return results.every((r) => r.status === "fulfilled")
  }

  const form = useForm({
    defaultValues: saved ?? NO_VALUES,
    validators: { onChange: schema },
    onSubmitInvalid: onInvalid,
    onSubmit: async ({ value, formApi }) => {
      if (!saved) return
      setResult(undefined)
      const photoIds = photos.map((photo) => photo.id)
      const prices = changedPrices(value, saved)
      const tags = changedTags(value, saved)
      const hasPrices = Object.keys(prices).length > 0
      try {
        if (hasPrices) await savePrices.mutateAsync({ photoIds, prices })
      } catch (error) {
        const partly =
          error instanceof PhotoPricesSaveError ? error.savedPhotoIds : []
        return fail(await restore(partly, false))
      }
      try {
        if (Object.keys(tags).length)
          await saveTags.mutateAsync({ photoIds, details: tags })
      } catch {
        return fail(await restore(hasPrices ? photoIds : [], true))
      }
      setSaved(value)
      formApi.reset(value)
      setResult({ saved: true })
    },
  })

  const fail = (restored: boolean) =>
    setResult({
      error: restored
        ? "Unable to save changes. Please try again."
        : "Unable to save changes. Some changes could not be restored. Please retry.",
    })

  const isDirty = useStore(form.store, (state) => !state.isDefaultValue)
  const isSubmitting = useStore(form.store, (state) => state.isSubmitting)

  return { form, isSingle, isDirty, isSubmitting, result }
}

export type DetailsForm = ReturnType<typeof useDetailsForm>["form"]
