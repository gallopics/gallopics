import React, { useState, useEffect, useRef } from 'react'
import { InfoPageLayout } from '../components/InfoPageLayout'
import { TitleHeader } from '../components/TitleHeader'

const SECTIONS = [
  { id: 'finding-photos', label: 'Finding Photos' },
  { id: 'buying-delivery', label: 'Buying & Delivery' },
  { id: 'usage-rights', label: 'Usage & Rights' },
  { id: 'privacy-respect', label: 'Privacy & Respect' },
  { id: 'photographers', label: 'For Photographers' },
  { id: 'other', label: 'Other Questions' },
]

const P: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <p className="text-sm text-[var(--color-text-secondary)] leading-[1.75] mt-0 mb-0">
    {children}
  </p>
)

const BulletList: React.FC<{ items: string[] }> = ({ items }) => (
  <ul className="mt-2 space-y-1.5">
    {items.map((item, i) => (
      <li
        key={i}
        className="flex items-start gap-2.5 text-sm text-[var(--color-text-secondary)] leading-[1.7]"
      >
        <span className="w-[5px] h-[5px] rounded-full bg-[var(--color-text-secondary)] opacity-30 flex-shrink-0 mt-[0.55em]" />
        {item}
      </li>
    ))}
  </ul>
)

interface FAQItemProps {
  question: string
  children: React.ReactNode
  last?: boolean
}

const FAQItem: React.FC<FAQItemProps> = ({ question, children, last }) => (
  <div
    className={!last ? 'pb-5 border-b border-[var(--color-border)] mb-5' : ''}
  >
    <p className="text-sm font-semibold text-[var(--color-text-primary)] mb-2 leading-snug m-0">
      {question}
    </p>
    {children}
  </div>
)

const SectionBlock: React.FC<{
  id: string
  number: string
  title: string
  children: React.ReactNode
}> = ({ id, number, title, children }) => (
  <div id={id} className="info-section scroll-mt-28 mt-7 first:mt-0">
    <span className="info-section-num">{number}</span>
    <h2 className="text-base font-semibold text-[var(--color-text-primary)] m-0 leading-snug mb-4">
      {title}
    </h2>
    <div>{children}</div>
    <hr className="border-[var(--color-border)] mt-7 mb-0" />
  </div>
)

