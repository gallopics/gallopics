import { useState } from "react"
import { useUser } from "@clerk/clerk-react"
import { useMutation, useQuery } from "@tanstack/react-query"

import {
  getPriceError,
  QUALITY_TIERS,
  toSekPrices,
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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PageState } from "@/components/PageState"
import { ProfileFields, useProfileForm } from "@/components/ProfileForm"
import { TitleHeader } from "@/components/TitleHeader"
import {
  WorkspaceCard,
  WorkspacePageBody,
} from "@/components/WorkspacePageBody"

function ProfileSection() {
  const form = useProfileForm()
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
    </WorkspaceCard>
  )
}

function PricingFields({ data }: { data: PhotographerPricing }) {
  const [fields, setFields] = useState<Record<QualityTierId, string>>(
    () =>
      Object.fromEntries(
        QUALITY_TIERS.map((tier) => [
          tier.id,
          data.defaults[tier.id] == null
            ? ""
            : String((data.defaults[tier.id] ?? 0) / 100),
        ])
      ) as Record<QualityTierId, string>
  )
  const save = useMutation(saveDefaultPricesMutationOptions())
  const errors = QUALITY_TIERS.map((tier) =>
    fields[tier.id] ? getPriceError(fields[tier.id]) : null
  )
  const effective = toSekPrices(data.effective)
  const hasDefaults = QUALITY_TIERS.some(
    (tier) => data.defaults[tier.id] != null
  )
  return (
    <>
      <p className="mb-5 text-sm text-muted-foreground">
        {hasDefaults
          ? "Photos without their own price follow these prices."
          : "Gallopics default prices apply until you set your own."}{" "}
        Leave a field empty to use the Gallopics default for that quality.
      </p>
      <form
        onSubmit={async (event) => {
          event.preventDefault()
          if (errors.some(Boolean)) return
          const prices = Object.fromEntries(
            QUALITY_TIERS.map((tier) => [
              tier.id,
              fields[tier.id] ? Number(fields[tier.id]) : null,
            ])
          ) as OwnPhotoPrices
          try {
            await save.mutateAsync(prices)
            notify("Prices saved", "success")
          } catch {
            /* The error stays visible below the form. */
          }
        }}
      >
        <div className="grid gap-5 md:grid-cols-3">
          {QUALITY_TIERS.map((tier, index) => (
            <div key={tier.id}>
              <Label htmlFor={`default-${tier.id}`} className="mb-2">
                {tier.label} (SEK)
              </Label>
              <Input
                id={`default-${tier.id}`}
                inputMode="numeric"
                value={fields[tier.id]}
                placeholder={String(tier.price)}
                disabled={save.isPending}
                aria-invalid={!!errors[index]}
                onChange={(event) =>
                  setFields((current) => ({
                    ...current,
                    [tier.id]: event.target.value.trim(),
                  }))
                }
              />
              <p
                className={`mt-1 text-xs ${errors[index] ? "text-destructive" : "text-muted-foreground"}`}
              >
                {errors[index] ?? `Current price: ${effective[tier.id]} SEK`}
              </p>
            </div>
          ))}
        </div>
        {save.isError && (
          <p role="alert" className="mt-4 text-sm text-destructive">
            Could not save prices. Please try again.
          </p>
        )}
        <Button
          type="submit"
          className="mt-6"
          disabled={save.isPending || errors.some(Boolean)}
        >
          {save.isPending ? "Saving..." : "Save prices"}
        </Button>
      </form>
    </>
  )
}

function PricingSection() {
  const query = useQuery(defaultPricesQueryOptions())
  return (
    <WorkspaceCard>
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
  const { user: account } = useUser()
  return (
    <>
      <TitleHeader title="Settings" compact variant="workspace" />
      <WorkspacePageBody>
        <ProfileSection key={user?.id} />
        {user?.approvalStatus === "approved" && <PricingSection />}
        <WorkspaceCard>
          <h2 className="mb-6 text-xl font-semibold">Account</h2>
          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <Label htmlFor="account-username" className="mb-2">
                Username
              </Label>
              <Input
                id="account-username"
                readOnly
                value={account?.username ?? "Not set"}
              />
            </div>
            <div>
              <Label htmlFor="account-email" className="mb-2">
                Email
              </Label>
              <Input
                id="account-email"
                readOnly
                value={account?.primaryEmailAddress?.emailAddress ?? ""}
              />
            </div>
          </div>
        </WorkspaceCard>
      </WorkspacePageBody>
    </>
  )
}
