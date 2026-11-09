import { useState } from "react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogBody,
  DialogCancel,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import type { AuthStep } from "@/components/auth/authHelpers"
import { RegisterForm } from "@/components/auth/RegisterForm"
import { SignInForm } from "@/components/auth/SignInForm"

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
  initialTab?: "signin" | "register"
  initialAccountType?: "photographer" | "buyer"
  onSwitchTab?: () => void
}

const STEP_COPY: Record<
  AuthStep,
  { title: string; cta: string; busyCta: string }
> = {
  signin: { title: "Sign in", cta: "Sign in", busyCta: "Signing in..." },
  signin_code: {
    title: "Check your email",
    cta: "Verify",
    busyCta: "Verifying...",
  },
  forgot: { title: "Reset password", cta: "Send code", busyCta: "Sending..." },
  forgot_reset: {
    title: "Reset password",
    cta: "Save new password",
    busyCta: "Saving...",
  },
  register: {
    title: "Create account",
    cta: "Create account",
    busyCta: "Creating account...",
  },
  register_code: {
    title: "Verify your email",
    cta: "Verify email",
    busyCta: "Verifying...",
  },
}

export function AuthModal({
  isOpen,
  onClose,
  initialTab = "signin",
  onSwitchTab,
}: AuthModalProps) {
  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
    >
      {/* Old auth modal rendered 608px wide */}
      <DialogContent className="sm:max-w-152">
        {/* Mounted only while open (and again on a tab switch), so state starts fresh */}
        <AuthContent
          key={initialTab}
          activeTab={initialTab}
          onClose={onClose}
          onSwitchTab={onSwitchTab}
        />
      </DialogContent>
    </Dialog>
  )
}

// Sign-in and sign-up work on every screen size (the studio works on phones too)
function AuthContent({
  activeTab,
  onClose,
  onSwitchTab,
}: {
  activeTab: "signin" | "register"
  onClose: () => void
  onSwitchTab?: () => void
}) {
  const [isLoading, setIsLoading] = useState(false)
  const [step, setStep] = useState<AuthStep>(activeTab)
  const copy = STEP_COPY[step]
  const isFirstStep = step === "signin" || step === "register"

  return (
    <>
      <DialogHeader>
        <DialogTitle>{copy.title}</DialogTitle>
      </DialogHeader>

      <DialogBody>
        {activeTab === "signin" ? (
          <SignInForm
            step={step}
            setStep={setStep}
            isLoading={isLoading}
            setIsLoading={setIsLoading}
            onClose={onClose}
          />
        ) : (
          <RegisterForm
            step={step}
            setStep={setStep}
            isLoading={isLoading}
            setIsLoading={setIsLoading}
            onClose={onClose}
          />
        )}
      </DialogBody>

      <DialogFooter className="flex-col gap-4 pb-6 sm:flex-col sm:justify-start">
        <div className="flex w-full gap-3">
          <DialogCancel className="flex-1" disabled={isLoading} />
          <Button
            type="submit"
            form="auth-main-form"
            className="flex-2"
            disabled={isLoading}
          >
            {isLoading ? copy.busyCta : copy.cta}
          </Button>
        </div>

        {step === "register" && (
          <p className="text-center text-xs leading-[1.4] text-muted-foreground">
            By continuing, you agree to our{" "}
            <a
              href="/terms"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline"
            >
              Terms
            </a>{" "}
            and{" "}
            <a
              href="/privacy"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline"
            >
              Privacy Policy
            </a>
            .
          </p>
        )}

        {onSwitchTab && isFirstStep && (
          <div className="flex items-center justify-center gap-1 border-t pt-3 text-[0.8125rem]">
            <span className="text-muted-foreground">
              {activeTab === "signin" ? "New user?" : "Already registered?"}
            </span>
            <Button
              variant="link"
              className="h-auto border-0 p-0 text-[0.8125rem] leading-normal"
              onClick={onSwitchTab}
            >
              {activeTab === "signin" ? "Register here" : "Sign in now"}
            </Button>
          </div>
        )}
      </DialogFooter>
    </>
  )
}
