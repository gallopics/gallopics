import { z } from "zod"

import {
  getPriceError,
  MAX_PRICE_SEK,
  MIN_PRICE_SEK,
  QUALITY_TIERS,
  type OwnPhotoPrices,
  type QualityTierId,
} from "@/constants/qualityTiers"
import type { Photo } from "@/context/PhotographerContext"

/** A price field linked to the photographer's default price (saved as null) */
export const LINKED_PRICE = "default"
/** A tag cleared on purpose (one photo) */
export const NO_TAG = "None"

/**
 * The Sheet's fields. In a multi-selection, "" means "keep each photo's own
 * value" (mixed rider, horse or price).
 */
export interface DetailsValues {
  rider: string
  horse: string
  prices: Record<QualityTierId, string>
}

export function detailsValues(photos: Photo[]): DetailsValues {
  const photo = photos.length === 1 ? photos[0] : undefined
  return {
    rider: photo ? photo.rider || NO_TAG : "",
    horse: photo ? photo.horse || NO_TAG : "",
    prices: Object.fromEntries(
      QUALITY_TIERS.map((tier) => {
        const values = new Set(
          photos.map((p) => p.ownPrices?.[tier.id] ?? LINKED_PRICE)
        )
        return [tier.id, values.size === 1 ? String([...values][0]) : ""]
      })
    ) as DetailsValues["prices"],
  }
}

// One message for every invalid price: the Sheet shows the allowed range
// only here, not as a hint under each field
const PRICE_ERROR = `Enter a price in whole SEK, ${MIN_PRICE_SEK} to ${MAX_PRICE_SEK.toLocaleString("sv-SE")} SEK`

const priceSchema = (isSingle: boolean) =>
  z.string().superRefine((value, ctx) => {
    if (value === LINKED_PRICE || (!isSingle && value === "")) return
    if (getPriceError(value)) {
      ctx.addIssue({ code: "custom", message: PRICE_ERROR })
    }
  })

export const detailsSchema = (isSingle: boolean) =>
  z.object({
    rider: z.string(),
    horse: z.string(),
    prices: z.object(
      Object.fromEntries(
        QUALITY_TIERS.map((tier) => [tier.id, priceSchema(isSingle)])
      ) as Record<QualityTierId, ReturnType<typeof priceSchema>>
    ),
  })

/** The prices to send: only fields changed since the last save */
export function changedPrices(values: DetailsValues, saved: DetailsValues) {
  const prices: Partial<OwnPhotoPrices> = {}
  QUALITY_TIERS.forEach(({ id }) => {
    const value = values.prices[id]
    if (value !== "" && value !== saved.prices[id]) {
      prices[id] = value === LINKED_PRICE ? null : Number(value)
    }
  })
  return prices
}

/** The tags to send: only fields changed since the last save */
export function changedTags(values: DetailsValues, saved: DetailsValues) {
  const tags: Partial<Pick<Photo, "rider" | "horse">> = {}
  for (const name of ["rider", "horse"] as const) {
    const value = values[name]
    if (value !== "" && value !== saved[name]) {
      tags[name] = value === NO_TAG ? "" : value
    }
  }
  return tags
}
