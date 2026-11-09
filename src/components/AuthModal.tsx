import { useState } from "react"
import { useNavigate } from "react-router"
import { useClerk, useSignIn, useSignUp } from "@clerk/clerk-react"

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
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
  initialTab?: "signin" | "register"
  initialAccountType?: "photographer" | "buyer"
  onSwitchTab?: () => void
}

interface ClerkFieldErrorState {
  identifier?: string
  username?: string
  email?: string
  password?: string
  confirmPassword?: string
  firstName?: string
  lastName?: string
  code?: string
  form?: string
}

/**
 * signin → (signin_code: email code for a new device) → done
 * signin → forgot (email) → forgot_reset (code + new password) → done
 * register → register_code (email code) → onboarding
 */
type AuthStep =
  | "signin"
  | "signin_code"
  | "forgot"
  | "forgot_reset"
  | "register"
  | "register_code"

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

type SignInResult = Awaited<
  ReturnType<NonNullable<ReturnType<typeof useSignIn>["signIn"]>["create"]>
>
type SignUpResult = Awaited<
  ReturnType<NonNullable<ReturnType<typeof useSignUp>["signUp"]>["create"]>
>

const EMAIL_PATTERN = /^\S+@\S+\.\S+$/
const CODE_PATTERN = /^\d{6}$/
const MIN_PASSWORD_LENGTH = 8

const routerBase =
  import.meta.env.BASE_URL === "/"
    ? ""
    : import.meta.env.BASE_URL.replace(/\/$/, "")

const buildAbsoluteUrl = (path: string) =>
  new URL(`${routerBase}${path}`, window.location.origin).toString()

const buildClerkMetadata = (overrides?: Record<string, unknown>) => ({
  approvalStatus: "pending",
  hasCompletedOnboarding: false,
  role: "pg",
  ...overrides,
})

/** The first error of a Clerk API error: its code, the field it is about, its message */
const getFirstClerkError = (
  error: unknown
): { code?: string; paramName?: string; message?: string } => {
  if (typeof error !== "object" || error === null) {
    return {}
  }

  const candidate = error as {
    errors?: Array<{
      code?: string
      longMessage?: string
      message?: string
      meta?: { paramName?: string }
    }>
    longMessage?: string
    message?: string
  }
  const firstError = Array.isArray(candidate.errors)
    ? candidate.errors[0]
    : undefined

  return {
    code: firstError?.code,
    paramName: firstError?.meta?.paramName,
    message:
      firstError?.longMessage ||
      firstError?.message ||
      candidate.longMessage ||
      candidate.message,
  }
}

const getClerkErrorMessage = (error: unknown, fallback: string) =>
  getFirstClerkError(error).message || fallback

/** Clerk's field names → our form fields */
type ClerkParamFields = Record<string, keyof ClerkFieldErrorState>

/**
 * Each Clerk error under the field it is about (e.g. a taken username and a too-short
 * password at once), else under the form. One message per field: the first one.
 */
const getClerkErrorState = (
  error: unknown,
  fallback: string,
  fields: ClerkParamFields = {}
): ClerkFieldErrorState => {
  const clerkErrors =
    typeof error === "object" &&
    error !== null &&
    Array.isArray((error as { errors?: unknown }).errors)
      ? (error as { errors: unknown[] }).errors
      : []
  const state: ClerkFieldErrorState = {}

  for (const item of clerkErrors) {
    // Each item is a single Clerk error; read it like a one-error response
    const { paramName, message } = getFirstClerkError({ errors: [item] })
    const field = (paramName && fields[paramName]) || "form"
    if (message && !state[field]) state[field] = message
  }

  return Object.keys(state).length > 0
    ? state
    : { form: getClerkErrorMessage(error, fallback) }
}

// Clerk's "no account with that identifier" error
const IDENTIFIER_NOT_FOUND = "form_identifier_not_found"

