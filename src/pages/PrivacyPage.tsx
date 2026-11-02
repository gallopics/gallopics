import { Check } from "lucide-react"

import {
  ContactSupportButton,
  InfoBox,
  InfoList,
  InfoPageLayout,
  InfoSection,
  InfoStrong,
  InfoText,
  InfoUpdated,
} from "@/components/InfoPageLayout"

const SECTIONS = [
  { id: "what-we-do", label: "What we do" },
  { id: "info-we-collect", label: "Information we collect" },
  { id: "how-we-use", label: "How we use your data" },
  { id: "payments", label: "Payments" },
  { id: "sharing", label: "Sharing of data" },
  { id: "retention", label: "Data retention" },
  { id: "gdpr-rights", label: "Your rights (GDPR)" },
  { id: "cookies", label: "Cookies" },
  { id: "third-party", label: "Third-party links" },
  { id: "changes", label: "Changes" },
  { id: "contact", label: "Contact" },
]

const LINKS = [
  { label: "Terms of Service", href: "/terms" },
  { label: "FAQs", href: "/faq" },
]

const KEY_FACTS = [
  "We don't sell your data",
  "Payments via trusted third parties",
  "Full GDPR rights apply",
  "Request deletion anytime",
]

function InfoGrid({
  items,
}: {
  items: { label: string; entries: string[] }[]
}) {
  return (
    <div className="mt-2 grid grid-cols-4 gap-2 max-lg:grid-cols-2 max-sm:grid-cols-1">
      {items.map(({ label, entries }) => (
        <InfoBox key={label} label={label}>
          {entries.map((e, i) => (
            <p key={i} className="text-sm leading-[1.6] text-muted-foreground">
              {e}
            </p>
          ))}
        </InfoBox>
      ))}
    </div>
  )
}

function RightChip({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border bg-background px-3 py-1.5 text-sm text-foreground">
      <Check className="size-3 stroke-3 text-primary" />
      {children}
    </span>
  )
}

export function PrivacyPage() {
  return (
    <InfoPageLayout
      title="Privacy Policy"
      subtitle="Gallopics is committed to protecting your personal data."
      rightContent={<InfoUpdated date="26 Mar 2026" />}
      sections={SECTIONS}
      links={LINKS}
      intro={
        <div className="mb-8 flex flex-wrap gap-2">
          {KEY_FACTS.map((fact) => (
            <RightChip key={fact}>{fact}</RightChip>
          ))}
        </div>
      }
    >
      <InfoSection id="what-we-do" number="01" title="What we do">
        <InfoText>
          Gallopics is an online platform where photographers showcase and sell
          sports photography — primarily equestrian competition images.
          Customers browse and purchase images directly through the platform.
        </InfoText>
      </InfoSection>

      <InfoSection
        id="info-we-collect"
        number="02"
        title="Information we collect"
      >
        <InfoGrid
          items={[
            {
              label: "Personal",
              entries: ["Email address", "Contact information you provide"],
            },
            {
              label: "Transaction",
              entries: ["Images purchased", "Payment data via third parties"],
            },
            {
              label: "Technical",
              entries: ["IP address", "Browser & device info", "Usage data"],
            },
            {
              label: "Cookies & Tracking",
              entries: ["Google Analytics", "Similar technologies"],
            },
          ]}
        />
      </InfoSection>

      <InfoSection
        id="how-we-use"
        number="03"
        title="How we use your information"
      >
        <InfoList
          items={[
            "Deliver purchased images",
            "Process transactions",
            "Provide customer support",
            "Improve and develop the platform",
            "Send updates, offers, or newsletters (if you opt in)",
            "Ensure security and prevent misuse",
          ]}
        />
      </InfoSection>

      <InfoSection id="payments" number="04" title="Payments">
        <InfoText>
          All payments are processed by third-party providers.{" "}
          <InfoStrong>We do not store your full payment details.</InfoStrong>{" "}
          These providers handle your payment information according to their own
          privacy policies.
        </InfoText>
      </InfoSection>

      <InfoSection id="sharing" number="05" title="Sharing of data">
        <InfoText>
          <InfoStrong>We do not sell your personal data.</InfoStrong> We may
          share information only with payment providers, hosting and analytics
          services, and authorities if required by law.
        </InfoText>
      </InfoSection>

      <InfoSection id="retention" number="06" title="Data retention">
        <InfoText>
          We retain your information only as long as necessary to fulfill
          purchases, comply with legal obligations, and improve our services.
        </InfoText>
      </InfoSection>

      <InfoSection id="gdpr-rights" number="07" title="Your rights (GDPR)">
        <InfoText>
          If you are located in the EU, you have the right to access your
          personal data, request correction or deletion, restrict or object to
          processing, and request data portability.
        </InfoText>
        <div className="mt-3 flex flex-wrap gap-2">
          {[
            "Access your data",
            "Correct or delete",
            "Restrict processing",
            "Data portability",
          ].map((r) => (
            <RightChip key={r}>{r}</RightChip>
          ))}
        </div>
      </InfoSection>

      <InfoSection id="cookies" number="08" title="Cookies">
        <InfoText>
          You can control or disable cookies through your browser settings. Note
          that some parts of the website may not function properly without them.
        </InfoText>
      </InfoSection>

      <InfoSection id="third-party" number="09" title="Third-party links">
        <InfoText>
          Our platform may contain links to third-party websites. We are not
          responsible for their privacy practices.
        </InfoText>
      </InfoSection>

      <InfoSection id="changes" number="10" title="Changes to this policy">
        <InfoText>
          We may update this Privacy Policy from time to time. Changes will be
          posted on this page.
        </InfoText>
      </InfoSection>

      <InfoSection id="contact" number="11" title="Contact" last>
        <InfoText>
          If you have questions about this Privacy Policy, please contact us.
        </InfoText>
        <ContactSupportButton className="mt-4" />
      </InfoSection>
    </InfoPageLayout>
  )
}
