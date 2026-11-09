import { useEffect, useId, useRef, useState } from "react"
import { Camera, User } from "lucide-react"

import { useAuth } from "@/context/AuthContext"
import { resolveApiAssetUrl } from "@/data/apiClient"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const COUNTRY_OPTIONS = [
  "Sweden",
  "Norway",
  "Denmark",
  "Finland",
  "United States",
  "United Kingdom",
  "Germany",
].map((name) => ({ label: name, value: name }))

// Longest first, so "+358" isn't read as "+35"
const KNOWN_PHONE_CODES = ["+358", "+46", "+47", "+45", "+44", "+49", "+1"]

/** The saved phone is "<code><number>" in one string */
function splitPhone(phone: string | null | undefined) {
  if (!phone) return { code: "+46", number: "" }
  const code = KNOWN_PHONE_CODES.find((c) => phone.startsWith(c))
  return code
    ? { code, number: phone.slice(code.length).trim() }
    : { code: "", number: phone }
}

type ProfileErrors = Partial<
  Record<"displayName" | "country" | "city" | "avatar" | "form", string>
>

interface SaveOptions {
  hasCompletedOnboarding?: boolean
}

/** The photographer's own profile: shared by onboarding and Edit profile */
export function useProfileForm() {
  const { user, updateProfile, uploadAvatar } = useAuth()
  const savedPhone = splitPhone(user?.phone)

  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState<string | null>(null)
  const [avatarRemoved, setAvatarRemoved] = useState(false)
  const [displayName, setDisplayName] = useState(user?.displayName ?? "")
  const [country, setCountry] = useState(user?.country || "Sweden")
  const [city, setCity] = useState(user?.city ?? "")
  const [phoneCode, setPhoneCode] = useState(savedPhone.code)
  const [phoneNumber, setPhoneNumber] = useState(savedPhone.number)
  const [errors, setErrors] = useState<ProfileErrors>({})
  const [isSaving, setIsSaving] = useState(false)

  // Frees the previous preview when a new one is picked, and on unmount
  useEffect(() => {
    return () => {
      if (avatarPreviewUrl) URL.revokeObjectURL(avatarPreviewUrl)
    }
  }, [avatarPreviewUrl])

  const avatarUrl =
    avatarPreviewUrl ??
    (avatarRemoved ? null : resolveApiAssetUrl(user?.avatarUrl))

  const pickAvatar = (file: File) => {
    setErrors((current) => ({ ...current, avatar: "" }))
    setAvatarFile(file)
    setAvatarPreviewUrl(URL.createObjectURL(file))
  }

  const removeAvatar = () => {
    setAvatarFile(null)
    setAvatarPreviewUrl(null)
    setAvatarRemoved(true)
  }

  const clearError = (field: keyof ProfileErrors) =>
    setErrors((current) => ({ ...current, [field]: "" }))

  /** Returns true when everything was saved */
  const save = async ({ hasCompletedOnboarding }: SaveOptions = {}) => {
    const newErrors: ProfileErrors = {}
    if (!displayName.trim()) newErrors.displayName = "Display Name is required"
    if (!country.trim()) newErrors.country = "Country is required"
    if (!city.trim()) newErrors.city = "City is required"
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return false
    }

    setIsSaving(true)
    setErrors({})
    let step: "profile" | "photo" = "profile"
    try {
      await updateProfile({
        // undefined keeps the saved photo; a new one is uploaded below
        avatarUrl: avatarRemoved && !avatarFile ? null : undefined,
        displayName: displayName.trim(),
        country: country.trim(),
        city: city.trim(),
        phone: phoneNumber.trim()
          ? `${phoneCode.trim()}${phoneNumber.trim()}`
          : null,
        hasCompletedOnboarding,
      })

      if (avatarFile) {
        step = "photo"
        await uploadAvatar(avatarFile)
      }
      return true
    } catch (error) {
      console.error("Failed to save profile", error)
      setErrors(
        step === "photo"
          ? { avatar: "Unable to upload photo. Please try another image." }
          : { form: "Couldn't save your profile. Please try again." }
      )
      return false
    } finally {
      setIsSaving(false)
    }
  }

  /**
   * Onboarding's "Skip for now": ignores the form and creates the profile from
   * the account alone (name from sign-up), so onboarding counts as done
   */
  const skip = async () => {
    setIsSaving(true)
    setErrors({})
    try {
      await updateProfile({ hasCompletedOnboarding: true })
      return true
    } catch (error) {
      console.error("Failed to save profile", error)
      setErrors({ form: "Couldn't save your profile. Please try again." })
      return false
    } finally {
      setIsSaving(false)
    }
  }

  return {
    avatarUrl,
    pickAvatar,
    removeAvatar,
    displayName,
    setDisplayName,
    country,
    setCountry,
    city,
    setCity,
    phoneCode,
    setPhoneCode,
    phoneNumber,
    setPhoneNumber,
    errors,
    clearError,
    isSaving,
    save,
    skip,
  }
}

