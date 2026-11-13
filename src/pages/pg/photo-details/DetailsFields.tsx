import { useId } from "react"
import { useStore } from "@tanstack/react-form"
import { Info } from "lucide-react"

import {
  MAX_PRICE_SEK,
  MIN_PRICE_SEK,
  QUALITY_TIERS,
  type ApiPhotoPrices,
  type QualityTierId,
} from "@/constants/qualityTiers"
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldDescription,
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

import { LINKED_PRICE, NO_TAG } from "./detailsForm"
import type { DetailsForm } from "./useDetailsForm"

const labelClass = "text-xs font-semibold text-muted-foreground"

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
  isSingle,
  riderNames,
  horseNames,
  className,
}: {
  form: DetailsForm
  isSingle: boolean
  riderNames: Array<string | null | undefined>
  horseNames: Array<string | null | undefined>
  /** The class shown (read-only) */
  className: string
}) {
  return (
    <FieldGroup className="gap-5">
      <TagField
        form={form}
        name="rider"
        label="Rider"
        names={riderNames}
        isSingle={isSingle}
      />
      <TagField
        form={form}
        name="horse"
        label="Horse"
        names={horseNames}
        isSingle={isSingle}
      />
      <Field className="gap-1.5">
        <FieldTitle className={labelClass}>Class</FieldTitle>
        <div className="w-full rounded-lg border bg-muted px-3 py-2 text-[15px] text-foreground">
          {className || "No class selected"}
        </div>
      </Field>
    </FieldGroup>
  )
}

export function PriceFields({
  form,
  isSingle,
  effectivePrices,
  defaultCounts,
  onInfo,
}: {
  form: DetailsForm
  isSingle: boolean
  effectivePrices?: ApiPhotoPrices
  /** Selected photos using the default price, per tier */
  defaultCounts: Record<QualityTierId, number>
  onInfo: () => void
}) {
  const id = useId()
  const triedToSave = useStore(form.store, (s) => s.submissionAttempts > 0)
  const allLinked = useStore(form.store, (s) =>
    QUALITY_TIERS.every((tier) => s.values.prices[tier.id] === LINKED_PRICE)
  )
  return (
    <>
      <div className="mb-3 flex items-center justify-between">
        <span className="text-[0.6875rem] font-semibold tracking-[0.06em] text-muted-foreground/70 uppercase">
          Price per quality
        </span>
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
      <FieldGroup className="gap-5">
        {QUALITY_TIERS.map((tier) => (
          <form.Field key={tier.id} name={`prices.${tier.id}`}>
            {(field) => {
              const value = field.state.value
              const linked = value === LINKED_PRICE
              // Shown after leaving the field or trying to save, not while typing
              const isInvalid =
                (field.state.meta.isBlurred || triedToSave) &&
                !field.state.meta.isValid
              const inputId = `${id}-${tier.id}`
              const helpId = `${inputId}-help`
              return (
                <Field className="gap-1" data-invalid={isInvalid}>
                  <FieldLabel htmlFor={inputId} className={labelClass}>
                    {tier.label}
                  </FieldLabel>
                  <InputGroup className="h-10">
                    <InputGroupInput
                      id={inputId}
                      name={field.name}
                      inputMode="numeric"
                      aria-invalid={isInvalid}
                      aria-describedby={helpId}
                      value={linked ? "" : value}
                      onChange={(e) =>
                        field.handleChange(e.target.value.trim())
                      }
                      onBlur={field.handleBlur}
                      placeholder={
                        linked
                          ? String(
                              (effectivePrices?.[tier.id] ?? tier.price * 100) /
                                100
                            )
                          : isSingle
                            ? ""
                            : "Mixed"
                      }
                    />
                    <InputGroupAddon align="inline-end">
                      <InputGroupText>SEK</InputGroupText>
                    </InputGroupAddon>
                  </InputGroup>
                  {isInvalid ? (
                    <FieldError id={helpId} errors={field.state.meta.errors} />
                  ) : (
                    <FieldDescription
                      id={helpId}
                      className="text-xs leading-[1.4]"
                    >
                      {linked
                        ? "Uses default price. Updates when your default changes."
                        : !isSingle && value === ""
                          ? `Mixed prices: ${defaultCounts[tier.id]} use default price.`
                          : tier.description}
                    </FieldDescription>
                  )}
                  <Button
                    type="button"
                    variant="link"
                    size="xs"
                    className="mt-1 h-auto justify-start self-start px-0"
                    disabled={linked}
                    onClick={() => field.handleChange(LINKED_PRICE)}
                  >
                    Use default price
                  </Button>
                </Field>
              )
            }}
          </form.Field>
        ))}
      </FieldGroup>
      <p className="mt-5 text-xs leading-normal text-muted-foreground/70">
        {!isSingle && "Leave a field empty to keep each photo's own price. "}
        Whole SEK, {MIN_PRICE_SEK} to {MAX_PRICE_SEK.toLocaleString("sv-SE")}{" "}
        SEK.
      </p>
      <Button
        type="button"
        variant="link"
        size="xs"
        className="mt-2 h-auto px-0"
        disabled={allLinked}
        onClick={() =>
          QUALITY_TIERS.forEach((tier) =>
            form.setFieldValue(`prices.${tier.id}`, LINKED_PRICE)
          )
        }
      >
        Use default prices
      </Button>
    </>
  )
}
