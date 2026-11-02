import { useCallback, useEffect, useRef, useState } from "react"
import { useSearchParams } from "react-router"
import { useUser } from "@clerk/clerk-react"
import { useQuery } from "@tanstack/react-query"
import { ExternalLink } from "lucide-react"

import { api, ApiError, type StripeConnectStatus } from "@/data/apiClient"
import { stripeLiveStatusQueryOptions } from "@/data/queries/stripe"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { WorkspaceCard } from "@/components/WorkspacePageBody"

const STATUS_COPY: Record<
  StripeConnectStatus["status"],
  {
    badge?: { label: string; variant: "success" | "warning" | "secondary" }
    text: (payoutDay: string) => string
  }
> = {
  not_connected: {
    text: (day) =>
      `Connect a Stripe account to receive your earnings. Stripe pays your balance to your bank on the ${day} of each month.`,
  },
  action_needed: {
    badge: { label: "Action needed", variant: "warning" },
    text: () =>
      "Stripe needs a few more details before it can pay you. It only takes a few minutes.",
  },
  pending: {
    badge: { label: "Verifying", variant: "secondary" },
    text: () =>
      "Stripe is checking your details. This usually takes a few minutes, sometimes a few days.",
  },
  active: {
    badge: { label: "Connected", variant: "success" },
    text: (day) =>
      `You're all set. Your earnings are paid to your bank on the ${day} of each month.`,
  },
}

const ordinal = (n: number) =>
  `${n}${n % 10 === 1 && n !== 11 ? "st" : n % 10 === 2 && n !== 12 ? "nd" : n % 10 === 3 && n !== 13 ? "rd" : "th"}`

const errorMessage = (err: unknown, fallback: string) =>
  err instanceof ApiError && [400, 403, 409].includes(err.status)
    ? err.message
    : fallback

