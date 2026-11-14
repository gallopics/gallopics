export type QualityTierId = "web" | "high" | "commercial"

/** A photo's price per quality tier, in whole SEK */
export type PhotoPrices = Record<QualityTierId, number>
/** Null means this tier follows the photographer's current default. */
export type OwnPhotoPrices = Record<QualityTierId, number | null>

export const LINKED_PRICES: OwnPhotoPrices = {
  web: null,
  high: null,
  commercial: null,
}

/** The same in öre (SEK × 100), as the API sends and takes them */
export type ApiPhotoPrices = Record<QualityTierId, number>

export interface QualityTier {
  id: QualityTierId
  label: string
  /** Site fallback in SEK; `photo.prices` contains the resolved prices. */
  price: number
  description: string
  purpose: string
  sizeLabel: string
}

// Keep in sync with the API's app/services/pricing.py
export const QUALITY_TIERS: QualityTier[] = [
  {
    id: "web",
    label: "Web quality",
    price: 499,
    description: "Best for social media and screen use.",
    purpose: "screen/social",
    sizeLabel: "Up to 1080px",
  },
  {
    id: "high",
    label: "High quality",
    price: 999,
    description: "Best for printing and large displays.",
    purpose: "print/large displays",
    sizeLabel: "Full size",
  },
  {
    id: "commercial",
    label: "Commercial use",
    price: 1500,
    description: "Best for printing and large displays.", // Name and price differ, purpose text same as High quality
    purpose: "print/large displays",
    sizeLabel: "Full size",
  },
]

/** Limits for a photographer's own prices, in whole SEK */
export const MIN_PRICE_SEK = 49
export const MAX_PRICE_SEK = 10_000
/** Every invalid price shows this, so the allowed range is only shown here */
export const PRICE_ERROR = `Enter a price in whole SEK, ${MIN_PRICE_SEK} to ${MAX_PRICE_SEK.toLocaleString("sv-SE")} SEK`
/** A price field that follows a default instead of its own price (saved as null) */
export const LINKED_PRICE = "default"

export const DEFAULT_PRICES = Object.fromEntries(
  QUALITY_TIERS.map((tier) => [tier.id, tier.price])
) as PhotoPrices

/** Prices from the API (öre) in SEK */
export const toSekPrices = (prices: ApiPhotoPrices): PhotoPrices =>
  Object.fromEntries(
    QUALITY_TIERS.map((tier) => [tier.id, prices[tier.id] / 100])
  ) as PhotoPrices

/** Prices in SEK for the API (öre); tiers left out stay out */
export const toApiPrices = (
  prices: Partial<OwnPhotoPrices>
): Partial<OwnPhotoPrices> =>
  Object.fromEntries(
    Object.entries(prices).map(([tierId, sek]) => [
      tierId,
      sek === null ? null : sek * 100,
    ])
  )

/** What a photo costs in a tier, in SEK; the default price when unknown */
export const getPhotoPrice = (
  prices: PhotoPrices | undefined,
  tierId: string
): number => {
  const tier = QUALITY_TIERS.find((t) => t.id === tierId)
  if (!tier) return DEFAULT_PRICES.high
  return prices?.[tier.id] ?? tier.price
}

export const hasCustomPrices = (prices: OwnPhotoPrices | undefined) =>
  !!prices && QUALITY_TIERS.some((tier) => prices[tier.id] != null)

export const toSekOwnPrices = (prices: OwnPhotoPrices): OwnPhotoPrices =>
  Object.fromEntries(
    QUALITY_TIERS.map((tier) => {
      const value = prices[tier.id]
      return [tier.id, value == null ? null : value / 100]
    })
  ) as OwnPhotoPrices

/** Why a price typed in SEK can't be saved; null when it can */
export const getPriceError = (value: string): string | null => {
  if (!value) return "Enter a price"
  if (!/^\d+$/.test(value)) return "Whole SEK only"
  const price = Number(value)
  if (price < MIN_PRICE_SEK) return `At least ${MIN_PRICE_SEK} SEK`
  if (price > MAX_PRICE_SEK)
    return `At most ${MAX_PRICE_SEK.toLocaleString("sv-SE")} SEK`
  return null
}

export const getDefaultCartTier = () => {
  const tier = QUALITY_TIERS.find((t) => t.id === "web") || QUALITY_TIERS[0]
  return tier
}
