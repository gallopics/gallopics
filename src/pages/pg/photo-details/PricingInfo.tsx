import { useQuery } from "@tanstack/react-query"
import { ChevronLeft, ExternalLink, X } from "lucide-react"

import { salesQueryOptions } from "@/data/queries/sales"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"

export function PricingInfo({
  onBack,
  onClose,
}: {
  onBack: () => void
  onClose: () => void
}) {
  const salesQuery = useQuery(salesQueryOptions())
  const commissionPercent = salesQuery.data?.commission_percent
  return (
    <div className="absolute inset-0 z-10 flex animate-in flex-col bg-card duration-200 fade-in-0">
      <div className="flex h-16 shrink-0 items-center justify-between border-b px-6">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onBack}
            aria-label="Back"
          >
            <ChevronLeft />
          </Button>
          <span className="text-base font-semibold">Info</span>
        </div>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={onClose}
          aria-label="Close"
        >
          <X />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 leading-[1.3]">
        <div className="mb-6">
          <div className="mb-4 text-sm font-semibold text-foreground">
            Quality info
          </div>
          <div className="flex flex-col gap-4">
            {[
              ["Web quality", "Best for screen and social media."],
              ["High quality", "Best for print and large displays."],
              ["Commercial use", "Best for print and large displays."],
            ].map(([name, text]) => (
              <div key={name}>
                <div className="mb-0.5 text-sm font-medium text-foreground">
                  {name}
                </div>
                <div className="text-[0.8125rem] text-muted-foreground">
                  {text}
                </div>
              </div>
            ))}
            <div className="text-xs leading-normal text-muted-foreground/70">
              Gallopics automatically delivers the right resolution—no extra
              prep needed.
            </div>
          </div>
        </div>

        <div className="mb-6 border-b border-muted" />

        <div className="mb-6">
          <div className="mb-4 text-sm font-semibold text-foreground">
            Earnings split
          </div>
          <div className="flex flex-col gap-2">
            {(
              [
                [
                  "Photographer",
                  commissionPercent === undefined
                    ? undefined
                    : 100 - commissionPercent,
                ],
                ["Gallopics", commissionPercent],
              ] as const
            ).map(([name, share]) => (
              <div key={name} className="flex justify-between text-sm">
                <span className="text-muted-foreground">{name}</span>
                <span className="font-semibold text-foreground">
                  {share !== undefined ? (
                    `${share}%`
                  ) : salesQuery.isError ? (
                    "—"
                  ) : (
                    <Skeleton className="inline-block h-[0.8em] w-8 align-middle" />
                  )}
                </span>
              </div>
            ))}
            <div className="mt-2 text-[0.8125rem] leading-normal text-muted-foreground/70">
              Taxes depend on your status (freelancer vs business). Receipts are
              generated automatically.
            </div>
          </div>
        </div>
      </div>

      {/* New tab, so an unsaved edit in the Sheet is never lost */}
      <div className="flex shrink-0 items-center justify-center gap-5 border-t px-6 py-3 text-xs text-muted-foreground">
        {[
          { label: "Terms", href: "/terms" },
          { label: "Privacy", href: "/privacy" },
          { label: "FAQ", href: "/faq" },
        ].map(({ label, href }) => (
          <a
            key={href}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 transition-colors hover:text-foreground"
          >
            {label}
            <ExternalLink className="size-3" aria-hidden />
            <span className="sr-only">(opens in a new tab)</span>
          </a>
        ))}
      </div>
    </div>
  )
}
