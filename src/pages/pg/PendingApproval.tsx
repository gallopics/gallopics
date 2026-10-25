import { useState } from "react"
import { useNavigate } from "react-router"
import { useQueryClient } from "@tanstack/react-query"
import { Clock3, House, RefreshCw, ShieldCheck } from "lucide-react"

import { cn } from "@/lib/utils"
import { useAuth } from "@/context/AuthContext"
import { photographerProfileQueryOptions } from "@/data/queries/account"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Header } from "@/components/Header"
import { heroCardBackground } from "@/components/HomeHero"

const STEPS = [
  {
    title: "1. Account created",
    text: "Your photographer profile is now registered in Gallopics.",
  },
  {
    title: "2. Admin approval",
    text: "A Gallopics admin approves photographer access.",
  },
  {
    title: "3. Studio unlocked",
    text: "Use refresh status here, or sign in again, to enter your workspace.",
  },
]

export function PendingApproval() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [isRefreshing, setIsRefreshing] = useState(false)
  // Rejected sign-ups are stored as "suspended" by the API
  const isRejected = user?.approvalStatus === "suspended"
  const [refreshMessage, setRefreshMessage] = useState<string | null>(null)

  const handleRefreshStatus = async () => {
    setIsRefreshing(true)
    setRefreshMessage(null)

    try {
      // Approval is set by a Gallopics admin in our database
      const photographer = await queryClient.fetchQuery({
        ...photographerProfileQueryOptions(),
        staleTime: 0,
      })
      if (photographer?.status === "approved") {
        window.location.assign("/pg/events")
        return
      }

      setRefreshMessage(
        isRejected
          ? "Your application is still not approved."
          : "Approval is still pending. Please check again later."
      )
    } catch {
      setRefreshMessage(
        "Unable to refresh approval status right now. Please try again."
      )
    } finally {
      setIsRefreshing(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <section className="pt-8 pb-12 md:pt-10 md:pb-16">
        <div className="container">
          <div
            className={cn(
              "grid grid-cols-1 items-stretch gap-6",
              !isRejected && "lg:grid-cols-[minmax(0,1.1fr)_360px]"
            )}
          >
            <div
              style={heroCardBackground.style}
              className={cn(
                heroCardBackground.className,
                "flex min-h-105 flex-col justify-between"
              )}
            >
              <div className="flex max-w-155 flex-col gap-5">
                <div className="inline-flex items-center gap-2 self-start rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium text-white/90 backdrop-blur">
                  <Clock3 className="size-4" />
                  {isRejected
                    ? "Photographer access"
                    : "Photographer access review"}
                </div>

                <div className="flex flex-col gap-4">
                  <h1 className="font-heading text-5xl leading-[1.02] font-semibold tracking-[-0.03em] text-white max-[375px]:text-[2.3rem] max-md:text-[2.75rem]">
                    {isRejected
                      ? "Application not approved"
                      : "Approval pending"}
                  </h1>
                  <p className="max-w-[56ch] text-[1.05rem] leading-[1.75] text-white/90">
                    {isRejected
                      ? "A Gallopics admin did not approve your photographer account. If you think this is a mistake, please contact Gallopics."
                      : `${user?.displayName || "Your account"} is registered and ready. A Gallopics admin just needs to approve photographer workspace access before you can start uploading galleries and managing events.`}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <Button
                    className="h-12 px-6 text-[0.95rem]"
                    onClick={handleRefreshStatus}
                    disabled={isRefreshing}
                  >
                    <RefreshCw className="size-4" />
                    {isRefreshing ? "Checking status..." : "Refresh status"}
                  </Button>
                  <Button
                    variant="outline"
                    className="h-12 border-white/30 bg-white px-6 text-[0.95rem] text-foreground hover:border-white/30 hover:bg-white/90"
                    onClick={() => navigate("/")}
                    disabled={isRefreshing}
                  >
                    <House className="size-4" />
                    Back to home
                  </Button>
                </div>

                {refreshMessage && (
                  <p className="text-sm leading-[1.6] text-white/75">
                    {refreshMessage}
                  </p>
                )}
              </div>
            </div>

            {/* The review steps don't apply once an application is rejected */}
            {!isRejected && (
              <Card className="gap-5 self-stretch p-6 md:p-7">
                <div className="flex size-12 items-center justify-center rounded-2xl bg-background text-primary">
                  <ShieldCheck className="size-5.5" />
                </div>

                <div>
                  <h2 className="text-xl leading-[1.2] font-semibold text-foreground">
                    What happens next
                  </h2>
                  <p className="mt-3 text-[0.95rem] leading-[1.65] text-muted-foreground">
                    We review new photographer accounts before unlocking the
                    studio. Once approved by admin, your access will update
                    after a refresh or a new sign-in.
                  </p>
                </div>

                <div className="flex flex-col gap-3">
                  {STEPS.map((step) => (
                    <div
                      key={step.title}
                      className="rounded-2xl bg-background px-4 py-3"
                    >
                      <div className="text-sm font-semibold text-foreground">
                        {step.title}
                      </div>
                      <div className="mt-1 text-sm leading-[1.6] text-muted-foreground">
                        {step.text}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}
