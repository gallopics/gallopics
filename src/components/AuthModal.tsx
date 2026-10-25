import { useState } from "react"
import { useNavigate } from "react-router"
import { useClerk, useSignIn, useSignUp } from "@clerk/clerk-react"
import { Check, Link, Monitor } from "lucide-react"

import { cn } from "@/lib/utils"
import { useMediaQuery } from "@/hooks/useMediaQuery"
import { PROTOTYPE_USER } from "@/context/AuthContext"
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
  password?: string
  confirmPassword?: string
  firstName?: string
  lastName?: string
  form?: string
}

interface ClerkDebugInfo {
  flow: "sign_in" | "sign_up"
  status?: string | null
  details: string
}

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

const getClerkErrorMessage = (error: unknown, fallback: string) => {
  if (typeof error !== "object" || error === null) {
    return fallback
  }

  const maybeErrors = (
    error as { errors?: Array<{ longMessage?: string; message?: string }> }
  ).errors
  if (Array.isArray(maybeErrors) && maybeErrors.length > 0) {
    return maybeErrors[0].longMessage ?? maybeErrors[0].message ?? fallback
  }

  return fallback
}

const stringifyClerkDebug = (value: unknown) => {
  try {
    return JSON.stringify(
      value,
      (_, currentValue) => {
        if (currentValue instanceof Error) {
          return {
            name: currentValue.name,
            message: currentValue.message,
            stack: currentValue.stack,
          }
        }

        if (typeof currentValue === "function") {
          return `[function ${currentValue.name || "anonymous"}]`
        }

        return currentValue
      },
      2
    )
  } catch {
    return String(value)
  }
}

const buildSignInDebugInfo = (result: unknown): ClerkDebugInfo => {
  const candidate = result as {
    status?: string
    supportedFirstFactors?: unknown
    supportedSecondFactors?: unknown
    firstFactorVerification?: unknown
    secondFactorVerification?: unknown
    identifier?: unknown
  }

  return {
    flow: "sign_in",
    status: candidate?.status ?? null,
    details: stringifyClerkDebug({
      status: candidate?.status,
      identifier: candidate?.identifier,
      supportedFirstFactors: candidate?.supportedFirstFactors,
      supportedSecondFactors: candidate?.supportedSecondFactors,
      firstFactorVerification: candidate?.firstFactorVerification,
      secondFactorVerification: candidate?.secondFactorVerification,
      raw: candidate,
    }),
  }
}

// develop: Google/Apple sign-in (and the "or" divider) are hidden for now
const SHOW_SOCIAL_SIGN_IN = false

const getOAuthCallbackUrl = () => buildAbsoluteUrl("/auth/callback")

const getPostSignInUrl = () => buildAbsoluteUrl("/pg")

const getPostSignUpUrl = () => buildAbsoluteUrl("/pg/onboarding/profile")

const getPostSignInRoute = (identifier: string) => {
  const normalized = identifier.trim().toLowerCase()

  if (normalized === "member") {
    return `/photographer/${PROTOTYPE_USER.id}`
  }

  if (normalized === "admin" || normalized.startsWith("admin@")) {
    return "/admin/events"
  }

  return "/pg"
}

export function AuthModal({
  isOpen,
  onClose,
  initialTab = "signin",
  initialAccountType = "photographer",
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
        {/* Mounted only while open, so state starts fresh on every open */}
        <AuthContent
          activeTab={initialTab}
          initialAccountType={initialAccountType}
          onClose={onClose}
          onSwitchTab={onSwitchTab}
        />
      </DialogContent>
    </Dialog>
  )
}

