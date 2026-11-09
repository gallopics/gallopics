import { Button } from "@/components/ui/button"
import {
  Field,
  FieldError,
  FieldLabel,
  FieldSeparator,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { AppleIcon } from "@/components/icons/AppleIcon"
import { GoogleIcon } from "@/components/icons/GoogleIcon"

export function OAuthButtons({
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

export function TextField({
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
export function CodeField({
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
export function CodeStepIntro({
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

export function CodeStepLinks({
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
