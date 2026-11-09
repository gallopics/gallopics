/**
 * All SEO texts (titles, descriptions, share tags) in one place. They are in
 * Swedish for the Swedish market; the visible UI stays English. index.html
 * repeats the home texts as defaults for crawlers that don't run JavaScript.
 */
import type { ApiEvent, ApiPhotographer } from "@/data/apiClient"

export const SITE_URL = "https://gallopics.com"

export interface MetaTexts {
  title: string
  description: string
}

export const seoTexts = {
  home: {
    title: "Tävlingsbilder på hästar & ryttare | Gallopics",
    description:
      "Hitta och köp bilder från hopptävlingar, dressyr och andra ridtävlingar i Sverige. Sök din tävling och upptäck dina bästa ögonblick.",
  },
  faq: {
    title: "Vanliga frågor om tävlingsbilder | Gallopics",
    description:
      "Svar på vanliga frågor om hur du hittar och köper dina tävlingsbilder på Gallopics – betalning, leverans via e-post och användning.",
  },
  privacy: {
    title: "Integritetspolicy | Gallopics",
    description:
      "Så hanterar Gallopics dina personuppgifter enligt GDPR: vilka uppgifter vi samlar in, hur de används och vilka rättigheter du har.",
  },
  terms: {
    title: "Användarvillkor | Gallopics",
    description:
      "Villkoren för att använda Gallopics och köpa tävlingsbilder från ridtävlingar.",
  },
  /** Private, loading and not-found pages: a plain title, no SEO texts */
  plainTitle: "Gallopics",
} satisfies Record<string, MetaTexts | string>

const swedishDate = new Intl.DateTimeFormat("sv-SE", {
  day: "numeric",
  month: "long",
  year: "numeric",
})

function parseIsoDate(value?: string | null): Date | null {
  if (!value || !/^\d{4}-\d{2}-\d{2}/.test(value)) return null
  const date = new Date(`${value.slice(0, 10)}T00:00:00`)
  return Number.isNaN(date.getTime()) ? null : date
}

/** "10 juli 2026", "10–12 juli 2026" or "30 september–2 oktober 2026" */
export function formatSwedishDateRange(
  startDate?: string | null,
  endDate?: string | null
): string | null {
  const start = parseIsoDate(startDate)
  if (!start) return null
  const end = parseIsoDate(endDate)
  return end && end > start
    ? swedishDate.formatRange(start, end)
    : swedishDate.format(start)
}

/** " i {place} den {date}", leaving out whatever the event data lacks */
function eventPlaceAndDate(event: ApiEvent): string {
  const place = event.city?.trim() || event.venue_name?.trim()
  const date = formatSwedishDateRange(event.start_date, event.end_date)
  return `${place ? ` i ${place}` : ""}${date ? ` den ${date}` : ""}`
}

export function eventMeta(event: ApiEvent): MetaTexts {
  const name = event.name.trim()
  return {
    title: `${name} – Tävlingsbilder | Gallopics`,
    description: `Se bilder från ${name}${eventPlaceAndDate(event)}. Hitta och köp dina tävlingsbilder på Gallopics.`,
  }
}

export function photographerMeta(photographer: ApiPhotographer): MetaTexts {
  const name = photographer.display_name.trim()
  const city = photographer.city?.trim()
  return {
    title: `Bilder av ${name} från ridtävlingar | Gallopics`,
    description: `Se tävlingsbilder tagna av ${name}${city ? `, fotograf i ${city}` : ""}. Hitta och köp bilder från dina ridtävlingar på Gallopics.`,
  }
}

/** A single photo page, described by its event (rider/horse tags aren't reliable yet) */
export function photoMeta(event: ApiEvent): MetaTexts {
  const name = event.name.trim()
  return {
    title: `Tävlingsbild från ${name} | Gallopics`,
    description: `Se och köp den här tävlingsbilden från ${name}${eventPlaceAndDate(event)} på Gallopics.`,
  }
}
