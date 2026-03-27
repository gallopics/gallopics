import React, { useState, useEffect, useRef } from 'react'
import { InfoPageLayout } from '../components/InfoPageLayout'
import { TitleHeader } from '../components/TitleHeader'

const SECTIONS = [
  { id: 'what-we-do', label: 'What we do' },
  { id: 'info-we-collect', label: 'Information we collect' },
  { id: 'how-we-use', label: 'How we use your data' },
  { id: 'payments', label: 'Payments' },
  { id: 'sharing', label: 'Sharing of data' },
  { id: 'retention', label: 'Data retention' },
  { id: 'gdpr-rights', label: 'Your rights (GDPR)' },
  { id: 'cookies', label: 'Cookies' },
  { id: 'third-party', label: 'Third-party links' },
  { id: 'changes', label: 'Changes' },
  { id: 'contact', label: 'Contact' },
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

const SectionBlock: React.FC<{
  id: string
  number: string
  title: string
  children: React.ReactNode
}> = ({ id, number, title, children }) => (
  <div id={id} className="info-section scroll-mt-28 mt-7 first:mt-0">
    <span className="info-section-num">{number}</span>
    <h2 className="text-base font-semibold text-[var(--color-text-primary)] m-0 leading-snug mb-3">
      {title}
    </h2>
    <div className="space-y-2">{children}</div>
    <hr className="border-[var(--color-border)] mt-7 mb-0" />
  </div>
)

const InfoGrid: React.FC<{ items: { label: string; entries: string[] }[] }> = ({
  items,
}) => (
  <div className="grid grid-cols-4 gap-2 mt-2 max-lg:grid-cols-2 max-sm:grid-cols-1">
    {items.map(({ label, entries }) => (
      <div key={label} className="info-box">
        <p className="info-box-label">{label}</p>
        {entries.map((e, i) => (
          <p
            key={i}
            className="text-sm text-[var(--color-text-secondary)] leading-[1.6] m-0"
          >
            {e}
          </p>
        ))}
      </div>
    ))}
  </div>
)

const RightChip: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span className="inline-flex items-center gap-1.5 bg-[var(--color-bg)] border border-[var(--color-border)] text-sm text-[var(--color-text-primary)] rounded-full px-3 py-1.5">
    <span className="text-[var(--brand)] text-xs font-bold leading-none">
      ✓
    </span>
    {children}
  </span>
)

