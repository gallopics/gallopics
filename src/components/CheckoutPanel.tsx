import { useEffect, useState } from "react"
import { Check, CreditCard, ShieldCheck, Zap } from "lucide-react"

import { api, ApiError, type CheckoutItem } from "@/data/apiClient"
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"

interface CheckoutPanelProps {
  /** Shown on the button; the server sets the real price */
  total: number
  items: CheckoutItem[]
  /** Where "back" on Stripe's page returns to (a path on this site) */
  cancelPath?: string
}

/** The server's reason when it rejected the order, else a plain retry message */
function paymentErrorMessage(err: unknown) {
  if (err instanceof ApiError && [400, 404, 409].includes(err.status)) {
    return err.message
  }
  return "Could not start the payment. Please try again."
}

/** Receipt email + "Pay": sends the buyer to Stripe's hosted payment page */
export function CheckoutPanel({
  total,
  items,
  cancelPath,
}: CheckoutPanelProps) {
  // Prefill with the last receipt email used on this device
  const [email, setEmail] = useState(
    () =>
      sessionStorage.getItem("gallopics_receipt_email") ||
      localStorage.getItem("gallopics_receipt_email") ||
      ""
  )
  const [isRedirecting, setIsRedirecting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Back from Stripe: the browser may restore this page with the spinner still on
  useEffect(() => {
    const onPageShow = (e: PageTransitionEvent) => {
      if (e.persisted) setIsRedirecting(false)
    }
    window.addEventListener("pageshow", onPageShow)
    return () => window.removeEventListener("pageshow", onPageShow)
  }, [])

  const isEmailValid = /\S+@\S+\.\S+/.test(email)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isEmailValid || items.length === 0) return
    sessionStorage.setItem("gallopics_receipt_email", email)
    localStorage.setItem("gallopics_receipt_email", email)

    setError(null)
    setIsRedirecting(true)
    try {
      const session = await api.createCheckoutSession(items, email, cancelPath)
      window.location.assign(session.checkout_url)
    } catch (err) {
      setIsRedirecting(false)
      setError(paymentErrorMessage(err))
    }
  }

  return (
    <div className="bg-card">
      <h3 className="mb-6 text-xl font-bold text-foreground">Checkout</h3>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <Field>
          <FieldLabel htmlFor="email">Receipt email</FieldLabel>
          <Input
            type="email"
            id="email"
            placeholder="your@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <FieldDescription className="text-xs">
            We will send your Gallopics receipt and photo links to this email.
          </FieldDescription>
        </Field>

        <div>
          <div className="mb-3 text-sm font-semibold">Payment</div>
          <div className="flex items-center gap-4 rounded-xl border border-foreground bg-background px-4 py-3.5 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <CreditCard className="size-5" />
            </div>
            <div className="flex flex-1 flex-col gap-0.5">
              <span className="text-sm font-bold text-foreground">
                Card and more
              </span>
              <span className="text-xs text-muted-foreground">
                Secure checkout with Stripe
              </span>
            </div>
            <ShieldCheck className="size-5 text-success" />
          </div>

          {error && (
            <FieldError className="mt-3 text-[0.8125rem] font-medium">
              {error}
            </FieldError>
          )}
        </div>

        <Button
          type="submit"
          size="lg"
          className="mt-2 w-full font-bold"
          disabled={!isEmailValid || isRedirecting || items.length === 0}
        >
          {isRedirecting ? (
            <>
              <Spinner className="size-4.5" />
              Going to payment
            </>
          ) : (
            `Pay ${total} SEK`
          )}
        </Button>

        <div className="mt-2 border-t pt-6">
          <div className="mb-3 flex items-center justify-center gap-5 max-[480px]:flex-col max-[480px]:gap-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-success">
              <Check className="size-3.5" />
              <span>Secure payment</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
              <Zap className="size-3.5 text-foreground" />
              <span>Instant download</span>
            </div>
          </div>
          <div className="px-4 text-center text-xs leading-normal text-muted-foreground opacity-70">
            Your Gallopics receipt is sent after payment. Download links are
            available immediately. JPEG format.
          </div>
        </div>
      </form>
    </div>
  )
}
