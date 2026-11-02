import { useState } from "react"
import { Camera, User } from "lucide-react"

import { useAuth } from "@/context/AuthContext"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
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
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"

interface EditProfileModalProps {
  isOpen: boolean
  onClose: () => void
}

const countryOptions = [
  { label: "🇸🇪 Sweden", value: "Sweden" },
  { label: "🇳🇴 Norway", value: "Norway" },
  { label: "🇩🇰 Denmark", value: "Denmark" },
  { label: "🇫🇮 Finland", value: "Finland" },
  { label: "🇺🇸 United States", value: "United States" },
  { label: "🇬🇧 United Kingdom", value: "United Kingdom" },
  { label: "🇩🇪 Germany", value: "Germany" },
]

const phoneCodeOptions = ["+46", "+45", "+47", "+358", "+1", "+44"].map(
  (code) => ({ label: code, value: code })
)

type Errors = Partial<Record<"displayName" | "country" | "city", string>>

export function EditProfileModal({ isOpen, onClose }: EditProfileModalProps) {
  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
    >
      <DialogContent className="sm:max-w-150">
        {/* Mounted only while open, so the form starts from the current user each time */}
        <EditProfileForm onClose={onClose} />
      </DialogContent>
    </Dialog>
  )
}

function EditProfileForm({ onClose }: { onClose: () => void }) {
  const { user, updateProfile } = useAuth()

  const [avatarUrl, setAvatarUrl] = useState<string | null>(
    user?.avatarUrl || null
  )
  const [displayName, setDisplayName] = useState(user?.displayName || "")
  const [country, setCountry] = useState(user?.country || "Sweden")
  const [city, setCity] = useState(user?.city || "")
  const [phoneCode, setPhoneCode] = useState("+46")
  const [phoneNumber, setPhoneNumber] = useState("")
  const [errors, setErrors] = useState<Errors>({})

  const handleAvatarUpload = () => {
    setAvatarUrl(
      "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
    )
  }

  const handleSave = async () => {
    const newErrors: Errors = {}
    if (!displayName.trim()) newErrors.displayName = "Display Name is required"
    if (!country.trim()) newErrors.country = "Country is required"
    if (!city.trim()) newErrors.city = "City is required"

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    await updateProfile({
      avatarUrl: avatarUrl || undefined,
      displayName,
      country,
      city,
    })
    onClose()
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>Edit Profile</DialogTitle>
      </DialogHeader>

      <DialogBody>
        <div className="flex items-center gap-5">
          <Avatar className="size-14">
            {avatarUrl && <AvatarImage src={avatarUrl} alt="Avatar" />}
            <AvatarFallback>
              <User size={28} />
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col items-start gap-1">
            <Button
              variant="link"
              className="h-auto p-0 font-medium"
              onClick={handleAvatarUpload}
            >
              <Camera />
              {avatarUrl ? "Change photo" : "Upload photo"}
            </Button>
            {avatarUrl && (
              <Button
                variant="link"
                className="h-auto p-0 text-[0.8125rem] font-normal text-destructive"
                onClick={() => setAvatarUrl(null)}
              >
                Remove
              </Button>
            )}
          </div>
        </div>

        <Separator className="my-6" />

        <div className="grid grid-cols-2 gap-4 max-[600px]:grid-cols-1">
          <Field data-invalid={!!errors.displayName} className="col-span-full">
            <FieldLabel htmlFor="edit-display-name">Display Name</FieldLabel>
            <Input
              id="edit-display-name"
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

          <Field>
            <FieldLabel>Country</FieldLabel>
            <Select
              items={countryOptions}
              value={country}
              onValueChange={(value) => setCountry(String(value))}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {countryOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field data-invalid={!!errors.city}>
            <FieldLabel htmlFor="edit-city">City</FieldLabel>
            <Input
              id="edit-city"
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

          <div className="col-span-full grid grid-cols-[100px_1fr] gap-4 max-[600px]:grid-cols-1">
            <Field>
              <FieldLabel>Code</FieldLabel>
              <Select
                items={phoneCodeOptions}
                value={phoneCode}
                onValueChange={(value) => setPhoneCode(String(value))}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {phoneCodeOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field>
              <FieldLabel htmlFor="edit-phone">
                Mobile Number (Optional)
              </FieldLabel>
              <Input
                id="edit-phone"
                type="tel"
                placeholder="70 123 45 67"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
              />
            </Field>
          </div>
        </div>
      </DialogBody>

      <DialogFooter>
        <DialogCancel />
        <Button onClick={handleSave}>Save</Button>
      </DialogFooter>
    </>
  )
}