const validateNewPassword = (
  password: string,
  confirmPassword: string,
  errors: ClerkFieldErrorState
) => {
  if (!password) {
    errors.password = "Password is required"
  } else if (password.length < MIN_PASSWORD_LENGTH) {
    errors.password = `Password must be at least ${MIN_PASSWORD_LENGTH} characters`
  }

  if (password !== confirmPassword) {
    errors.confirmPassword = "Passwords do not match"
  }
}

const validateCode = (code: string, errors: ClerkFieldErrorState) => {
  if (!CODE_PATTERN.test(code)) {
    errors.code = "Enter the 6-digit code from the email"
  }
}

// develop: Google/Apple sign-in (and the "or" divider) are hidden for now
const SHOW_SOCIAL_SIGN_IN = false

const getOAuthCallbackUrl = () => buildAbsoluteUrl("/auth/callback")

const getPostSignInUrl = () => buildAbsoluteUrl("/pg")

const getPostSignUpUrl = () => buildAbsoluteUrl("/pg/onboarding/profile")

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

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" className="size-5">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  )
}

function AppleIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="#000"
      className="size-5"
    >
      <path d="M17.05 20.28c-.98.95-2.05.88-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.78 1.18-.19 2.31-.89 3.51-.84 1.54.06 2.77.56 3.48 1.54-3.22 1.66-2.69 5.8 1.25 7.45-.63 1.75-1.61 3.16-3.32 4.04zM12.03 7.25c-.25-2.19 1.62-4.04 3.55-4.25.29 2.58-2.63 4.41-3.55 4.25z" />
    </svg>
  )
}

function OAuthButtons({
  onStart,
}: {
  onStart: (strategy: "oauth_google" | "oauth_apple") => void
}) {
  return (
    <>
      <div className="flex gap-2.5">
        <Button
          variant="outline"
          className="flex-1 font-medium"
          onClick={() => onStart("oauth_google")}
        >
          <GoogleIcon />
          Continue with Google
        </Button>
        <Button
          variant="outline"
          className="flex-1 font-medium"
          onClick={() => onStart("oauth_apple")}
        >
          <AppleIcon />
          Continue with Apple
        </Button>
      </div>
      <FieldSeparator className="my-6 text-xs leading-normal">
        or
      </FieldSeparator>
    </>
  )
}

function TextField({
  id,
  label,
  error,
  ...inputProps
}: React.ComponentProps<"input"> & {
  id: string
  label: string
  error?: string
}) {
  return (
    <Field data-invalid={!!error}>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <Input id={id} aria-invalid={!!error} {...inputProps} />
      <FieldError>{error}</FieldError>
    </Field>
  )
}

/** The 6-digit code from an email (numeric keyboard + code autofill on phones) */
function CodeField({
  value,
  onChange,
  error,
  disabled,
}: {
  value: string
  onChange: (value: string) => void
  error?: string
  disabled: boolean
}) {
  return (
    <TextField
      id="auth-code"
      label="Verification code"
      placeholder="6-digit code"
      inputMode="numeric"
      autoComplete="one-time-code"
      maxLength={6}
      autoFocus
      value={value}
      onChange={(e) => onChange(e.target.value.replace(/\D/g, "").slice(0, 6))}
      error={error}
      disabled={disabled}
    />
  )
}

/**
 * "We sent a code to …" for every code step. `ifAccount`: the password reset says the
 * same thing whether or not the email has an account, so nobody can probe for accounts.
 */
function CodeStepIntro({
  sentTo,
  ifAccount,
}: {
  sentTo: string
  ifAccount?: boolean
}) {
  const address = (
    <span className="font-medium wrap-anywhere text-foreground">{sentTo}</span>
  )
  return (
    <p className="text-sm leading-normal text-muted-foreground">
      {ifAccount ? (
        <>If an account uses {address}, we sent a 6-digit code to it.</>
      ) : (
        <>We sent a 6-digit code to {address}.</>
      )}{" "}
      It may take a minute to arrive; check your spam folder too.
    </p>
  )
}

