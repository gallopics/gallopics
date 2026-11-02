import { Link, useLocation } from "react-router"
import { useQuery } from "@tanstack/react-query"
import { Wallet } from "lucide-react"

import { useAuth } from "@/context/AuthContext"
import { useWorkspace } from "@/context/WorkspaceContext"
import { stripeStatusQueryOptions } from "@/data/queries/stripe"
import { Button } from "@/components/ui/button"

/** Studio reminder for approved photographers who can't be paid yet */
export function StripeConnectBanner() {
  const { user, isPhotographer } = useAuth()
  const { basePath, isAdmin } = useWorkspace()
  const { pathname } = useLocation()

  const canConnect =
    !isAdmin && isPhotographer && user?.approvalStatus === "approved"
  const onPayoutsPage = pathname === `${basePath}/billing`

  // The saved status (no Stripe call); the Payouts page refreshes it
  const { data: status = null } = useQuery({
    ...stripeStatusQueryOptions(),
    enabled: canConnect && !onPayoutsPage,
    select: (connect) => connect.status,
  })

  if (
    !canConnect ||
    onPayoutsPage ||
    (status !== "not_connected" && status !== "action_needed")
  ) {
    return null
  }

  return (
    <div className="flex items-center gap-3 border-b bg-primary/6 px-6 py-3 max-md:flex-wrap max-md:px-4">
      <Wallet className="size-4.5 shrink-0 text-primary" />
      <p className="flex-1 text-sm leading-normal text-foreground">
        {status === "not_connected"
          ? "Connect Stripe to receive your earnings."
          : "Stripe needs a few more details before it can pay you."}
      </p>
      <Button
        size="sm"
        nativeButton={false}
        render={<Link to={`${basePath}/billing`} />}
      >
        {status === "not_connected" ? "Connect Stripe" : "Continue setup"}
      </Button>
    </div>
  )
}
