import { useEffect, useState } from "react"
import { Check, ShieldCheck, Zap } from "lucide-react"

import { cn } from "@/lib/utils"
import {
  api,
  type CheckoutLineItem,
  type CheckoutOrder,
} from "@/data/apiClient"
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"

// TODO: Klarna is being replaced by Stripe (see the Stripe task).
declare global {
  interface Window {
    Klarna?: {
      Payments: {
        init: (config: { client_token: string }) => void
        load: (
          options: {
            container: string
            payment_method_category?: string
          },
          data: Record<string, never>,
          callback: (response: { show_form?: boolean; error?: unknown }) => void
        ) => void
        authorize: (
          options: { payment_method_category?: string },
          data: Record<string, never>,
          callback: (response: {
            approved?: boolean
            authorization_token?: string
            error?: unknown
          }) => void
        ) => void
      }
    }
  }
}

const KLARNA_SCRIPT = "https://x.klarnacdn.net/kp/lib/v1/api.js"

interface CheckoutPanelProps {
  total: number
  lineItems?: CheckoutLineItem[]
  onPaymentSuccess?: (order: CheckoutOrder) => void
  onPay?: (email: string, method: string) => void
}

export function CheckoutPanel({
  total,
  lineItems,
  onPaymentSuccess,
  onPay,
}: CheckoutPanelProps) {
  // Prefill with the last receipt email used on this device
  const [email, setEmail] = useState(
    () =>
      sessionStorage.getItem("gallopics_receipt_email") ||
      localStorage.getItem("gallopics_receipt_email") ||
      ""
  )
  const [klarnaStep, setKlarnaStep] = useState<
    "idle" | "loading" | "ready" | "authorizing" | "complete"
  >("idle")
  const [klarnaOrderId, setKlarnaOrderId] = useState<string | null>(null)
  const [klarnaError, setKlarnaError] = useState<string | null>(null)
  const [scriptReady, setScriptReady] = useState(
    () => !!window.Klarna?.Payments
  )

  // Load the Klarna SDK once
  useEffect(() => {
    if (window.Klarna?.Payments) return

    const existing = document.querySelector<HTMLScriptElement>(
      `script[src="${KLARNA_SCRIPT}"]`
    )
    if (existing) {
      existing.addEventListener("load", () => setScriptReady(true), {
        once: true,
      })
      return
    }

    const script = document.createElement("script")
    script.src = KLARNA_SCRIPT
    script.async = true
    script.onload = () => setScriptReady(true)
    script.onerror = () => setKlarnaError("Could not load Klarna checkout.")
    document.head.appendChild(script)
  }, [])

  const handleStartKlarna = async () => {
    if (!lineItems?.length) {
      onPay?.(email, "klarna")
      return
    }

    setKlarnaError(null)
    setKlarnaStep("loading")

    try {
      const session = await api.createCheckoutSession(lineItems, email)
      setKlarnaOrderId(session.order_id)

      if (!window.Klarna?.Payments) {
        throw new Error("Klarna is still loading. Try again in a moment.")
      }

      window.Klarna.Payments.init({ client_token: session.client_token })
      window.Klarna.Payments.load(
        {
          container: "#klarna-payments-container",
          payment_method_category: "pay_now",
        },
        {},
        (response) => {
          if (response.show_form) {
            setKlarnaStep("ready")
          } else {
            setKlarnaStep("idle")
            setKlarnaError("Klarna is not available for this checkout.")
          }
        }
      )
    } catch (error) {
      setKlarnaStep("idle")
      setKlarnaError(
        error instanceof Error
          ? error.message
          : "Could not start Klarna checkout."
      )
    }
  }

  const handleAuthorizeKlarna = () => {
    if (!klarnaOrderId || !window.Klarna?.Payments) return

    setKlarnaError(null)
    setKlarnaStep("authorizing")
    window.Klarna.Payments.authorize(
      { payment_method_category: "pay_now" },
      {},
      async (response) => {
        if (!response.approved || !response.authorization_token) {
          setKlarnaStep("ready")
          setKlarnaError("Klarna did not approve this payment.")
          return
        }

        try {
          const order = await api.authorizeCheckout(
            klarnaOrderId,
            response.authorization_token
          )
          setKlarnaStep("complete")
          onPaymentSuccess?.(order)
        } catch (error) {
          setKlarnaStep("ready")
          setKlarnaError(
            error instanceof Error
              ? error.message
              : "Payment was approved by Klarna but could not be completed."
          )
        }
      }
    )
  }

  const isEmailValid = /\S+@\S+\.\S+/.test(email)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!isEmailValid) return
    sessionStorage.setItem("gallopics_receipt_email", email)
    localStorage.setItem("gallopics_receipt_email", email)
    if (klarnaStep === "ready") {
      handleAuthorizeKlarna()
      return
    }
    void handleStartKlarna()
  }

  const isBusy = klarnaStep === "loading" || klarnaStep === "authorizing"

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

        <div className={cn(!isEmailValid && "pointer-events-none opacity-50")}>
          <div className="mb-3 text-sm font-semibold">Payment</div>
          <div className="flex items-center gap-4 rounded-xl border border-foreground bg-background px-4 py-3.5 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#ffb3c7] text-black">
              <span className="text-[1.2rem] font-black tracking-[-1px]">
                K.
              </span>
            </div>
            <div className="flex flex-1 flex-col gap-0.5">
              <span className="text-sm font-bold text-foreground">Klarna</span>
              <span className="text-xs text-muted-foreground">
                Secure checkout, instant capture
              </span>
            </div>
            <ShieldCheck className="size-5 text-success" />
          </div>

          <div id="klarna-payments-container" className="mt-4" />

          {klarnaError && (
            <FieldError className="mt-3 text-[0.8125rem] font-medium">
              {klarnaError}
            </FieldError>
          )}

          {klarnaStep === "complete" && (
            <p className="mt-3 text-[0.8125rem] font-semibold text-success">
              Payment captured. Your Gallopics receipt has been sent by email.
            </p>
          )}
        </div>

        <Button
          type="submit"
          size="lg"
          className="mt-2 w-full font-bold"
          disabled={
            !isEmailValid || !scriptReady || isBusy || klarnaStep === "complete"
          }
        >
          {isBusy ? (
            <>
              <Spinner className="size-4.5" />
              {klarnaStep === "loading"
                ? "Loading Klarna"
                : "Completing payment"}
            </>
          ) : klarnaStep === "ready" ? (
            `Complete payment ${total} SEK`
          ) : (
            `Pay ${total} SEK with Klarna`
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
