import { cn } from "@/lib/utils"
import {
  ContactSupportButton,
  InfoList,
  InfoPageLayout,
  InfoSection,
  InfoStrong,
  InfoText,
} from "@/components/InfoPageLayout"

const SECTIONS = [
  { id: "finding-photos", label: "Finding Photos" },
  { id: "buying-delivery", label: "Buying & Delivery" },
  { id: "usage-rights", label: "Usage & Rights" },
  { id: "privacy-respect", label: "Privacy & Respect" },
  { id: "photographers", label: "For Photographers" },
  { id: "other", label: "Other Questions" },
]

const LINKS = [
  { label: "Terms of Service", href: "/terms" },
  { label: "Privacy Policy", href: "/privacy" },
]

function FAQItem({
  question,
  last,
  children,
}: {
  question: string
  last?: boolean
  children: React.ReactNode
}) {
  return (
    <div className={cn(!last && "mb-5 border-b pb-5")}>
      <p className="mb-2 text-sm leading-snug font-semibold text-foreground">
        {question}
      </p>
      {children}
    </div>
  )
}

export function FAQPage() {
  return (
    <InfoPageLayout
      title="FAQs"
      subtitle="Everything you need to know about Gallopics"
      rightContent={<ContactSupportButton />}
      sections={SECTIONS}
      links={LINKS}
    >
      <InfoSection
        headingClassName="mb-4"
        contentClassName="space-y-0"
        id="finding-photos"
        number="01"
        title="Finding Photos"
      >
        <FAQItem question="How do I find photos of myself or my horse?">
          <InfoText>
            Browse by event and gallery, or search by rider name, horse name, or
            photographer. Thanks to our competition data integration, images are
            automatically connected to the correct riders and horses based on
            start lists.
          </InfoText>
        </FAQItem>
        <FAQItem question="I can't find my photos — what should I do?">
          <InfoText>A few possible reasons:</InfoText>
          <InfoList
            items={[
              "Not all riders or horses are photographed at every event",
              "The photographer may not have covered your class",
              "Images may still be uploading",
              "Timing differences between the competition schedule and camera can cause incorrect tagging",
            ]}
          />
          <InfoText className="mt-2">
            If you're still having trouble, contact us and we'll help you out.
          </InfoText>
        </FAQItem>
        <FAQItem question="Which events are available on Gallopics?" last>
          <InfoText>
            Gallopics features selected competitions where our photographers are
            present. More events are added continuously as the platform grows.
          </InfoText>
        </FAQItem>
      </InfoSection>

      <InfoSection
        headingClassName="mb-4"
        contentClassName="space-y-0"
        id="buying-delivery"
        number="02"
        title="Buying & Delivery"
      >
        <FAQItem question="How do I buy a photo?">
          <InfoText>
            Select the image you want, add it to your cart, and complete
            checkout. That's it.
          </InfoText>
        </FAQItem>
        <FAQItem question="How will I receive my photos?">
          <InfoText>
            Your photos are delivered digitally via email after your purchase is
            completed.
          </InfoText>
        </FAQItem>
        <FAQItem question="How long does delivery take?">
          <InfoText>
            Delivery is automatic and usually happens within minutes of payment.
          </InfoText>
        </FAQItem>
        <FAQItem question="What payment methods do you accept?" last>
          <InfoText>
            Payments are handled by trusted third-party providers. Available
            methods may vary.
          </InfoText>
        </FAQItem>
      </InfoSection>

      <InfoSection
        headingClassName="mb-4"
        contentClassName="space-y-0"
        id="usage-rights"
        number="03"
        title="Usage & Rights"
      >
        <FAQItem question="What can I use the photos for?">
          <InfoText>
            Purchased images are for{" "}
            <InfoStrong className="font-semibold">personal use</InfoStrong> —
            social media or private use.
          </InfoText>
        </FAQItem>
        <FAQItem question="Can I use the photos commercially?">
          <InfoText>
            No, commercial use requires direct permission from the photographer.
          </InfoText>
        </FAQItem>
        <FAQItem question="Who owns the photos?" last>
          <InfoText>
            All images are owned by the photographer. Gallopics provides the
            platform — that's all.
          </InfoText>
        </FAQItem>
      </InfoSection>

      <InfoSection
        headingClassName="mb-4"
        contentClassName="space-y-0"
        id="privacy-respect"
        number="04"
        title="Privacy & Respect"
      >
        <FAQItem question="Can I request a photo of me to be removed?" last>
          <InfoText>
            <InfoStrong className="font-semibold">Yes, absolutely.</InfoStrong>{" "}
            Gallopics operates under a Swedish publishing certificate
            ("utgivningsbevis"), allowing us to publish images from public
            events. Even so, we always aim to respect individuals. Contact us
            and we'll handle your request.
          </InfoText>
        </FAQItem>
      </InfoSection>

      <InfoSection
        headingClassName="mb-4"
        contentClassName="space-y-0"
        id="photographers"
        number="05"
        title="For Photographers"
      >
        <FAQItem question="How can I become a photographer on Gallopics?">
          <InfoText>
            We work with selected photographers. Contact us and tell us more
            about your work — we'd love to hear from you.
          </InfoText>
        </FAQItem>
        <FAQItem question="Do photographers keep rights to their images?" last>
          <InfoText>
            Yes. Photographers retain full ownership of their images. Gallopics
            takes a commission on sales but never takes ownership.
          </InfoText>
        </FAQItem>
      </InfoSection>

      <InfoSection
        headingClassName="mb-4"
        contentClassName="space-y-0"
        id="other"
        number="06"
        title="Other Questions"
      >
        <FAQItem question="Why are photos not available from every competition?">
          <InfoText>
            Gallopics only features events where our photographers are present.
            We're continuously expanding our coverage.
          </InfoText>
        </FAQItem>
        <FAQItem question="Why are some riders or horses not photographed?">
          <InfoText>
            Photographers can't capture every participant — coverage depends on
            timing, positioning, and the flow of the event.
          </InfoText>
        </FAQItem>
        <FAQItem question="Why do photos cost money?" last>
          <InfoText>
            High-quality sports photography takes time, experience, and
            professional equipment. Purchasing supports the photographers
            directly.
          </InfoText>
        </FAQItem>
      </InfoSection>

      <div className="mt-7">
        <InfoText>Still have questions? We're happy to help.</InfoText>
        <ContactSupportButton className="mt-4" />
      </div>
    </InfoPageLayout>
  )
}