export function ProfileFields({
  form,
}: {
  form: ReturnType<typeof useProfileForm>
}) {
  const id = useId()
  const avatarInputRef = useRef<HTMLInputElement | null>(null)
  const { errors, isSaving } = form

  return (
    <>
      {/* 1. Avatar */}
      <div className="mb-8 flex items-center gap-6">
        <Avatar className="size-20 bg-background">
          {form.avatarUrl && <AvatarImage src={form.avatarUrl} alt="Avatar" />}
          <AvatarFallback className="bg-background text-muted-foreground/60">
            <User className="size-8" />
          </AvatarFallback>
        </Avatar>
        <div className="flex flex-col items-start gap-1">
          <input
            ref={avatarInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) form.pickAvatar(file)
              e.target.value = ""
            }}
          />
          <Button
            variant="link"
            className="h-auto p-0 text-base font-medium"
            onClick={() => avatarInputRef.current?.click()}
            disabled={isSaving}
          >
            <Camera />
            {isSaving
              ? "Saving..."
              : form.avatarUrl
                ? "Change photo"
                : "Upload photo"}
          </Button>
          {form.avatarUrl && (
            <Button
              variant="link"
              className="h-auto p-0 font-normal text-destructive"
              onClick={form.removeAvatar}
              disabled={isSaving}
            >
              Remove
            </Button>
          )}
          {errors.avatar && (
            <span className="text-xs text-destructive">{errors.avatar}</span>
          )}
        </div>
      </div>

      <FieldGroup className="gap-4">
        {/* 2. Display name */}
        <Field data-invalid={!!errors.displayName}>
          <FieldLabel htmlFor={`${id}-name`}>Display Name</FieldLabel>
          <Input
            id={`${id}-name`}
            aria-invalid={!!errors.displayName}
            value={form.displayName}
            onChange={(e) => {
              form.setDisplayName(e.target.value)
              if (errors.displayName) form.clearError("displayName")
            }}
            placeholder="e.g. Klara Fors"
          />
          <FieldError>{errors.displayName}</FieldError>
        </Field>

        {/* 3. Country */}
        <Field data-invalid={!!errors.country}>
          <FieldLabel>Country</FieldLabel>
          <Select
            items={COUNTRY_OPTIONS}
            value={form.country}
            onValueChange={(value) => {
              form.setCountry(String(value))
              if (errors.country) form.clearError("country")
            }}
          >
            <SelectTrigger className="w-full" aria-invalid={!!errors.country}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {COUNTRY_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FieldError>{errors.country}</FieldError>
        </Field>

        {/* 4. City */}
        <Field data-invalid={!!errors.city}>
          <FieldLabel htmlFor={`${id}-city`}>City</FieldLabel>
          <Input
            id={`${id}-city`}
            aria-invalid={!!errors.city}
            value={form.city}
            onChange={(e) => {
              form.setCity(e.target.value)
              if (errors.city) form.clearError("city")
            }}
            placeholder="e.g. Stockholm"
          />
          <FieldError>{errors.city}</FieldError>
        </Field>

        {/* 5. Mobile number */}
        <Field>
          <FieldLabel htmlFor={`${id}-phone`}>
            Mobile Number (Optional)
          </FieldLabel>
          <div className="flex gap-2">
            <Input
              aria-label="Country code"
              className="w-20 shrink-0 text-center"
              value={form.phoneCode}
              onChange={(e) => form.setPhoneCode(e.target.value)}
            />
            <Input
              id={`${id}-phone`}
              type="tel"
              className="flex-1"
              placeholder="70 123 45 67"
              value={form.phoneNumber}
              onChange={(e) => form.setPhoneNumber(e.target.value)}
            />
          </div>
        </Field>

        {errors.form && <FieldError>{errors.form}</FieldError>}
      </FieldGroup>
    </>
  )
}
