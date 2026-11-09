import { useState } from "react"
import { useNavigate } from "react-router"
import { useClerk, useSignUp } from "@clerk/clerk-react"

import { FieldError, FieldGroup } from "@/components/ui/field"
import {
  CodeField,
  CodeStepIntro,
  CodeStepLinks,
  OAuthButtons,
  TextField,
} from "@/components/auth/AuthFields"
import {
  buildClerkMetadata,
  EMAIL_PATTERN,
  getClerkErrorMessage,
  getClerkErrorState,
  getOAuthCallbackUrl,
  getPostSignUpUrl,
  SHOW_SOCIAL_SIGN_IN,
  validateCode,
  validateNewPassword,
  type ClerkFieldErrorState,
  type ClerkParamFields,
  type FormProps,
  type SignUpResult,
} from "@/components/auth/authHelpers"

type RegisterField =
  | "firstName"
  | "lastName"
  | "email"
  | "username"
  | "password"
  | "confirmPassword"

export function RegisterForm({
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
