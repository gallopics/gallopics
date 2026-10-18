import { useState } from "react"
import { Check } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Field, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { ModernDropdown } from "@/components/ModernDropdown"
import { TitleHeader } from "@/components/TitleHeader"
import {
  WorkspaceCard,
  WorkspacePageBody,
} from "@/components/WorkspacePageBody"

const COUNTRIES = [
  { label: "United States", value: "US" },
  { label: "Canada", value: "CA" },
  { label: "United Kingdom", value: "GB" },
  { label: "Australia", value: "AU" },
  { label: "Germany", value: "DE" },
  { label: "France", value: "FR" },
  { label: "Sweden", value: "SE" },
]

type BillingField = "street" | "city" | "state" | "zip" | "country"

export function PhotographerBilling() {
  const [saved, setSaved] = useState(false)
  const [formData, setFormData] = useState<Record<BillingField, string>>({
    street: "",
    city: "",
    state: "",
    zip: "",
    country: "SE", // Default to Sweden
  })

  const handleSave = () => {
    // Mock save
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  const set = (name: BillingField, value: string) =>
    setFormData({ ...formData, [name]: value })

  const textField = (
    name: Exclude<BillingField, "country">,
    label: string,
    placeholder: string,
    className?: string
  ) => (
    <Field className={className}>
      {/* Old billing form: 14px dark labels, #e5e5e5 inputs */}
      <FieldLabel
        htmlFor={`billing-${name}`}
        className="text-sm leading-normal text-foreground"
      >
        {label}
      </FieldLabel>
      <Input
        id={`billing-${name}`}
        name={name}
        placeholder={placeholder}
        value={formData[name]}
        onChange={(e) => set(name, e.target.value)}
        className="border-border"
      />
    </Field>
  )

  return (
    <div className="w-full">
      <TitleHeader variant="workspace" title="Billing Details" />

      <WorkspacePageBody>
        <WorkspaceCard>
          <div className="mb-6">
            <h2 className="mb-2 text-lg font-semibold text-foreground">
              Billing Address
            </h2>
            <p className="text-sm leading-normal text-muted-foreground">
              This address is used for tax purposes and your invoices.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-5">
            {textField(
              "street",
              "Street Address",
              "e.g. 123 Main St, Apt 4B",
              "col-span-2"
            )}
            {textField("city", "City", "New York")}
            {textField("state", "State / Province", "NY")}
            {textField("zip", "Zip / Postal Code", "10001")}
            <Field>
              <FieldLabel className="text-sm leading-normal text-foreground">
                Country
              </FieldLabel>
              <ModernDropdown
                value={formData.country}
                options={COUNTRIES}
                onChange={(value) => set("country", value)}
              />
            </Field>

            <div className="col-span-2 mt-4 flex justify-end">
              <Button size="md" onClick={handleSave}>
                {saved ? (
                  <>
                    <Check className="size-4" />
                    Saved
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </div>
          </div>
        </WorkspaceCard>

        <WorkspaceCard className="my-6">
          <div className="mb-6">
            <h2 className="mb-2 text-lg font-semibold text-foreground">
              Payout Method
            </h2>
            <p className="text-sm leading-normal text-muted-foreground">
              Connect your bank account or debit card to receive earnings.
            </p>
          </div>
          <div className="rounded-lg border border-dashed bg-muted p-6 text-center">
            <p className="font-medium text-foreground">
              Stripe Connect Integration
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              This module will be implemented next.
            </p>
            <Button
              variant="outline"
              size="md"
              className="mt-4 text-muted-foreground"
              disabled
            >
              Connect Stripe
            </Button>
          </div>
        </WorkspaceCard>
      </WorkspacePageBody>
    </div>
  )
}
