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
  { id: "about", label: "About the Service" },
  { id: "users", label: "Users" },
  { id: "purchases", label: "Purchases" },
  { id: "payments", label: "Payments" },
  { id: "ip", label: "Intellectual Property" },
  { id: "public-events", label: "Public Event Photography" },
  { id: "use", label: "Use of the Platform" },
  { id: "availability", label: "Availability" },
  { id: "liability", label: "Limitation of Liability" },
  { id: "changes-svc", label: "Changes to Service" },
  { id: "changes-terms", label: "Changes to Terms" },
  { id: "governing-law", label: "Governing Law" },
  { id: "contact", label: "Contact" },
]

const LINKS = [
  { label: "Privacy Policy", href: "/privacy" },
  { label: "FAQs", href: "/faq" },
]

function RoleCard({ role, items }: { role: string; items: string[] }) {
  return (
    <InfoBox label={role} className="flex-1">
      <InfoList items={items} />
    </InfoBox>
  )
}

export function TermsPage() {
  return (
    <InfoPageLayout
      title="Terms of Service"
      subtitle="By accessing or using Gallopics, you agree to these Terms."
      rightContent={<InfoUpdated date="26 Mar 2026" />}
      sections={SECTIONS}
      links={LINKS}
    >
      <InfoSection id="about" number="01" title="About the Service">
        <InfoText>
          Gallopics is an online platform that enables photographers to showcase
          and sell sports photography — primarily equestrian competition images.
          Customers browse and purchase images directly through the platform.
        </InfoText>
      </InfoSection>

      <InfoSection id="users" number="02" title="Users">
        <InfoText>
          Gallopics serves two types of users. We reserve the right to approve
          or reject photographers at our sole discretion.
        </InfoText>
        <div className="mt-3 flex gap-3 max-sm:flex-col">
          <RoleCard
            role="Photographers"
            items={[
              "Approved by Gallopics to sell on the platform",
              "Upload galleries and manage sales",
              "Retain full ownership of all images",
            ]}
          />
          <RoleCard
            role="Customers"
            items={[
              "Browse and purchase images",
              "Receive files digitally via email",
              "Personal use only unless otherwise agreed",
            ]}
          />
        </div>
      </InfoSection>

      <InfoSection id="purchases" number="03" title="Purchases">
        <InfoList
          items={[
            "Customers can purchase images directly through the platform",
            "Purchased images are delivered digitally via email",
            "All purchases are final unless otherwise stated",
          ]}
        />
      </InfoSection>

      <InfoSection id="payments" number="04" title="Payments">
        <InfoText>
          Payments are processed by third-party providers. By making a purchase,
          you also agree to the terms and conditions of the payment provider.{" "}
          <InfoStrong>
            Gallopics does not store full payment details.
          </InfoStrong>
        </InfoText>
      </InfoSection>

      <InfoSection id="ip" number="05" title="Intellectual Property">
        <div className="mt-2 flex gap-3 max-sm:flex-col">
          <RoleCard
            role="Photographers"
            items={[
              "Retain full ownership of their images",
              "Grant Gallopics non-exclusive display and promotion rights",
              "Gallopics may use images for marketing with consent",
            ]}
          />
          <RoleCard
            role="Customers"
            items={[
              "Purchased images for personal use only unless otherwise agreed",
              "No reselling, distributing, or commercial use without photographer permission",
            ]}
          />
        </div>
      </InfoSection>

      <InfoSection
        id="public-events"
        number="06"
        title="Public Event Photography"
      >
        <InfoText>
          Gallopics operates under a Swedish publishing certificate (
          <em>utgivningsbevis</em>), which allows us to publish images from
          public events such as sports competitions, in accordance with Swedish
          law.
        </InfoText>
        <InfoText>
          Even though consent is not required, we strive to handle all content
          with respect for the individuals depicted. If you appear in an image
          on Gallopics and would like it removed, please contact us and we will
          review your request.
        </InfoText>
      </InfoSection>

      <InfoSection id="use" number="07" title="Use of the Platform">
        <InfoText>
          You agree not to use the platform for illegal purposes, attempt to
          interfere with or disrupt the service, or copy, misuse, or distribute
          content without proper rights.
        </InfoText>
      </InfoSection>

      <InfoSection id="availability" number="08" title="Availability">
        <InfoText>
          We aim to keep Gallopics available at all times, but we do not
          guarantee uninterrupted or error-free service.
        </InfoText>
      </InfoSection>

      <InfoSection id="liability" number="09" title="Limitation of Liability">
        <InfoText>
          Gallopics is provided "as is" without warranties of any kind. We are
          not liable for indirect or consequential damages, loss of data,
          income, or business, or issues caused by third-party services.
        </InfoText>
      </InfoSection>

      <InfoSection id="changes-svc" number="10" title="Changes to the Service">
        <InfoText>
          We reserve the right to modify, suspend, or discontinue any part of
          the platform at any time without prior notice.
        </InfoText>
      </InfoSection>

      <InfoSection
        id="changes-terms"
        number="11"
        title="Changes to These Terms"
      >
        <InfoText>
          We may update these Terms from time to time. Continued use of the
          platform after changes means you accept the updated terms.
        </InfoText>
      </InfoSection>

      <InfoSection id="governing-law" number="12" title="Governing Law">
        <InfoText>
          These Terms of Service are governed by the laws of Sweden.
        </InfoText>
      </InfoSection>

      <InfoSection id="contact" number="13" title="Contact" last>
        <InfoText>
          If you have any questions about these Terms, please contact us.
        </InfoText>
        <ContactSupportButton className="mt-4" />
      </InfoSection>
    </InfoPageLayout>
  )
}
