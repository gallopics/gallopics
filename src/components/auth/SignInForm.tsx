import { useState } from "react"
import { useNavigate } from "react-router"
import { useClerk, useSignIn } from "@clerk/clerk-react"

import { Button } from "@/components/ui/button"
import { FieldError, FieldGroup } from "@/components/ui/field"
import {
  CodeField,
  CodeStepIntro,
  CodeStepLinks,
  OAuthButtons,
  TextField,
} from "@/components/auth/AuthFields"
import {
  EMAIL_PATTERN,
  getClerkErrorMessage,
  getClerkErrorState,
  getFirstClerkError,
  getOAuthCallbackUrl,
  getPostSignInUrl,
  IDENTIFIER_NOT_FOUND,
  SHOW_SOCIAL_SIGN_IN,
  validateCode,
  validateNewPassword,
  type AuthStep,
  type ClerkFieldErrorState,
  type ClerkParamFields,
  type FormProps,
  type SignInResult,
} from "@/components/auth/authHelpers"

export function SignInForm({
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
