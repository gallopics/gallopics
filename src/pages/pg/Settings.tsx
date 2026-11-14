import { useEffect, useId } from "react"
import { useLocation } from "react-router"
import { useUser } from "@clerk/clerk-react"
import { useForm, useSelector } from "@tanstack/react-form"
import { useMutation, useQuery } from "@tanstack/react-query"
import { z } from "zod"

import {
  DEFAULT_PRICES,
  getPriceError,
  PRICE_ERROR,
  QUALITY_TIERS,
  type OwnPhotoPrices,
  type QualityTierId,
} from "@/constants/qualityTiers"
import { notify } from "@/lib/notify"
import { useAuth } from "@/context/AuthContext"
import type { PhotographerPricing } from "@/data/apiClient"
import {
  defaultPricesQueryOptions,
  saveDefaultPricesMutationOptions,
} from "@/data/queries/photographer"
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from "@/components/ui/input-group"
import { PageState } from "@/components/PageState"
import { ProfileFields, useProfileForm } from "@/components/ProfileForm"
import { TitleHeader } from "@/components/TitleHeader"
import {
  WorkspaceCard,
  WorkspacePageBody,
} from "@/components/WorkspacePageBody"

function ProfileSection() {
  const form = useProfileForm()
  const { user: account } = useUser()
  const id = useId()
  return (
    <WorkspaceCard>
      <h2 className="mb-6 text-xl font-semibold">Profile</h2>
      <ProfileFields form={form} />
      <Button
        className="mt-6"
        disabled={form.isSaving}
        onClick={async () => {
          if (await form.save()) notify("Profile saved", "success")
        }}
      >
        {form.isSaving ? "Saving..." : "Save profile"}
      </Button>
      {/* Sign-in details come from Clerk and can't be edited here */}
      <div className="mt-8 border-t pt-6">
        <h3 className="mb-4 font-semibold">Account</h3>
        <FieldGroup className="grid gap-4 md:grid-cols-2">
          <Field>
            <FieldLabel htmlFor={`${id}-username`}>Username</FieldLabel>
            <Input
              id={`${id}-username`}
              disabled
              value={account?.username ?? ""}
              placeholder="Not set"
            />
          </Field>
          <Field>
            <FieldLabel htmlFor={`${id}-email`}>Email</FieldLabel>
            <Input
              id={`${id}-email`}
              disabled
              value={account?.primaryEmailAddress?.emailAddress ?? ""}
              placeholder="Not set"
            />
          </Field>
        </FieldGroup>
      </div>
    </WorkspaceCard>
  )
}

const priceSchema = z.string().refine((value) => !getPriceError(value), {
  message: PRICE_ERROR,
})
const pricesSchema = z.object(
  Object.fromEntries(QUALITY_TIERS.map((tier) => [tier.id, priceSchema])) as {
    [id in QualityTierId]: typeof priceSchema
  }
)

/**
 * The photographer's default prices. A tier without one uses the standard
 * price, and a price equal to the standard one is saved as "none": that is
 * how a photographer goes back to the standard price.
 */
