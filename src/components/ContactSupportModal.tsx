import { useState } from "react"
import { Mail, MessageSquare, Send, Tag } from "lucide-react"

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
} from "@/components/ui/field"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupTextarea,
} from "@/components/ui/input-group"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Spinner } from "@/components/ui/spinner"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "@/components/ui/toast"

interface ContactSupportModalProps {
  isOpen: boolean
  onClose: () => void
  photographerOnly?: boolean
}

type UserRole = "Photo buyer" | "Photographer" | "Event organiser"
type Errors = { email?: string; subject?: string; message?: string }

const roles: UserRole[] = ["Photo buyer", "Photographer", "Event organiser"]
const countryCodes = ["+46", "+47", "+45", "+358", "+1", "+44", "+49"].map(
  (code) => ({ label: code, value: code })
)

const contactFormEndpoint = import.meta.env.VITE_CONTACT_FORM_ENDPOINT

export function ContactSupportModal({
  isOpen,
  onClose,
  photographerOnly = false,
}: ContactSupportModalProps) {
  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
    >
      <DialogContent className="sm:max-w-140">
        {/* Mounted only while open, so the form is reset on every open */}
        <ContactSupportForm
          onClose={onClose}
          photographerOnly={photographerOnly}
        />
      </DialogContent>
    </Dialog>
  )
}

