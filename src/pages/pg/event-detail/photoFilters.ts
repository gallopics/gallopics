import { shortPhotoId } from "@/lib/shortPhotoId"
import type { Photo } from "@/context/PhotographerContext"
import type { ScopedSearchOption } from "@/components/ScopedSearchBar"
import { NO_TAG } from "@/pages/pg/photo-details/detailsForm"

/** Statuses shown in the Uploads tab */
export const UPLOAD_STATUSES: Photo["status"][] = [
  "uploading",
  "processing",
  "needsReview",
  "uploadedUnpublished",
]

/** The class opened from the event page; the upload is tagged with it too */
export function readClassContext(search: string) {
  const params = new URLSearchParams(search)
  return {
    id: params.get("classSectionId") || params.get("classId") || "",
    equipeClassSectionId: params.get("equipeClassSectionId") || "",
    name: params.get("className") || "",
    arenaName: params.get("arenaName") || "",
  }
}

export type ClassContext = ReturnType<typeof readClassContext>

/** No class opened matches every photo */
export const matchesClass = (photo: Photo, { id, name }: ClassContext) =>
  (!id && !name) ||
  (!!id && photo.classId === id) ||
  (!!name && photo.className === name)

/** Search in the photo grid: file name, photo ID or code (as on Sales) and the tags */
export const matchesPhotoSearch = (photo: Photo, term: string) =>
  [
    photo.fileName,
    photo.id,
    shortPhotoId(photo.id),
    photo.rider,
    photo.horse,
    photo.className,
  ].some((value) => value?.toLowerCase().includes(term))

export const ALL_CHIP = "all"

export interface PhotoChip {
  id: string
  label: string
  count: number
  matches: (photo: Photo) => boolean
}

/** Chip groups in the order shown */
const CHIP_TAGS = [
  { key: "className", prefix: "class" },
  { key: "rider", prefix: "rider" },
  { key: "horse", prefix: "horse" },
] as const

/** "All", then one chip per class, rider and horse in the photos */
export function buildChips(photos: Photo[]): PhotoChip[] {
  const chips: PhotoChip[] = [
    { id: ALL_CHIP, label: "All", count: photos.length, matches: () => true },
  ]
  for (const { key, prefix } of CHIP_TAGS) {
    const values = [...new Set(photos.map((photo) => photo[key]))]
      .filter((value): value is string => !!value && value !== NO_TAG)
      .sort()
    for (const value of values) {
      const matches = (photo: Photo) => photo[key] === value
      chips.push({
        id: `${prefix}-${value}`,
        label: value,
        count: photos.filter(matches).length,
        matches,
      })
    }
  }
  return chips
}

/** Riders and horses offered by the search, each once, with its partner */
export function buildSearchOptions(photos: Photo[]) {
  const options: ScopedSearchOption[] = []
  const seen = { rider: new Set<string>(), horse: new Set<string>() }
  for (const photo of photos) {
    for (const type of ["rider", "horse"] as const) {
      const value = photo[type]
      if (!value || value === NO_TAG || seen[type].has(value)) continue
      seen[type].add(value)
      options.push({
        label: value,
        value,
        type,
        subtitle: type === "rider" ? photo.horse : photo.rider,
      })
    }
  }
  return options
}
