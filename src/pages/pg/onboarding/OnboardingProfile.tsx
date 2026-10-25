import { useEffect, useRef, useState } from "react"
import { useNavigate } from "react-router"
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
import { Header } from "@/components/Header"

export function OnboardingProfile() {
  const navigate = useNavigate()
  const { updateProfile, uploadAvatar, user } = useAuth()
  const avatarInputRef = useRef<HTMLInputElement | null>(null)

  // State
  const [avatarUrl, setAvatarUrl] = useState<string | null>(
    user?.avatarUrl ?? null
  )
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState<string | null>(null)
  const [displayName, setDisplayName] = useState(user?.displayName ?? "")
  const [country, setCountry] = useState(user?.country ?? "Sweden")
  const [city, setCity] = useState(user?.city ?? "")
  const [phoneCode, setPhoneCode] = useState("+46")
  const [phoneNumber, setPhoneNumber] = useState("")

  const [errors, setErrors] = useState<{ [key: string]: string }>({})
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    return () => {
      if (avatarPreviewUrl) {
        URL.revokeObjectURL(avatarPreviewUrl)
      }
    }
  }, [avatarPreviewUrl])

  const handleAvatarUpload = () => {
    avatarInputRef.current?.click()
  }

  const handleAvatarFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0]
    if (!file) {
      return
    }

    setErrors((current) => ({ ...current, avatar: "" }))

    if (avatarPreviewUrl) {
      URL.revokeObjectURL(avatarPreviewUrl)
    }

    setAvatarFile(file)
    setAvatarPreviewUrl(URL.createObjectURL(file))
    setAvatarUrl(null)
    e.target.value = ""
  }

  const handleClearAvatar = () => {
    if (avatarPreviewUrl) {
      URL.revokeObjectURL(avatarPreviewUrl)
    }
    setAvatarFile(null)
    setAvatarPreviewUrl(null)
    setAvatarUrl(null)
  }

  const saveProfile = async (hasCompletedOnboarding: boolean) => {
    setIsSaving(true)
    setErrors((current) => ({ ...current, avatar: "" }))

    try {
      await updateProfile({
        avatarUrl: avatarFile ? undefined : avatarUrl,
        displayName: displayName.trim() || user?.displayName || "Photographer",
        country: country.trim() || user?.country || "",
        city: city.trim() || user?.city || "",
        phone: phoneNumber.trim() ? `${phoneCode}${phoneNumber.trim()}` : null,
        hasCompletedOnboarding,
      })

      if (avatarFile) {
        await uploadAvatar(avatarFile)
      }

      navigate("/pg/pending-approval")
    } catch (error) {
      console.error("Failed to save profile", error)
      setErrors((current) => ({
        ...current,
        avatar: avatarFile
          ? "Unable to upload photo. Please try another image."
          : current.avatar,
      }))
    } finally {
      setIsSaving(false)
    }
  }

  const handleContinue = async () => {
    const newErrors: { [key: string]: string } = {}

    if (!displayName.trim()) newErrors.displayName = "Display Name is required"
    if (!country.trim()) newErrors.country = "Country is required"
    if (!city.trim()) newErrors.city = "City is required"

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    await saveProfile(true)
  }

  const handleSkip = async () => {
    await saveProfile(true)
  }
  const hasAvatar = !!(avatarPreviewUrl || avatarUrl)

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
          {/* 1. Avatar */}
          <div className="mb-8 flex items-center gap-6">
            <Avatar className="size-20 bg-background">
              {hasAvatar && (
                <AvatarImage
                  src={
                    avatarPreviewUrl ??
                    resolveApiAssetUrl(avatarUrl) ??
                    undefined
                  }
                  alt="Avatar"
                />
              )}
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
                onChange={handleAvatarFileChange}
              />
              <Button
                variant="link"
                className="h-auto p-0 text-base font-medium"
                onClick={handleAvatarUpload}
                disabled={isSaving}
              >
                <Camera />
                {isSaving
                  ? "Saving..."
                  : hasAvatar
                    ? "Change photo"
                    : "Upload photo"}
              </Button>
              {hasAvatar && (
                <Button
                  variant="link"
                  className="h-auto p-0 font-normal text-destructive"
                  onClick={handleClearAvatar}
                  disabled={isSaving}
                >
                  Remove
                </Button>
              )}
              {errors.avatar && (
                <span className="text-xs text-destructive">
                  {errors.avatar}
                </span>
              )}
            </div>
          </div>

          <FieldGroup className="gap-4">
            {/* 2. Display name */}
            <Field data-invalid={!!errors.displayName}>
              <FieldLabel htmlFor="displayName">Display Name</FieldLabel>
              <Input
                id="displayName"
                aria-invalid={!!errors.displayName}
                value={displayName}
                onChange={(e) => {
                  setDisplayName(e.target.value)
                  if (errors.displayName)
                    setErrors({ ...errors, displayName: "" })
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
                value={country}
                onValueChange={(value) => {
                  setCountry(String(value))
                  if (errors.country) setErrors({ ...errors, country: "" })
                }}
              >
                <SelectTrigger
                  className="w-full"
                  aria-invalid={!!errors.country}
                >
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
              <FieldLabel htmlFor="city">City</FieldLabel>
              <Input
                id="city"
                aria-invalid={!!errors.city}
                value={city}
                onChange={(e) => {
                  setCity(e.target.value)
                  if (errors.city) setErrors({ ...errors, city: "" })
                }}
                placeholder="e.g. Stockholm"
              />
              <FieldError>{errors.city}</FieldError>
            </Field>

            {/* 5. Mobile number */}
            <Field>
              <FieldLabel htmlFor="phone">Mobile Number (Optional)</FieldLabel>
              <div className="flex gap-2">
                <Input
                  aria-label="Country code"
                  className="w-20 shrink-0 text-center"
                  value={phoneCode}
                  onChange={(e) => setPhoneCode(e.target.value)}
                />
                <Input
                  id="phone"
                  type="tel"
                  className="flex-1"
                  placeholder="70 123 45 67"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                />
              </div>
            </Field>
          </FieldGroup>

          {/* CTAs */}
          <Button
            className="mt-8 w-full"
            onClick={handleContinue}
            disabled={isSaving}
          >
            {isSaving ? "Saving..." : "Continue"}
          </Button>
          <Button
            variant="ghost"
            className="mt-2 w-full font-normal hover:bg-transparent"
            onClick={handleSkip}
            disabled={isSaving}
          >
            Skip for now
          </Button>
        </div>
      </div>
    </div>
  )
}

const COUNTRY_OPTIONS = [
  "Sweden",
  "Norway",
  "Denmark",
  "Finland",
  "United States",
  "United Kingdom",
  "Germany",
].map((name) => ({ label: name, value: name }))
