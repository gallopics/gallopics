import { useId, type ReactNode } from "react"
import { useSelector } from "@tanstack/react-form"
import { useQuery } from "@tanstack/react-query"
import { cn } from "cn"
import { ExternalLink, Info } from "lucide-react"

import {
  DEFAULT_PRICES,
  LINKED_PRICE,
  QUALITY_TIERS,
  type QualityTierId,
} from "@/constants/qualityTiers"
import type { Photo } from "@/context/PhotographerContext"
import { classStartsQueryOptions } from "@/data/queries/events"
import { defaultPricesQueryOptions } from "@/data/queries/photographer"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldTitle,
} from "@/components/ui/field"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from "@/components/ui/input-group"
import { ModernDropdown } from "@/components/ModernDropdown"

import { NO_TAG } from "./detailsForm"
import type { DetailsForm } from "./DetailsPanel"

const labelClass = "text-xs font-semibold text-muted-foreground"

/** Small uppercase heading of a section in the Sheet */
export function SectionLabel({
  className,
  children,
}: {
  className?: string
  children: ReactNode
}) {
  return (
    <div
      className={cn(
        "text-[0.6875rem] font-semibold tracking-[0.06em] text-muted-foreground/70 uppercase",
        className
      )}
    >
      {children}
    </div>
  )
}

/** Dropdown options from names: no blanks or repeats, sorted */
const nameOptions = (names: Array<string | null | undefined>) =>
  [
    ...new Set(
      names.filter((name): name is string => !!name && name !== NO_TAG)
    ),
  ]
    .sort((a, b) => a.localeCompare(b))
    .map((name) => ({ label: name, value: name }))

function TagField({
  form,
  name,
  label,
  names,
  isSingle,
}: {
  form: DetailsForm
  name: "rider" | "horse"
  label: string
  /** Names to offer (the class's start list and the selected photos) */
  names: Array<string | null | undefined>
  isSingle: boolean
}) {
  const id = useId()
  return (
    <form.Field name={name}>
      {(field) => (
        <Field className="gap-1.5">
          <FieldLabel htmlFor={id} className={labelClass}>
            {label}
          </FieldLabel>
          <ModernDropdown
            id={id}
            showSearch
            value={field.state.value}
            onChange={field.handleChange}
            onBlur={field.handleBlur}
            options={[
              { label: NO_TAG, value: NO_TAG },
              ...nameOptions([field.state.value, ...names]),
            ]}
            placeholder={
              isSingle ? `Select ${label}...` : "Mixed (Keep existing)"
            }
            className="h-10 min-h-10 py-0 data-[size=default]:h-10"
          />
        </Field>
      )}
    </form.Field>
  )
}

export function TagFields({
  form,
  photos,
}: {
  form: DetailsForm
  photos: Photo[]
}) {
  const isSingle = photos.length === 1
  const classIds = [
    ...new Set(photos.map((photo) => photo.classId).filter(Boolean)),
  ]
  const classId = classIds.length === 1 ? classIds[0]! : ""
  // The class's start list offers the riders and horses that competed
  const starts = useQuery({
    ...classStartsQueryOptions(classId),
    enabled: !!classId,
  })
  const classNames = new Set(photos.map((photo) => photo.className || ""))
  const className =
    classNames.size === 1 ? [...classNames][0] : isSingle ? "" : "Mixed"
  return (
    <>
      <SectionLabel className="mb-3">What do you see in the image</SectionLabel>
      <FieldGroup className="gap-5">
        <TagField
          form={form}
          name="rider"
          label="Rider"
          names={[
            ...(starts.data ?? []).map((start) => start.rider_name),
            ...photos.map((photo) => photo.rider),
          ]}
          isSingle={isSingle}
        />
        <TagField
          form={form}
          name="horse"
          label="Horse"
          names={[
            ...(starts.data ?? []).map((start) => start.horse_name),
            ...photos.map((photo) => photo.horse),
          ]}
          isSingle={isSingle}
        />
        <Field className="gap-1.5">
          <FieldTitle className={labelClass}>Class</FieldTitle>
          <div className="w-full rounded-lg border bg-muted px-3 py-2 text-[15px] text-foreground">
            {className || "No class selected"}
          </div>
        </Field>
      </FieldGroup>
    </>
  )
}