export const PrivacyPage: React.FC = () => {
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
        title="Privacy Policy"
        subtitle={
          <span className="text-sm text-[var(--color-text-secondary)]">
            Gallopics is committed to protecting your personal data.
          </span>
        }
        rightContent={
          <span className="text-xs text-[var(--color-text-tertiary)] whitespace-nowrap">
            Updated 26 Mar 2026
          </span>
        }
      />

      <section className="grid-section py-12 md:py-16">
        <div className="container">
          <div className="grid grid-cols-[1fr_200px] gap-12 items-start max-lg:block max-lg:space-y-0">
            {/* ── Main content ── */}
            <div className="min-w-0">
              {/* Key facts */}
              <div className="flex flex-wrap gap-2 mb-8">
                <RightChip>We don't sell your data</RightChip>
                <RightChip>Payments via trusted third parties</RightChip>
                <RightChip>Full GDPR rights apply</RightChip>
                <RightChip>Request deletion anytime</RightChip>
              </div>

              <div className="bg-white rounded-xl border border-[var(--color-border)] shadow-[0_1px_4px_rgba(0,0,0,0.04)] px-8 py-8 md:px-10 md:py-10">
                <SectionBlock id="what-we-do" number="01" title="What we do">
                  <P>
                    Gallopics is an online platform where photographers showcase
                    and sell sports photography — primarily equestrian
                    competition images. Customers browse and purchase images
                    directly through the platform.
                  </P>
                </SectionBlock>

                <SectionBlock
                  id="info-we-collect"
                  number="02"
                  title="Information we collect"
                >
                  <InfoGrid
                    items={[
                      {
                        label: 'Personal',
                        entries: [
                          'Email address',
                          'Contact information you provide',
                        ],
                      },
                      {
                        label: 'Transaction',
                        entries: [
                          'Images purchased',
                          'Payment data via third parties',
                        ],
                      },
                      {
                        label: 'Technical',
                        entries: [
                          'IP address',
                          'Browser & device info',
                          'Usage data',
                        ],
                      },
                      {
                        label: 'Cookies & Tracking',
                        entries: ['Google Analytics', 'Similar technologies'],
                      },
                    ]}
                  />
                </SectionBlock>

                <SectionBlock
                  id="how-we-use"
                  number="03"
                  title="How we use your information"
                >
                  <BulletList
                    items={[
                      'Deliver purchased images',
                      'Process transactions',
                      'Provide customer support',
                      'Improve and develop the platform',
                      'Send updates, offers, or newsletters (if you opt in)',
                      'Ensure security and prevent misuse',
                    ]}
                  />
                </SectionBlock>

                <SectionBlock id="payments" number="04" title="Payments">
                  <P>
                    All payments are processed by third-party providers.{' '}
                    <strong className="text-[var(--color-text-primary)] font-medium">
                      We do not store your full payment details.
                    </strong>{' '}
                    These providers handle your payment information according to
                    their own privacy policies.
                  </P>
                </SectionBlock>

                <SectionBlock id="sharing" number="05" title="Sharing of data">
                  <P>
                    <strong className="text-[var(--color-text-primary)] font-medium">
                      We do not sell your personal data.
                    </strong>{' '}
                    We may share information only with payment providers,
                    hosting and analytics services, and authorities if required
                    by law.
                  </P>
                </SectionBlock>

                <SectionBlock id="retention" number="06" title="Data retention">
                  <P>
                    We retain your information only as long as necessary to
                    fulfill purchases, comply with legal obligations, and
                    improve our services.
                  </P>
                </SectionBlock>

                <SectionBlock
                  id="gdpr-rights"
                  number="07"
                  title="Your rights (GDPR)"
                >
                  <P>
                    If you are located in the EU, you have the right to access
                    your personal data, request correction or deletion, restrict
                    or object to processing, and request data portability.
                  </P>
                  <div className="flex flex-wrap gap-2 mt-3">
                    {[
                      'Access your data',
                      'Correct or delete',
                      'Restrict processing',
                      'Data portability',
                    ].map(r => (
                      <RightChip key={r}>{r}</RightChip>
                    ))}
                  </div>
                </SectionBlock>

                <SectionBlock id="cookies" number="08" title="Cookies">
                  <P>
                    You can control or disable cookies through your browser
                    settings. Note that some parts of the website may not
                    function properly without them.
                  </P>
                </SectionBlock>

                <SectionBlock
                  id="third-party"
                  number="09"
                  title="Third-party links"
                >
                  <P>
                    Our platform may contain links to third-party websites. We
                    are not responsible for their privacy practices.
                  </P>
                </SectionBlock>

                <SectionBlock
                  id="changes"
                  number="10"
                  title="Changes to this policy"
                >
                  <P>
                    We may update this Privacy Policy from time to time. Changes
                    will be posted on this page.
                  </P>
                </SectionBlock>

                <div id="contact" className="info-section scroll-mt-28 mt-7">
                  <span className="info-section-num">11</span>
                  <h2 className="text-base font-semibold text-[var(--color-text-primary)] m-0 leading-snug mb-3">
                    Contact
                  </h2>
                  <P>
                    If you have questions about this Privacy Policy, please
                    contact us.
                  </P>
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
                  href="/faq"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-sm text-[var(--color-text-secondary)] no-underline hover:text-[var(--brand)] transition-colors duration-150"
                >
                  FAQs →
                </a>
              </div>
            </aside>
          </div>
        </div>
      </section>
    </InfoPageLayout>
  )
}