function CodeStepLinks({
  onResend,
  onBack,
  backLabel,
  notice,
  disabled,
}: {
  onResend: () => void
  onBack: () => void
  backLabel: string
  notice?: string
  disabled: boolean
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 text-[0.8125rem]">
        <Button
          type="button"
          variant="link"
          className="h-auto border-0 p-0 text-[0.8125rem] leading-normal"
          onClick={onResend}
          disabled={disabled}
        >
          Resend code
        </Button>
        <Button
          type="button"
          variant="link"
          className="h-auto border-0 p-0 text-[0.8125rem] leading-normal text-muted-foreground"
          onClick={onBack}
          disabled={disabled}
        >
          {backLabel}
        </Button>
      </div>
      {notice && (
        <p className="text-[0.8125rem] text-muted-foreground" role="status">
          {notice}
        </p>
      )}
    </div>
  )
}

interface FormProps {
  step: AuthStep
  setStep: (step: AuthStep) => void
  isLoading: boolean
  setIsLoading: (value: boolean) => void
  onClose: () => void
}

function SignInForm({
  step,
  setStep,
  isLoading,
  setIsLoading,
  onClose,
}: FormProps) {
  const navigate = useNavigate()
  const clerk = useClerk()
  const { isLoaded, signIn } = useSignIn()
  const [formData, setFormData] = useState({ identifier: "", password: "" })
  const [reset, setReset] = useState({
    email: "",
    password: "",
    confirmPassword: "",
  })
  const [code, setCode] = useState("")
  // Where the current code was sent (Clerk's masked address for new-device codes)
  const [sentTo, setSentTo] = useState("")
  const [secondFactorEmailId, setSecondFactorEmailId] = useState("")
  // false: the reset email has no account (the screens still look the same)
  const [resetAccountFound, setResetAccountFound] = useState(true)
  const [notice, setNotice] = useState("")
  const [errors, setErrors] = useState<ClerkFieldErrorState>({})

  const goTo = (nextStep: AuthStep) => {
    setCode("")
    setNotice("")
    setErrors({})
    setStep(nextStep)
  }

  /** Finish the sign-in, or ask for the email code Clerk wants first */
  const continueSignIn = async (result: SignInResult) => {
    if (result.status === "complete" && result.createdSessionId) {
      await clerk.setActive({ session: result.createdSessionId })
      onClose()
      // Admins are sent on to /admin by the route guard
      navigate("/pg")
      return
    }

    // Password sign-in on a new device (Clerk Device Trust): confirm with a code
    // sent to the account email. Older instances report it as needs_second_factor.
    const status: string | null = result.status
    if (status === "needs_second_factor" || status === "needs_client_trust") {
      const emailFactor = result.supportedSecondFactors?.find(
        (factor) => factor.strategy === "email_code"
      )
      if (emailFactor && "emailAddressId" in emailFactor) {
        await result.prepareSecondFactor({
          strategy: "email_code",
          emailAddressId: emailFactor.emailAddressId,
        })
        setSecondFactorEmailId(emailFactor.emailAddressId)
        setSentTo(emailFactor.safeIdentifier)
        goTo("signin_code")
        return
      }
    }

    console.error("Clerk sign-in needs an unsupported step", result.status)
    setErrors({
      form: "This account needs a verification step we can't do here. Please contact support.",
    })
  }

  const runStep = async (
    action: () => Promise<void>,
    fallbackError: string,
    fields?: ClerkParamFields
  ) => {
    setIsLoading(true)
    setErrors({})
    setNotice("")
    try {
      await action()
    } catch (error) {
      console.error("Clerk sign-in error", error)
      setErrors(getClerkErrorState(error, fallbackError, fields))
    } finally {
      setIsLoading(false)
    }
  }

  // Looks like a server round trip, so a missing account can't be told apart by timing
  const pause = () => new Promise((resolve) => setTimeout(resolve, 700))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isLoaded) return

    const nextErrors: ClerkFieldErrorState = {}

    if (step === "signin") {
      if (!formData.identifier.trim()) {
        nextErrors.identifier = "Enter your username or email"
      }
      if (!formData.password) {
        nextErrors.password = "Password is required"
      }
      setErrors(nextErrors)
      if (Object.keys(nextErrors).length > 0) return

      await runStep(
        async () => {
          const result = await signIn.create({
            identifier: formData.identifier.trim(),
            password: formData.password,
          })
          await continueSignIn(result)
        },
        "Unable to sign in with those credentials.",
        { identifier: "identifier", password: "password" }
      )
      return
    }

    if (step === "signin_code") {
      validateCode(code, nextErrors)
      setErrors(nextErrors)
      if (Object.keys(nextErrors).length > 0) return

      await runStep(
        async () => {
          const result = await signIn.attemptSecondFactor({
            strategy: "email_code",
            code,
          })
          await continueSignIn(result)
        },
        "That code didn't work. Please try again.",
        { code: "code" }
      )
      return
    }

    if (step === "forgot") {
      const email = reset.email.trim()
      if (!EMAIL_PATTERN.test(email)) {
        nextErrors.email = "Enter the email address of your account"
      }
      setErrors(nextErrors)
      if (Object.keys(nextErrors).length > 0) return

      await runStep(
        async () => {
          try {
            await signIn.create({
              strategy: "reset_password_email_code",
              identifier: email,
            })
            setResetAccountFound(true)
          } catch (error) {
            // No account with this email: carry on as if a code was sent
            if (getFirstClerkError(error).code !== IDENTIFIER_NOT_FOUND) {
              throw error
            }
            setResetAccountFound(false)
          }
          setSentTo(email)
          goTo("forgot_reset")
        },
        "Unable to send a reset code right now.",
        { identifier: "email", email_address: "email" }
      )
      return
    }

    if (step === "forgot_reset") {
      validateCode(code, nextErrors)
      validateNewPassword(reset.password, reset.confirmPassword, nextErrors)
      setErrors(nextErrors)
      if (Object.keys(nextErrors).length > 0) return

      await runStep(
        async () => {
          if (!resetAccountFound) {
            // No code was sent, so any code is wrong (same message as Clerk's)
            await pause()
            setErrors({ code: "Incorrect code" })
            return
          }
          // Code first, then the new password. Already "needs_new_password" when the
          // code was right but Clerk rejected the password (e.g. too short): the code is
          // used up, so only the password is sent again.
          const verified =
            signIn.status === "needs_new_password"
              ? signIn
              : await signIn.attemptFirstFactor({
                  strategy: "reset_password_email_code",
                  code,
                })
          if (verified.status !== "needs_new_password") {
            await continueSignIn(verified)
            return
          }
          // Signs every other device out: a reset should lock out whoever else
          // may have the old password (Clerk keeps them signed in otherwise)
          const result = await verified.resetPassword({
            password: reset.password,
            signOutOfOtherSessions: true,
          })
          await continueSignIn(result)
        },
        "Unable to reset your password right now.",
        { code: "code", password: "password" }
      )
    }
  }

  const resendCode = async () => {
    if (!isLoaded) return

    await runStep(async () => {
      if (step === "signin_code") {
        await signIn.prepareSecondFactor({
          strategy: "email_code",
          emailAddressId: secondFactorEmailId,
        })
      } else if (resetAccountFound) {
        // A new reset attempt sends a new code
        await signIn.create({
          strategy: "reset_password_email_code",
          identifier: reset.email.trim(),
        })
      } else {
        await pause()
      }
      setNotice("A new code is on its way.")
    }, "Unable to send a new code right now.")
  }

  const startOAuth = async (strategy: "oauth_google" | "oauth_apple") => {
    if (!isLoaded) {
      return
    }

    setIsLoading(true)
    setErrors({})

    try {
      await signIn.authenticateWithRedirect({
        strategy,
        redirectUrl: getOAuthCallbackUrl(),
        redirectUrlComplete: getPostSignInUrl(),
      })
    } catch (error) {
      console.error("Clerk OAuth sign-in error", error)
      setErrors({
        form: getClerkErrorMessage(error, "Unable to start social sign-in."),
      })
      setIsLoading(false)
    }
  }

  const update = (key: "identifier" | "password", value: string) => {
    setFormData({ ...formData, [key]: value })
    setErrors((current) => ({ ...current, [key]: undefined, form: undefined }))
  }

  const updateReset = (
    key: "email" | "password" | "confirmPassword",
    value: string
  ) => {
    setReset({ ...reset, [key]: value })
    setErrors((current) => ({
      ...current,
      [key]: undefined,
      form: undefined,
    }))
  }

  const updateCode = (value: string) => {
    setCode(value)
    setErrors((current) => ({ ...current, code: undefined, form: undefined }))
  }

  const openForgotPassword = () => {
    const identifier = formData.identifier.trim()
    // Typed an email to sign in: start the reset with it
    if (identifier.includes("@") && !reset.email) {
      setReset({ ...reset, email: identifier })
    }
    goTo("forgot")
  }

  return (
    <div>
      {SHOW_SOCIAL_SIGN_IN && step === "signin" && (
        <OAuthButtons onStart={startOAuth} />
      )}

      <form id="auth-main-form" onSubmit={handleSubmit} noValidate>
        <FieldGroup>
          {step === "signin" && (
            <>
              <TextField
                id="signin-identifier"
                label="Username or email"
                placeholder="Enter your username or email"
                autoComplete="username"
                autoCapitalize="none"
                spellCheck={false}
                value={formData.identifier}
                onChange={(e) => update("identifier", e.target.value)}
                error={errors.identifier}
                disabled={isLoading}
              />
              <div className="flex flex-col gap-2">
                <TextField
                  id="signin-password"
                  type="password"
                  label="Password"
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  value={formData.password}
                  onChange={(e) => update("password", e.target.value)}
                  error={errors.password}
                  disabled={isLoading}
                />
                <Button
                  type="button"
                  variant="link"
                  className="h-auto self-end border-0 p-0 text-[0.8125rem] leading-normal"
                  onClick={openForgotPassword}
                  disabled={isLoading}
                >
                  Forgot password?
                </Button>
              </div>
            </>
          )}

          {step === "signin_code" && (
            <>
              <p className="text-sm leading-normal text-muted-foreground">
                You're signing in on a new device. To confirm it's you, we sent
                a 6-digit code to{" "}
                <span className="font-medium wrap-anywhere text-foreground">
                  {sentTo}
                </span>
                .
              </p>
              <CodeField
                value={code}
                onChange={updateCode}
                error={errors.code}
                disabled={isLoading}
              />
              <CodeStepLinks
                onResend={resendCode}
                onBack={() => goTo("signin")}
                backLabel="Back to sign in"
                notice={notice}
                disabled={isLoading}
              />
            </>
          )}

          {step === "forgot" && (
            <>
              <p className="text-sm leading-normal text-muted-foreground">
                Enter the email address of your account and we'll send you a
                code to set a new password.
              </p>
              <TextField
                id="forgot-email"
                type="email"
                label="Email"
                placeholder="you@example.com"
                autoComplete="email"
                autoFocus
                value={reset.email}
                onChange={(e) => updateReset("email", e.target.value)}
                error={errors.email}
                disabled={isLoading}
              />
              <Button
                type="button"
                variant="link"
                className="h-auto self-start border-0 p-0 text-[0.8125rem] leading-normal text-muted-foreground"
                onClick={() => goTo("signin")}
                disabled={isLoading}
              >
                Back to sign in
              </Button>
            </>
          )}

          {step === "forgot_reset" && (
            <>
              <CodeStepIntro sentTo={sentTo} ifAccount />
              <CodeField
                value={code}
                onChange={updateCode}
                error={errors.code}
                disabled={isLoading}
              />
              <TextField
                id="forgot-password"
                type="password"
                label="New password"
                placeholder="Min 8 chars"
                autoComplete="new-password"
                value={reset.password}
                onChange={(e) => updateReset("password", e.target.value)}
                error={errors.password}
                disabled={isLoading}
              />
              <TextField
                id="forgot-confirm"
                type="password"
                label="Confirm new password"
                placeholder="Re-enter password"
                autoComplete="new-password"
                value={reset.confirmPassword}
                onChange={(e) => updateReset("confirmPassword", e.target.value)}
                error={errors.confirmPassword}
                disabled={isLoading}
              />
              <CodeStepLinks
                onResend={resendCode}
                onBack={() => goTo("forgot")}
                backLabel="Use a different email"
                notice={notice}
                disabled={isLoading}
              />
            </>
          )}

          <FieldError>{errors.form}</FieldError>
        </FieldGroup>
      </form>
    </div>
  )
}