export function PriceFields({
  form,
  photos,
  onInfo,
}: {
  form: DetailsForm
  photos: Photo[]
  onInfo: () => void
}) {
  const id = useId()
  const isSingle = photos.length === 1
  const defaults = useQuery(defaultPricesQueryOptions())
  const prices = useSelector(form.store, (s) => s.values.prices)
  const triedToSave = useSelector(form.store, (s) => s.submissionAttempts > 0)
  const inputId = (tierId: QualityTierId) => `${id}-${tierId}`

  /**
   * The photographer's default price in SEK. Unknown while loading, so the
   * site's price never flashes as theirs; the site's if loading fails.
   */
  const defaultPrice = (tierId: QualityTierId) =>
    defaults.isPending
      ? undefined
      : defaults.data
        ? defaults.data.effective[tierId] / 100
        : DEFAULT_PRICES[tierId]
  /** What an empty field keeps in a multi-selection: "499" or "Mixed · 499–549" */
  const keptPrices = (tierId: QualityTierId) => {
    const values = photos.map(
      (photo) => photo.ownPrices?.[tierId] ?? defaultPrice(tierId)
    )
    if (!values.every((value): value is number => value !== undefined)) return
    const min = Math.min(...values)
    const max = Math.max(...values)
    return min === max ? `${min}` : `Mixed · ${min}–${max}`
  }
  // In a multi-selection "" keeps each photo's price, so it is custom only
  // when some photo has its own price
  const hasCustomPrice = QUALITY_TIERS.some(({ id: tierId }) => {
    const value = prices[tierId]
    if (value === LINKED_PRICE) return false
    if (isSingle || value !== "") return true
    return photos.some((photo) => photo.ownPrices?.[tierId] != null)
  })
  return (
    <>
      <div className="mb-3 flex items-center justify-between">
        <SectionLabel>Price per quality</SectionLabel>
        <Button
          type="button"
          variant="secondary"
          size="icon-xs"
          onClick={onInfo}
          aria-label="Pricing info"
        >
          <Info />
        </Button>
      </div>
      <FieldGroup className="gap-4">
        {QUALITY_TIERS.map((tier) => (
          <form.Field key={tier.id} name={`prices.${tier.id}`}>
            {(field) => {
              const value = field.state.value
              const linked = value === LINKED_PRICE
              // Shown after leaving the field or trying to save, not while typing
              const isInvalid =
                (field.state.meta.isBlurred || triedToSave) &&
                !field.state.meta.isValid
              const fieldId = inputId(tier.id)
              const errorId = `${fieldId}-error`
              const badgeId = `${fieldId}-default`
              return (
                <Field className="gap-1.5" data-invalid={isInvalid}>
                  <FieldLabel htmlFor={fieldId} className={labelClass}>
                    {tier.label}
                  </FieldLabel>
                  <InputGroup className="h-10">
                    {/* A linked tier shows the default as a real value:
                        tabbing in selects it, so typing replaces it, and a
                        click places the caret to edit it. Either way the
                        tier becomes a custom price. */}
                    <InputGroupInput
                      id={fieldId}
                      name={field.name}
                      inputMode="numeric"
                      aria-invalid={isInvalid}
                      aria-describedby={
                        isInvalid ? errorId : linked ? badgeId : undefined
                      }
                      value={linked ? (defaultPrice(tier.id) ?? "") : value}
                      onChange={(e) =>
                        field.handleChange(e.target.value.trim())
                      }
                      onBlur={field.handleBlur}
                      placeholder={
                        !isSingle && value === ""
                          ? keptPrices(tier.id)
                          : undefined
                      }
                    />
                    <InputGroupAddon align="inline-end">
                      {linked && (
                        <Badge
                          id={badgeId}
                          variant="secondary"
                          className="h-5 px-2 text-[0.6875rem]"
                        >
                          Default<span className="sr-only"> price</span>
                        </Badge>
                      )}
                      <InputGroupText>SEK</InputGroupText>
                    </InputGroupAddon>
                  </InputGroup>
                  {isInvalid && (
                    <FieldError id={errorId} errors={field.state.meta.errors} />
                  )}
                </Field>
              )
            }}
          </form.Field>
        ))}
      </FieldGroup>
      {!isSingle && (
        <p className="mt-4 text-xs leading-normal text-muted-foreground">
          Empty fields keep each photo&apos;s own price.
        </p>
      )}
      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-3">
        <p className="text-xs leading-normal text-muted-foreground">
          Defaults come from{" "}
          {/* New tab, so an unsaved edit in the Sheet is never lost */}
          <a
            href="/pg/settings#pricing"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 rounded-sm font-medium text-foreground underline-offset-4 outline-none hover:underline focus-visible:ring-[3px] focus-visible:ring-ring/50"
          >
            Settings<span aria-hidden>→</span>Pricing
            <ExternalLink className="size-3" aria-hidden />
            <span className="sr-only">(opens in a new tab)</span>
          </a>
        </p>
        {hasCustomPrice && (
          <Button
            type="button"
            variant="secondary"
            size="xs"
            className="ml-auto"
            onClick={() => {
              QUALITY_TIERS.forEach((tier) =>
                form.setFieldValue(`prices.${tier.id}`, LINKED_PRICE)
              )
              // The button unmounts on click; keep focus in the form
              document.getElementById(inputId(QUALITY_TIERS[0].id))?.focus()
            }}
          >
            Reset all to defaults
          </Button>
        )}
      </div>
    </>
  )
}
