import assert from "node:assert/strict"
import test from "node:test"

import {
  hasCustomPrices,
  LINKED_PRICES,
  toApiPrices,
  toSekOwnPrices,
} from "../src/constants/qualityTiers.ts"

test("clearing a tier keeps null instead of charging zero", () => {
  assert.deepEqual(toApiPrices({ web: null, high: 799 }), {
    web: null,
    high: 79900,
  })
})

test("an explicit site-default amount is still an own price", () => {
  assert.equal(hasCustomPrices(LINKED_PRICES), false)
  assert.equal(hasCustomPrices({ ...LINKED_PRICES, web: 499 }), true)
})

test("own prices preserve linked tiers when converted to SEK", () => {
  assert.deepEqual(
    toSekOwnPrices({ web: null, high: 79900, commercial: null }),
    {
      web: null,
      high: 799,
      commercial: null,
    }
  )
})