/** Payouts card: connect a Stripe account, see its status, open its dashboard */
export function StripeConnectCard() {
  const { user: clerkUser } = useUser()
  const email = clerkUser?.primaryEmailAddress?.emailAddress
  const [searchParams, setSearchParams] = useSearchParams()
  // ?stripe=return / ?stripe=refresh: Stripe sent the photographer back here
  const [stripeParam] = useState(() => searchParams.get("stripe"))
  // Opening Stripe (on ?stripe=refresh, right away)
  const [isOpeningStripe, setIsOpeningStripe] = useState(
    stripeParam === "refresh"
  )
  const [linkError, setLinkError] = useState<string | null>(null)
  // Some sign-ins (e.g. username only) have no email, but Stripe requires one
  const [manualEmail, setManualEmail] = useState("")

  // Read from Stripe once per visit (also refreshes the banner's saved status).
  // No refetch on focus and no retries: each read calls Stripe.
  const statusQuery = useQuery({
    ...stripeLiveStatusQueryOptions(),
    enabled: stripeParam !== "refresh",
    staleTime: 0,
    gcTime: 0,
    refetchOnWindowFocus: false,
    retry: false,
  })
  const connect = statusQuery.data ?? null
  const busy: "link" | "refresh" | null = isOpeningStripe
    ? "link"
    : statusQuery.isFetching
      ? "refresh"
      : null
  const error =
    linkError ??
    (statusQuery.isError && !statusQuery.isFetching
      ? errorMessage(statusQuery.error, "Could not load your Stripe status.")
      : null)

  const contactEmail = email || manualEmail.trim() || undefined
  const needsEmail = !email && connect?.status === "not_connected"
  const manualEmailValid = /\S+@\S+\.\S+/.test(manualEmail.trim())

  const firstLoadStarted = useRef(false)

  // Onboarding and dashboard links are single-use: plain calls, never queries
  const openStripe = useCallback(
    async (kind: "onboarding" | "dashboard", tab: Window | null) => {
      try {
        const { url } = await (kind === "onboarding"
          ? api.createStripeOnboardingLink(contactEmail)
          : api.createStripeDashboardLink())
        if (tab) {
          tab.location.href = url
          setIsOpeningStripe(false)
        } else {
          window.location.assign(url)
        }
      } catch (err) {
        tab?.close()
        setIsOpeningStripe(false)
        setLinkError(
          errorMessage(err, "Could not open Stripe. Please try again.")
        )
      }
    },
    [contactEmail]
  )

  const goToStripe = (kind: "onboarding" | "dashboard") => {
    setLinkError(null)
    setIsOpeningStripe(true)
    // The dashboard opens in a new tab. Opened during the click (blocked after
    // the await), then sent to Stripe; onboarding stays here, Stripe returns to Payouts
    const tab = kind === "dashboard" ? window.open("", "_blank") : null
    if (tab) tab.opener = null
    void openStripe(kind, tab)
  }

  const loadStatus = () => {
    setLinkError(null)
    void statusQuery.refetch()
  }

  useEffect(() => {
    // Exactly once: React re-runs effects in dev, and each extra run would
    // create another single-use Stripe link
    if (firstLoadStarted.current) return
    firstLoadStarted.current = true
    if (stripeParam) {
      setSearchParams(
        (params) => {
          params.delete("stripe")
          return params
        },
        { replace: true }
      )
    }
    // The onboarding link expired or was reused: open a fresh one
    if (stripeParam === "refresh") {
      // The account exists already, so no email is needed
      api
        .createStripeOnboardingLink()
        .then(({ url }) => window.location.assign(url))
        .catch((err) => {
          setIsOpeningStripe(false)
          setLinkError(
            errorMessage(err, "Could not open Stripe. Please try again.")
          )
        })
    }
  }, [setSearchParams, stripeParam])

  const payoutDay = ordinal(connect?.payout_day_of_month ?? 15)
  const copy = connect ? STATUS_COPY[connect.status] : null

  return (
    <WorkspaceCard className="my-6">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h2 className="mb-2 text-lg font-semibold text-foreground">
            Payouts
          </h2>
          <p className="text-sm leading-normal text-muted-foreground">
            Your earnings are paid through Stripe, our payment partner.
          </p>
        </div>
        {copy?.badge && (
          <Badge variant={copy.badge.variant}>{copy.badge.label}</Badge>
        )}
      </div>

      <div className="rounded-lg border bg-muted p-6">
        {!connect && !error ? (
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <Spinner className="size-4" />
            {stripeParam === "refresh"
              ? "Reopening Stripe…"
              : "Checking your Stripe account…"}
          </div>
        ) : (
          <>
            {copy && (
              <p className="text-sm leading-normal text-foreground">
                {copy.text(payoutDay)}
              </p>
            )}
            {error && (
              <p className="mt-2 text-sm font-medium text-destructive">
                {error}
              </p>
            )}

            {needsEmail && (
              <Field className="mt-4 max-w-90">
                <FieldLabel htmlFor="stripe-email">
                  Email for your Stripe account
                </FieldLabel>
                <Input
                  id="stripe-email"
                  type="email"
                  placeholder="you@example.com"
                  value={manualEmail}
                  onChange={(e) => setManualEmail(e.target.value)}
                  className="bg-card"
                />
                <FieldDescription className="text-xs">
                  Stripe sends account and payout updates here.
                </FieldDescription>
              </Field>
            )}

            <div className="mt-4 flex flex-wrap gap-3">
              {!connect && (
                <Button
                  variant="outline"
                  size="md"
                  onClick={loadStatus}
                  disabled={busy !== null}
                >
                  {busy === "refresh" && <Spinner className="size-4" />}
                  Try again
                </Button>
              )}
              {connect?.status === "not_connected" && (
                <Button
                  size="md"
                  onClick={() => goToStripe("onboarding")}
                  disabled={busy !== null || (needsEmail && !manualEmailValid)}
                >
                  {busy === "link" && <Spinner className="size-4" />}
                  Connect Stripe
                </Button>
              )}
              {connect?.status === "action_needed" && (
                <Button
                  size="md"
                  onClick={() => goToStripe("onboarding")}
                  disabled={busy !== null}
                >
                  {busy === "link" && <Spinner className="size-4" />}
                  Continue setup
                </Button>
              )}
              {connect?.status === "pending" && (
                <Button
                  variant="outline"
                  size="md"
                  onClick={loadStatus}
                  disabled={busy !== null}
                >
                  {busy === "refresh" && <Spinner className="size-4" />}
                  Check status
                </Button>
              )}
              {connect &&
                (connect.status === "active" || connect.status === "pending") &&
                connect.details_submitted && (
                  <Button
                    variant="outline"
                    size="md"
                    onClick={() => goToStripe("dashboard")}
                    disabled={busy !== null}
                  >
                    {busy === "link" ? (
                      <Spinner className="size-4" />
                    ) : (
                      <ExternalLink className="size-4" />
                    )}
                    Manage Stripe account
                  </Button>
                )}
            </div>
          </>
        )}
      </div>
    </WorkspaceCard>
  )
}