function AuthContent({
  activeTab,
  initialAccountType,
  onClose,
  onSwitchTab,
}: {
  activeTab: "signin" | "register"
  initialAccountType: "photographer" | "buyer"
  onClose: () => void
  onSwitchTab?: () => void
}) {
  const [isLoading, setIsLoading] = useState(false)
  const isMobile = useMediaQuery("(max-width: 767px)")
  const showMobilePhotographerView =
    initialAccountType === "photographer" && isMobile

  const ctaLabel =
    activeTab === "signin"
      ? isLoading
        ? "Signing in..."
        : "Sign in"
      : isLoading
        ? "Creating account..."
        : "Create account"

  return (
    <>
      <DialogHeader>
        <DialogTitle>
          {activeTab === "signin" ? "Sign in" : "Create account"}
        </DialogTitle>
      </DialogHeader>

      <DialogBody>
        {showMobilePhotographerView ? (
          <MobilePhotographerNotice onClose={onClose} />
        ) : activeTab === "signin" ? (
          <SignInForm
            isLoading={isLoading}
            setIsLoading={setIsLoading}
            onClose={onClose}
          />
        ) : (
          <RegisterForm
            isLoading={isLoading}
            setIsLoading={setIsLoading}
            onClose={onClose}
          />
        )}
      </DialogBody>

      {!showMobilePhotographerView && (
        <DialogFooter className="flex-col gap-4 pb-6 sm:flex-col sm:justify-start">
          <div className="flex w-full gap-3">
            <DialogCancel className="flex-1" disabled={isLoading} />
            <Button
              type="submit"
              form="auth-main-form"
              className="flex-2"
              disabled={isLoading}
            >
              {ctaLabel}
            </Button>
          </div>

          {activeTab === "register" && (
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

          {onSwitchTab && (
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
      )}
    </>
  )
}

function MobilePhotographerNotice({ onClose }: { onClose: () => void }) {
  const [copied, setCopied] = useState(false)

  return (
    <div className="px-1 py-6 text-center">
      <div className="mx-auto mb-6 flex size-14 items-center justify-center rounded-lg bg-primary/8 text-primary">
        <Monitor size={28} />
      </div>
      <h2 className="mb-2.5 text-base font-semibold">
        Use a desktop for photographer tools
      </h2>
      <p className="mb-6 text-sm leading-normal text-muted-foreground">
        For the best experience, please open Gallopics on a desktop or laptop to
        upload and manage photos.
      </p>
      <div className="flex flex-col gap-2.5">
        <Button onClick={onClose}>Got it</Button>
        <Button
          variant="outline"
          className={cn(copied && "border-success text-success")}
          onClick={() => {
            navigator.clipboard.writeText(window.location.href)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
          }}
        >
          {copied ? <Check /> : <Link />}
          {copied ? "Copied!" : "Copy link"}
        </Button>
      </div>
    </div>
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

interface FormProps {
  isLoading: boolean
  setIsLoading: (value: boolean) => void
  onClose: () => void
}

function SignInForm({ isLoading, setIsLoading, onClose }: FormProps) {
  const navigate = useNavigate()
  const clerk = useClerk()
  const { isLoaded, signIn } = useSignIn()
  const [formData, setFormData] = useState({ identifier: "", password: "" })
  const [errors, setErrors] = useState<ClerkFieldErrorState>({})

  const validate = () => {
    const nextErrors: ClerkFieldErrorState = {}

    if (!formData.identifier.trim()) {
      nextErrors.identifier = "Username is required"
    }

    if (!formData.password) {
      nextErrors.password = "Password is required"
    }

    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validate() || !isLoaded) {
      return
    }

    setIsLoading(true)
    setErrors({})
    try {
      const result = await signIn.create({
        identifier: formData.identifier,
        password: formData.password,
      })

      const nextDebugInfo = buildSignInDebugInfo(result)
      console.error("Clerk sign-in result", result)

      if (result.status === "complete" && result.createdSessionId) {
        await clerk.setActive({ session: result.createdSessionId })
        onClose()
        navigate(getPostSignInRoute(formData.identifier))
        return
      }

      setErrors({
        form:
          nextDebugInfo.status === "needs_second_factor"
            ? "This account needs an additional verification step before it can sign in."
            : "",
      })
    } catch (error) {
      console.error("Clerk sign-in error", error)
      setErrors({
        form: getClerkErrorMessage(
          error,
          "Unable to sign in with those credentials."
        ),
      })
    } finally {
      setIsLoading(false)
    }
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

  return (
    <div>
      {SHOW_SOCIAL_SIGN_IN && <OAuthButtons onStart={startOAuth} />}

      <form id="auth-main-form" onSubmit={handleSubmit}>
        <FieldGroup>
          <TextField
            id="signin-identifier"
            label="Username"
            placeholder="Enter your username"
            value={formData.identifier}
            onChange={(e) => update("identifier", e.target.value)}
            error={errors.identifier}
            disabled={isLoading}
          />
          <TextField
            id="signin-password"
            type="password"
            label="Password"
            placeholder="Enter your password"
            value={formData.password}
            onChange={(e) => update("password", e.target.value)}
            error={errors.password}
            disabled={isLoading}
          />
          <FieldError>{errors.form}</FieldError>
        </FieldGroup>
      </form>
    </div>
  )
}

type RegisterField =
  "firstName" | "lastName" | "username" | "password" | "confirmPassword"

function RegisterForm({ isLoading, setIsLoading, onClose }: FormProps) {
  const navigate = useNavigate()
  const clerk = useClerk()
  const { isLoaded, signUp } = useSignUp()
  const [formData, setFormData] = useState<Record<RegisterField, string>>({
    firstName: "",
    lastName: "",
    username: "",
    password: "",
    confirmPassword: "",
  })
  const [errors, setErrors] = useState<ClerkFieldErrorState>({})

  const validateDetails = () => {
    const nextErrors: ClerkFieldErrorState = {}

    if (!formData.firstName) {
      nextErrors.firstName = "First name is required"
    }

    if (!formData.lastName) {
      nextErrors.lastName = "Last name is required"
    }

    if (!formData.username.trim()) {
      nextErrors.username = "Username is required"
    } else if (!/^[a-zA-Z0-9._-]{3,32}$/.test(formData.username.trim())) {
      nextErrors.username =
        "Use 3-32 letters, numbers, dots, dashes, or underscores"
    }

    if (!formData.password) {
      nextErrors.password = "Password is required"
    } else if (formData.password.length < 8) {
      nextErrors.password = "Password must be at least 8 characters"
    }

    if (formData.password !== formData.confirmPassword) {
      nextErrors.confirmPassword = "Passwords do not match"
    }

    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const handleCreateAccount = async () => {
    if (!validateDetails() || !isLoaded) {
      return
    }

    setIsLoading(true)
    setErrors({})

    try {
      const result = await signUp.create({
        firstName: formData.firstName,
        lastName: formData.lastName,
        username: formData.username.trim(),
        password: formData.password,
        unsafeMetadata: buildClerkMetadata(),
      })

      console.error("Clerk sign-up result", result)

      if (result.status === "complete" && result.createdSessionId) {
        await clerk.setActive({ session: result.createdSessionId })
        onClose()
        navigate("/pg/onboarding/profile")
        return
      }

      setErrors({
        form: "Clerk requires additional sign-up steps for this instance. Update Clerk sign-up settings if username-only sign-up is intended.",
      })
    } catch (error) {
      console.error("Clerk sign-up error", error)
      setErrors({
        form: getClerkErrorMessage(
          error,
          "Unable to create your account right now."
        ),
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await handleCreateAccount()
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
      {SHOW_SOCIAL_SIGN_IN && <OAuthButtons onStart={startOAuth} />}

      <form id="auth-main-form" onSubmit={handleSubmit}>
        <FieldGroup>
          <div className="flex gap-4">
            <TextField
              id="reg-fname"
              label="First Name"
              placeholder="Given Name"
              {...fieldProps("firstName")}
            />
            <TextField
              id="reg-lname"
              label="Last Name"
              placeholder="Family Name"
              {...fieldProps("lastName")}
            />
          </div>
          <TextField
            id="reg-username"
            label="Username"
            placeholder="Choose a username"
            {...fieldProps("username")}
          />
          <TextField
            id="reg-password"
            type="password"
            label="Password"
            placeholder="Min 8 chars"
            {...fieldProps("password")}
          />
          <TextField
            id="reg-confirm"
            type="password"
            label="Confirm Password"
            placeholder="Re-enter password"
            {...fieldProps("confirmPassword")}
          />
          <FieldError>{errors.form}</FieldError>
        </FieldGroup>
      </form>
    </div>
  )
}