function PricingFields({ data }: { data: PhotographerPricing }) {
  const id = useId()
  const save = useMutation(saveDefaultPricesMutationOptions())
  const form = useForm({
    defaultValues: Object.fromEntries(
      QUALITY_TIERS.map(({ id }) => [
        id,
        String((data.defaults[id] ?? DEFAULT_PRICES[id] * 100) / 100),
      ])
    ) as Record<QualityTierId, string>,
    validators: { onChange: pricesSchema },
    onSubmit: async ({ value }) => {
      const prices = Object.fromEntries(
        QUALITY_TIERS.map(({ id }) => {
          const price = Number(value[id])
          return [id, price === DEFAULT_PRICES[id] ? null : price]
        })
      ) as OwnPhotoPrices
      try {
        await save.mutateAsync(prices)
        notify("Prices saved", "success")
      } catch {
        // save.isError shows the message below the form
      }
    },
  })
  const triedToSave = useSelector(form.store, (s) => s.submissionAttempts > 0)
  const isSubmitting = useSelector(form.store, (s) => s.isSubmitting)

  return (
    <form
      noValidate
      onSubmit={(e) => {
        e.preventDefault()
        void form.handleSubmit()
      }}
    >
      <p className="mb-5 text-sm text-muted-foreground">
        Photos without their own price use these prices.
      </p>
      <fieldset
        disabled={isSubmitting}
        className="grid min-w-0 gap-5 lg:grid-cols-3"
      >
        {QUALITY_TIERS.map((tier) => (
          <form.Field key={tier.id} name={tier.id}>
            {(field) => {
              // Shown after leaving the field or trying to save, not while typing
              const isInvalid =
                (field.state.meta.isBlurred || triedToSave) &&
                !field.state.meta.isValid
              // The standard price, shown only once it differs, so the way
              // back to it is clear
              const isStandard =
                field.state.value === `${DEFAULT_PRICES[tier.id]}`
              const fieldId = `${id}-${tier.id}`
              const helpId = `${fieldId}-help`
              return (
                <Field className="gap-1.5" data-invalid={isInvalid}>
                  <FieldLabel htmlFor={fieldId}>{tier.label}</FieldLabel>
                  <InputGroup className="h-10">
                    <InputGroupInput
                      id={fieldId}
                      name={field.name}
                      inputMode="numeric"
                      aria-invalid={isInvalid}
                      aria-describedby={
                        isInvalid || !isStandard ? helpId : undefined
                      }
                      value={field.state.value}
                      onChange={(e) =>
                        field.handleChange(e.target.value.trim())
                      }
                      onBlur={field.handleBlur}
                    />
                    <InputGroupAddon align="inline-end">
                      <InputGroupText>SEK</InputGroupText>
                    </InputGroupAddon>
                  </InputGroup>
                  {isInvalid ? (
                    <FieldError id={helpId} errors={field.state.meta.errors} />
                  ) : (
                    !isStandard && (
                      <FieldDescription id={helpId} className="text-xs">
                        Standard price: {DEFAULT_PRICES[tier.id]} SEK
                      </FieldDescription>
                    )
                  )}
                </Field>
              )
            }}
          </form.Field>
        ))}
      </fieldset>
      {save.isError && (
        <p role="alert" className="mt-4 text-sm text-destructive">
          Could not save prices. Please try again.
        </p>
      )}
      <Button type="submit" className="mt-6" disabled={isSubmitting}>
        {isSubmitting ? "Saving..." : "Save prices"}
      </Button>
    </form>
  )
}

function PricingSection() {
  const query = useQuery(defaultPricesQueryOptions())
  const { hash } = useLocation()
  const isLoaded = !!query.data
  useEffect(() => {
    // The photo Sheet links here. The browser's own jump to the hash runs
    // before this card renders, so scroll once the prices are in.
    if (hash === "#pricing" && isLoaded) {
      document.getElementById("pricing")?.scrollIntoView()
    }
  }, [hash, isLoaded])
  return (
    <WorkspaceCard id="pricing" className="scroll-mt-24">
      <h2 className="mb-3 text-xl font-semibold">Pricing</h2>
      {query.data ? (
        <PricingFields
          key={JSON.stringify(query.data.defaults)}
          data={query.data}
        />
      ) : query.isError ? (
        <PageState
          title="Prices could not be loaded"
          description="Please try loading your prices again."
          onRetry={() => {
            void query.refetch()
          }}
        />
      ) : (
        <p className="text-sm text-muted-foreground">Loading prices...</p>
      )}
    </WorkspaceCard>
  )
}

export function Settings() {
  const { user } = useAuth()
  return (
    <>
      <TitleHeader title="Settings" compact variant="workspace" />
      <WorkspacePageBody>
        <ProfileSection key={user?.id} />
        {user?.approvalStatus === "approved" && <PricingSection />}
      </WorkspacePageBody>
    </>
  )
}