function ContactSupportForm({
  onClose,
  photographerOnly,
}: {
  onClose: () => void
  photographerOnly: boolean
}) {
  const [role, setRole] = useState<UserRole>(
    photographerOnly ? "Photographer" : "Photo buyer"
  )
  const [email, setEmail] = useState("")
  const [countryCode, setCountryCode] = useState("+46")
  const [phone, setPhone] = useState("")
  const [subject, setSubject] = useState("")
  const [message, setMessage] = useState("")
  const [status, setStatus] = useState<
    "idle" | "sending" | "success" | "error"
  >("idle")
  const [errors, setErrors] = useState<Errors>({})

  const isSending = status === "sending"

  const validate = () => {
    const newErrors: Errors = {}
    if (!email) {
      newErrors.email = "Email is required"
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = "Please enter a valid email"
    }

    if (!subject) {
      newErrors.subject = "Subject is required"
    } else if (subject.length < 3) {
      newErrors.subject = "Subject must be at least 3 characters"
    }

    if (!message) {
      newErrors.message = "Message is required"
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    setStatus("sending")

    const composedPhone = phone
      ? `${countryCode}${phone.replace(/\s+/g, "")}`
      : ""

    try {
      if (!contactFormEndpoint) {
        throw new Error("Missing VITE_CONTACT_FORM_ENDPOINT")
      }

      const response = await fetch(contactFormEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          role,
          email,
          phone: composedPhone,
          subject,
          message,
          source: "gallopics-contact-form",
        }),
      })

      if (!response.ok) {
        throw new Error(`Contact request failed with status ${response.status}`)
      }

      setStatus("success")
      toast.add({
        title: "Message sent successfully! We will get back to you soon.",
        type: "success",
      })
      setTimeout(onClose, 500)
    } catch (error) {
      console.error("Contact form submission failed", error)
      setStatus("error")
      toast.add({
        title: "Failed to send message. Please try again.",
        type: "error",
      })
    }
  }

  const clearError = (key: keyof Errors) => {
    if (errors[key]) setErrors({ ...errors, [key]: undefined })
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>Contact support</DialogTitle>
      </DialogHeader>

      <DialogBody>
        <form id="contact-support-form" onSubmit={handleSubmit}>
          <fieldset disabled={isSending}>
            <FieldGroup>
              {!photographerOnly && (
                <Field>
                  <FieldLabel>I'm contacting you as</FieldLabel>
                  <Tabs
                    value={role}
                    onValueChange={(value) => setRole(value as UserRole)}
                  >
                    <TabsList className="w-full">
                      {roles.map((r) => (
                        <TabsTrigger
                          key={r}
                          value={r}
                          className="font-semibold max-md:px-0.5 max-md:text-xs data-active:text-primary"
                        >
                          {r}
                        </TabsTrigger>
                      ))}
                    </TabsList>
                  </Tabs>
                </Field>
              )}

              <Field data-invalid={!!errors.email}>
                <FieldLabel htmlFor="support-email">Email</FieldLabel>
                <InputGroup>
                  <InputGroupInput
                    id="support-email"
                    type="email"
                    placeholder="name@example.com"
                    aria-invalid={!!errors.email}
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value)
                      clearError("email")
                    }}
                  />
                  <InputGroupAddon>
                    <Mail />
                  </InputGroupAddon>
                </InputGroup>
                <FieldError>{errors.email}</FieldError>
              </Field>

              <Field>
                <FieldLabel htmlFor="support-phone">
                  Phone number (optional)
                </FieldLabel>
                <InputGroup>
                  <InputGroupInput
                    id="support-phone"
                    type="tel"
                    placeholder="07X XXX XX XX"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                  <InputGroupAddon className="self-stretch border-r py-0 pr-1 pl-1">
                    <Select
                      items={countryCodes}
                      value={countryCode}
                      onValueChange={(value) => setCountryCode(String(value))}
                    >
                      <SelectTrigger
                        aria-label="Country code"
                        className="h-full border-0 bg-transparent font-medium text-foreground shadow-none hover:border-0 focus-visible:ring-0 data-popup-open:ring-0"
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {countryCodes.map((code) => (
                          <SelectItem key={code.value} value={code.value}>
                            {code.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </InputGroupAddon>
                </InputGroup>
              </Field>

              <Field data-invalid={!!errors.subject}>
                <FieldLabel htmlFor="support-subject">Subject</FieldLabel>
                <InputGroup>
                  <InputGroupInput
                    id="support-subject"
                    placeholder="Subject"
                    aria-invalid={!!errors.subject}
                    value={subject}
                    onChange={(e) => {
                      setSubject(e.target.value)
                      clearError("subject")
                    }}
                  />
                  <InputGroupAddon>
                    <Tag />
                  </InputGroupAddon>
                </InputGroup>
                <FieldError>{errors.subject}</FieldError>
              </Field>

              <Field data-invalid={!!errors.message}>
                <FieldLabel htmlFor="support-message">
                  How can we help?
                </FieldLabel>
                <InputGroup>
                  <InputGroupTextarea
                    id="support-message"
                    placeholder="Describe your issue..."
                    className="min-h-30 py-3"
                    aria-invalid={!!errors.message}
                    value={message}
                    onChange={(e) => {
                      setMessage(e.target.value)
                      clearError("message")
                    }}
                  />
                  <InputGroupAddon className="self-start pt-3.5">
                    <MessageSquare />
                  </InputGroupAddon>
                </InputGroup>
                <FieldError>{errors.message}</FieldError>
              </Field>
            </FieldGroup>
          </fieldset>
        </form>
      </DialogBody>

      <DialogFooter className="flex-col gap-4 sm:flex-col sm:justify-start">
        <div className="flex w-full gap-3">
          <DialogCancel className="flex-1" disabled={isSending} />
          <Button
            type="submit"
            form="contact-support-form"
            className="flex-2"
            disabled={isSending}
          >
            {isSending ? <Spinner /> : <Send />}
            {isSending ? "Sending..." : "Send message"}
          </Button>
        </div>

        <div className="flex items-center justify-center gap-2 border-t pt-2 text-xs">
          {[
            ["FAQs", "/faq"],
            ["Terms", "/terms"],
            ["Privacy", "/privacy"],
          ].map(([label, href], i) => (
            <span key={href} className="flex items-center gap-2">
              {i > 0 && <span className="text-[0.625rem] text-border">•</span>}
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground transition-colors hover:text-primary"
              >
                {label}
              </a>
            </span>
          ))}
        </div>
      </DialogFooter>
    </>
  )
}
