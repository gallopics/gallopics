import { StripeConnectCard } from "@/components/StripeConnectCard"
import { TitleHeader } from "@/components/TitleHeader"
import { WorkspacePageBody } from "@/components/WorkspacePageBody"

/**
 * Payouts (route /pg/billing): the photographer's Stripe account.
 * The old billing-address form was never saved; Stripe's onboarding collects the address.
 */
export function PhotographerBilling() {
  return (
    <div className="w-full">
      <TitleHeader variant="workspace" title="Payouts" />

      <WorkspacePageBody>
        <StripeConnectCard />
      </WorkspacePageBody>
    </div>
  )
}
