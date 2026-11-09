import { useNavigate } from "react-router"

import { Button } from "@/components/ui/button"
import { Header } from "@/components/Header"
import { ProfileFields, useProfileForm } from "@/components/ProfileForm"

export function OnboardingProfile() {
  const navigate = useNavigate()
  const form = useProfileForm()

  const handleContinue = async () => {
    if (await form.save({ hasCompletedOnboarding: true })) {
      navigate("/pg/pending-approval")
    }
  }

  // Saves nothing from the form; it can all be added later in Edit profile
  const handleSkip = async () => {
    if (await form.skip()) navigate("/pg/pending-approval")
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="mx-auto w-full max-w-130 px-5 py-15">
        <h1 className="mb-1 text-center text-[1.875rem] font-bold text-foreground">
          Let's set up your profile
        </h1>
        <p className="mb-8 text-center text-muted-foreground">
          Add a photo and your location so buyers know who you are.
        </p>

        <div className="rounded-xl border bg-card p-8 max-[430px]:p-5">
          <ProfileFields form={form} />

          {/* CTAs */}
          <Button
            className="mt-8 w-full"
            onClick={handleContinue}
            disabled={form.isSaving}
          >
            {form.isSaving ? "Saving..." : "Continue"}
          </Button>
          <Button
            variant="ghost"
            className="mt-2 w-full font-normal hover:bg-transparent"
            onClick={handleSkip}
            disabled={form.isSaving}
          >
            Skip for now
          </Button>
        </div>
      </div>
    </div>
  )
}
