// Shared by the sign-in and register forms in AuthModal
import type { useSignIn, useSignUp } from "@clerk/clerk-react"

export interface ClerkFieldErrorState {
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
export type AuthStep =
  | "signin"
  | "signin_code"
  | "forgot"
  | "forgot_reset"
  | "register"
  | "register_code"

export type SignInResult = Awaited<
  ReturnType<NonNullable<ReturnType<typeof useSignIn>["signIn"]>["create"]>
>
export type SignUpResult = Awaited<
  ReturnType<NonNullable<ReturnType<typeof useSignUp>["signUp"]>["create"]>
>

export const EMAIL_PATTERN = /^\S+@\S+\.\S+$/
const CODE_PATTERN = /^\d{6}$/
const MIN_PASSWORD_LENGTH = 8

const routerBase =
  import.meta.env.BASE_URL === "/"
    ? ""
    : import.meta.env.BASE_URL.replace(/\/$/, "")

const buildAbsoluteUrl = (path: string) =>
  new URL(`${routerBase}${path}`, window.location.origin).toString()

export const buildClerkMetadata = (overrides?: Record<string, unknown>) => ({
  approvalStatus: "pending",
  hasCompletedOnboarding: false,
  role: "pg",
  ...overrides,
})

/** The first error of a Clerk API error: its code, the field it is about, its message */
export const getFirstClerkError = (
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

export const getClerkErrorMessage = (error: unknown, fallback: string) =>
  getFirstClerkError(error).message || fallback

/** Clerk's field names → our form fields */
export type ClerkParamFields = Record<string, keyof ClerkFieldErrorState>

/**
 * Each Clerk error under the field it is about (e.g. a taken username and a too-short
 * password at once), else under the form. One message per field: the first one.
 */
export const getClerkErrorState = (
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
export const IDENTIFIER_NOT_FOUND = "form_identifier_not_found"

export const validateNewPassword = (
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

export const validateCode = (code: string, errors: ClerkFieldErrorState) => {
  if (!CODE_PATTERN.test(code)) {
    errors.code = "Enter the 6-digit code from the email"
  }
}

// develop: Google/Apple sign-in (and the "or" divider) are hidden for now
export const SHOW_SOCIAL_SIGN_IN = false

export const getOAuthCallbackUrl = () => buildAbsoluteUrl("/auth/callback")

export const getPostSignInUrl = () => buildAbsoluteUrl("/pg")

export const getPostSignUpUrl = () => buildAbsoluteUrl("/pg/onboarding/profile")

export interface FormProps {
  step: AuthStep
  setStep: (step: AuthStep) => void
  isLoading: boolean
  setIsLoading: (value: boolean) => void
  onClose: () => void
}