export const FAQPage: React.FC = () => {
  const [activeSection, setActiveSection] = useState(SECTIONS[0].id)
  const observerRef = useRef<IntersectionObserver | null>(null)

  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) setActiveSection(entry.target.id)
        })
      },
      { rootMargin: '-10% 0px -75% 0px', threshold: 0 }
    )
    SECTIONS.forEach(s => {
      const el = document.getElementById(s.id)
      if (el) observerRef.current?.observe(el)
    })
    return () => observerRef.current?.disconnect()
  }, [])

  return (
    <InfoPageLayout>
      <TitleHeader
        title="FAQs"
        subtitle={
          <span className="text-sm text-[var(--color-text-secondary)]">
            Everything you need to know about Gallopics
          </span>
        }
        rightContent={
          <button
            className="btn-secondary"
            onClick={() =>
              window.dispatchEvent(new Event('open-contact-support'))
            }
          >
            Contact support
          </button>
        }
      />

      <section className="grid-section py-12 md:py-16">
        <div className="container">
          <div className="grid grid-cols-[1fr_200px] gap-12 items-start max-lg:block">
            {/* ── Main content ── */}
            <div className="min-w-0">
              <div className="bg-white rounded-xl border border-[var(--color-border)] shadow-[0_1px_4px_rgba(0,0,0,0.04)] px-8 py-8 md:px-10 md:py-10">
                <SectionBlock
                  id="finding-photos"
                  number="01"
                  title="Finding Photos"
                >
                  <FAQItem question="How do I find photos of myself or my horse?">
                    <P>
                      Browse by event and gallery, or search by rider name,
                      horse name, or photographer. Thanks to our competition
                      data integration, images are automatically connected to
                      the correct riders and horses based on start lists.
                    </P>
                  </FAQItem>
                  <FAQItem question="I can't find my photos — what should I do?">
                    <P>A few possible reasons:</P>
                    <BulletList
                      items={[
                        'Not all riders or horses are photographed at every event',
                        'The photographer may not have covered your class',
                        'Images may still be uploading',
                        'Timing differences between the competition schedule and camera can cause incorrect tagging',
                      ]}
                    />
                    <p className="text-sm text-[var(--color-text-secondary)] leading-[1.75] mt-2 mb-0">
                      If you're still having trouble, contact us and we'll help
                      you out.
                    </p>
                  </FAQItem>
                  <FAQItem
                    question="Which events are available on Gallopics?"
                    last
                  >
                    <P>
                      Gallopics features selected competitions where our
                      photographers are present. More events are added
                      continuously as the platform grows.
                    </P>
                  </FAQItem>
                </SectionBlock>

                <SectionBlock
                  id="buying-delivery"
                  number="02"
                  title="Buying & Delivery"
                >
                  <FAQItem question="How do I buy a photo?">
                    <P>
                      Select the image you want, add it to your cart, and
                      complete checkout. That's it.
                    </P>
                  </FAQItem>
                  <FAQItem question="How will I receive my photos?">
                    <P>
                      Your photos are delivered digitally via email after your
                      purchase is completed.
                    </P>
                  </FAQItem>
                  <FAQItem question="How long does delivery take?">
                    <P>
                      Delivery is automatic and usually happens within minutes
                      of payment.
                    </P>
                  </FAQItem>
                  <FAQItem question="What payment methods do you accept?" last>
                    <P>
                      Payments are handled by trusted third-party providers.
                      Available methods may vary.
                    </P>
                  </FAQItem>
                </SectionBlock>

                <SectionBlock
                  id="usage-rights"
                  number="03"
                  title="Usage & Rights"
                >
                  <FAQItem question="What can I use the photos for?">
                    <P>
                      Purchased images are for{' '}
                      <strong className="text-[var(--color-text-primary)] font-semibold">
                        personal use
                      </strong>{' '}
                      — social media or private use.
                    </P>
                  </FAQItem>
                  <FAQItem question="Can I use the photos commercially?">
                    <P>
                      No, commercial use requires direct permission from the
                      photographer.
                    </P>
                  </FAQItem>
                  <FAQItem question="Who owns the photos?" last>
                    <P>
                      All images are owned by the photographer. Gallopics
                      provides the platform — that's all.
                    </P>
                  </FAQItem>
                </SectionBlock>

                <SectionBlock
                  id="privacy-respect"
                  number="04"
                  title="Privacy & Respect"
                >
                  <FAQItem
                    question="Can I request a photo of me to be removed?"
                    last
                  >
                    <P>
                      <strong className="text-[var(--color-text-primary)] font-semibold">
                        Yes, absolutely.
                      </strong>{' '}
                      Gallopics operates under a Swedish publishing certificate
                      ("utgivningsbevis"), allowing us to publish images from
                      public events. Even so, we always aim to respect
                      individuals. Contact us and we'll handle your request.
                    </P>
                  </FAQItem>
                </SectionBlock>

                <SectionBlock
                  id="photographers"
                  number="05"
                  title="For Photographers"
                >
                  <FAQItem question="How can I become a photographer on Gallopics?">
                    <P>
                      We work with selected photographers. Contact us and tell
                      us more about your work — we'd love to hear from you.
                    </P>
                  </FAQItem>
                  <FAQItem
                    question="Do photographers keep rights to their images?"
                    last
                  >
                    <P>
                      Yes. Photographers retain full ownership of their images.
                      Gallopics takes a commission on sales but never takes
                      ownership.
                    </P>
                  </FAQItem>
                </SectionBlock>

                <SectionBlock id="other" number="06" title="Other Questions">
                  <FAQItem question="Why are photos not available from every competition?">
                    <P>
                      Gallopics only features events where our photographers are
                      present. We're continuously expanding our coverage.
                    </P>
                  </FAQItem>
                  <FAQItem question="Why are some riders or horses not photographed?">
                    <P>
                      Photographers can't capture every participant — coverage
                      depends on timing, positioning, and the flow of the event.
                    </P>
                  </FAQItem>
                  <FAQItem question="Why do photos cost money?" last>
                    <P>
                      High-quality sports photography takes time, experience,
                      and professional equipment. Purchasing supports the
                      photographers directly.
                    </P>
                  </FAQItem>
                </SectionBlock>

                <div className="mt-7">
                  <P>Still have questions? We're happy to help.</P>
                  <button
                    className="btn-secondary mt-4"
                    onClick={() =>
                      window.dispatchEvent(new Event('open-contact-support'))
                    }
                  >
                    Contact support
                  </button>
                </div>
              </div>
            </div>

            {/* ── Floating sticky TOC — desktop only ── */}
            <aside className="self-start sticky top-24 max-lg:hidden">
              <p className="text-[10px] font-semibold text-[var(--color-text-tertiary)] uppercase tracking-widest mb-2 px-1">
                On this page
              </p>
              <nav className="space-y-0.5">
                {SECTIONS.map(s => (
                  <a
                    key={s.id}
                    href={`#${s.id}`}
                    className={[
                      'block px-3 py-2.5 rounded-lg text-sm no-underline transition-all duration-150 leading-snug',
                      activeSection === s.id
                        ? 'bg-[var(--color-brand-tint)] text-[var(--brand)] font-medium'
                        : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg)]',
                    ].join(' ')}
                  >
                    {s.label}
                  </a>
                ))}
              </nav>
              <div className="mt-5 pt-4 border-t border-[var(--color-border)] space-y-1 px-1">
                <a
                  href="/terms"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-sm text-[var(--color-text-secondary)] no-underline hover:text-[var(--brand)] transition-colors duration-150"
                >
                  Terms of Service →
                </a>
                <a
                  href="/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-sm text-[var(--color-text-secondary)] no-underline hover:text-[var(--brand)] transition-colors duration-150"
                >
                  Privacy Policy →
                </a>
              </div>
            </aside>
          </div>
        </div>
      </section>
    </InfoPageLayout>
  )
}