type RegisterField =
  | "firstName"
  | "lastName"
  | "email"
  | "username"
  | "password"
  | "confirmPassword"

function RegisterForm({
  step,
  setStep,
  isLoading,
  setIsLoading,
  onClose,
}: FormProps) {
  const navigate = useNavigate()
  const clerk = useClerk()
  const { isLoaded, signUp } = useSignUp()
  const [formData, setFormData] = useState<Record<RegisterField, string>>({
    firstName: "",
    lastName: "",
    email: "",
    username: "",
    password: "",
    confirmPassword: "",
  })
  const [code, setCode] = useState("")
  const [notice, setNotice] = useState("")
  const [errors, setErrors] = useState<ClerkFieldErrorState>({})

  const validateDetails = () => {
    const nextErrors: ClerkFieldErrorState = {}

    if (!formData.firstName) {
      nextErrors.firstName = "First name is required"
    }

    if (!formData.lastName) {
      nextErrors.lastName = "Last name is required"
    }

    if (!formData.email.trim()) {
      nextErrors.email = "Email is required"
    } else if (!EMAIL_PATTERN.test(formData.email.trim())) {
      nextErrors.email = "Please enter a valid email"
    }

    if (!formData.username.trim()) {
      nextErrors.username = "Username is required"
    } else if (!/^[a-zA-Z0-9._-]{4,32}$/.test(formData.username.trim())) {
      nextErrors.username =
        "Use 4-32 letters, numbers, dots, dashes, or underscores"
    }

    validateNewPassword(formData.password, formData.confirmPassword, nextErrors)

    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const finishSignUp = async (result: SignUpResult) => {
    if (result.status === "complete" && result.createdSessionId) {
      await clerk.setActive({ session: result.createdSessionId })
      onClose()
      navigate("/pg/onboarding/profile")
      return true
    }
    return false
  }

  const runStep = async (
    action: () => Promise<void>,
    fallbackError: string
  ) => {
    setIsLoading(true)
    setErrors({})
    setNotice("")
    try {
      await action()
    } catch (error) {
      console.error("Clerk sign-up error", error)
      // Under the field it is about, if that field is on screen
      const fields: ClerkParamFields =
        step === "register"
          ? {
              first_name: "firstName",
              last_name: "lastName",
              email_address: "email",
              username: "username",
              password: "password",
            }
          : { code: "code" }
      setErrors(getClerkErrorState(error, fallbackError, fields))
    } finally {
      setIsLoading(false)
    }
  }

  const unfinishedError = (result: SignUpResult) => {
    console.error("Clerk sign-up is not complete", {
      status: result.status,
      missingFields: result.missingFields,
      unverifiedFields: result.unverifiedFields,
    })
    setErrors({
      form: "We couldn't finish creating your account. Please try again or contact support.",
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isLoaded) return

    if (step === "register") {
      if (!validateDetails()) return

      await runStep(async () => {
        const result = await signUp.create({
          firstName: formData.firstName,
          lastName: formData.lastName,
          emailAddress: formData.email.trim(),
          username: formData.username.trim(),
          password: formData.password,
          unsafeMetadata: buildClerkMetadata(),
        })

        if (await finishSignUp(result)) return

        if (result.unverifiedFields.includes("email_address")) {
          await result.prepareEmailAddressVerification({
            strategy: "email_code",
          })
          setCode("")
          setStep("register_code")
          return
        }

        unfinishedError(result)
      }, "Unable to create your account right now.")
      return
    }

    const nextErrors: ClerkFieldErrorState = {}
    validateCode(code, nextErrors)
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    await runStep(async () => {
      const result = await signUp.attemptEmailAddressVerification({ code })
      if (!(await finishSignUp(result))) unfinishedError(result)
    }, "That code didn't work. Please try again.")
  }

  const resendCode = async () => {
    if (!isLoaded) return

    await runStep(async () => {
      await signUp.prepareEmailAddressVerification({ strategy: "email_code" })
      setNotice("A new code is on its way.")
    }, "Unable to send a new code right now.")
  }

  const startOAuth = async (strategy: "oauth_google" | "oauth_apple") => {
    if (!isLoaded) {
      return
    }

    setIsLoading(true)
    setErrors({})

    try {
      await signUp.authenticateWithRedirect({
        strategy,
        redirectUrl: getOAuthCallbackUrl(),
        redirectUrlComplete: getPostSignUpUrl(),
        unsafeMetadata: buildClerkMetadata(),
      })
    } catch (error) {
      console.error("Clerk OAuth sign-up error", error)
      setErrors({
        form: getClerkErrorMessage(error, "Unable to start social sign-up."),
      })
      setIsLoading(false)
    }
  }

  const fieldProps = (key: RegisterField) => ({
    value: formData[key],
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
      setFormData({ ...formData, [key]: e.target.value })
      setErrors((current) => ({
        ...current,
        [key]: undefined,
        form: undefined,
      }))
    },
    error: errors[key],
    disabled: isLoading,
  })

  return (
    <div>
      {SHOW_SOCIAL_SIGN_IN && step === "register" && (
        <OAuthButtons onStart={startOAuth} />
      )}

      <form id="auth-main-form" onSubmit={handleSubmit} noValidate>
        <FieldGroup>
          {step === "register" ? (
            <>
              <div className="flex gap-4">
                <TextField
                  id="reg-fname"
                  label="First Name"
                  placeholder="Given Name"
                  autoComplete="given-name"
                  {...fieldProps("firstName")}
                />
                <TextField
                  id="reg-lname"
                  label="Last Name"
                  placeholder="Family Name"
                  autoComplete="family-name"
                  {...fieldProps("lastName")}
                />
              </div>
              <TextField
                id="reg-email"
                type="email"
                label="Email"
                placeholder="you@example.com"
                autoComplete="email"
                {...fieldProps("email")}
              />
              <TextField
                id="reg-username"
                label="Username"
                placeholder="Choose a username"
                autoComplete="username"
                autoCapitalize="none"
                spellCheck={false}
                {...fieldProps("username")}
              />
              <TextField
                id="reg-password"
                type="password"
                label="Password"
                placeholder="Min 8 chars"
                autoComplete="new-password"
                {...fieldProps("password")}
              />
              <TextField
                id="reg-confirm"
                type="password"
                label="Confirm Password"
                placeholder="Re-enter password"
                autoComplete="new-password"
                {...fieldProps("confirmPassword")}
              />
              {/* Clerk's bot protection puts its CAPTCHA here when it needs one */}
              <div id="clerk-captcha" />
            </>
          ) : (
            <>
              <CodeStepIntro sentTo={formData.email.trim()} />
              <CodeField
                value={code}
                onChange={(value) => {
                  setCode(value)
                  setErrors((current) => ({
                    ...current,
                    code: undefined,
                    form: undefined,
                  }))
                }}
                error={errors.code}
                disabled={isLoading}
              />
              <CodeStepLinks
                onResend={resendCode}
                onBack={() => {
                  setErrors({})
                  setNotice("")
                  setStep("register")
                }}
                backLabel="Change email"
                notice={notice}
                disabled={isLoading}
              />
            </>
          )}
          <FieldError>{errors.form}</FieldError>
        </FieldGroup>
      </form>
    </div>
  )
}
