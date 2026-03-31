import React, { useState, useEffect, useRef } from 'react';
import { InfoPageLayout } from '../components/InfoPageLayout';
import { TitleHeader } from '../components/TitleHeader';

const SECTIONS = [
  { id: 'about', label: 'About the Service' },
  { id: 'users', label: 'Users' },
  { id: 'purchases', label: 'Purchases' },
  { id: 'payments', label: 'Payments' },
  { id: 'ip', label: 'Intellectual Property' },
  { id: 'public-events', label: 'Public Event Photography' },
  { id: 'use', label: 'Use of the Platform' },
  { id: 'availability', label: 'Availability' },
  { id: 'liability', label: 'Limitation of Liability' },
  { id: 'changes-svc', label: 'Changes to Service' },
  { id: 'changes-terms', label: 'Changes to Terms' },
  { id: 'governing-law', label: 'Governing Law' },
  { id: 'contact', label: 'Contact' },
];

const P: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <p className="text-sm text-[var(--color-text-secondary)] leading-[1.75] mt-0 mb-0">
    {children}
  </p>
);

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
);

const SectionBlock: React.FC<{
  id: string;
  number: string;
  title: string;
  children: React.ReactNode;
  last?: boolean;
}> = ({ id, number, title, children, last }) => (
  <div id={id} className="info-section scroll-mt-28 mt-7 first:mt-0">
    <span className="info-section-num">{number}</span>
    <h2 className="text-base font-semibold text-[var(--color-text-primary)] m-0 leading-snug mb-3">
      {title}
    </h2>
    <div className="space-y-2">{children}</div>
    {!last && <hr className="border-[var(--color-border)] mt-7 mb-0" />}
  </div>
);

const UserTypeCard: React.FC<{ role: string; items: string[] }> = ({
  role,
  items,
}) => (
  <div className="flex-1 info-box">
    <p className="info-box-label">{role}</p>
    <BulletList items={items} />
  </div>
);

const IPCard: React.FC<{ role: string; items: string[] }> = ({
  role,
  items,
}) => (
  <div className="flex-1 info-box">
    <p className="info-box-label">{role}</p>
    <BulletList items={items} />
  </div>
);

export const TermsPage: React.FC = () => {
  const [activeSection, setActiveSection] = useState(SECTIONS[0].id);
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) setActiveSection(entry.target.id);
        });
      },
      { rootMargin: '-10% 0px -75% 0px', threshold: 0 },
    );
    SECTIONS.forEach(s => {
      const el = document.getElementById(s.id);
      if (el) observerRef.current?.observe(el);
    });
    return () => observerRef.current?.disconnect();
  }, []);

  return (
    <InfoPageLayout>
      <TitleHeader
        title="Terms of Service"
        subtitle={
          <span className="text-sm text-[var(--color-text-secondary)]">
            By accessing or using Gallopics, you agree to these Terms.
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
          <div className="grid grid-cols-[1fr_200px] gap-12 items-start max-lg:block">
            {/* ── Main content ── */}
            <div className="min-w-0">
              <div className="bg-white rounded-xl border border-[var(--color-border)] shadow-[0_1px_4px_rgba(0,0,0,0.04)] px-8 py-8 md:px-10 md:py-10">
                <SectionBlock id="about" number="01" title="About the Service">
                  <P>
                    Gallopics is an online platform that enables photographers
                    to showcase and sell sports photography — primarily
                    equestrian competition images. Customers browse and purchase
                    images directly through the platform.
                  </P>
                </SectionBlock>

                <SectionBlock id="users" number="02" title="Users">
                  <P>
                    Gallopics serves two types of users. We reserve the right to
                    approve or reject photographers at our sole discretion.
                  </P>
                  <div className="flex gap-3 mt-3 max-sm:flex-col">
                    <UserTypeCard
                      role="Photographers"
                      items={[
                        'Approved by Gallopics to sell on the platform',
                        'Upload galleries and manage sales',
                        'Retain full ownership of all images',
                      ]}
                    />
                    <UserTypeCard
                      role="Customers"
                      items={[
                        'Browse and purchase images',
                        'Receive files digitally via email',
                        'Personal use only unless otherwise agreed',
                      ]}
                    />
                  </div>
                </SectionBlock>

                <SectionBlock id="purchases" number="03" title="Purchases">
                  <BulletList
                    items={[
                      'Customers can purchase images directly through the platform',
                      'Purchased images are delivered digitally via email',
                      'All purchases are final unless otherwise stated',
                    ]}
                  />
                </SectionBlock>

                <SectionBlock id="payments" number="04" title="Payments">
                  <P>
                    Payments are processed by third-party providers. By making a
                    purchase, you also agree to the terms and conditions of the
                    payment provider.{' '}
                    <strong className="text-[var(--color-text-primary)] font-medium">
                      Gallopics does not store full payment details.
                    </strong>
                  </P>
                </SectionBlock>

                <SectionBlock id="ip" number="05" title="Intellectual Property">
                  <div className="flex gap-3 mt-2 max-sm:flex-col">
                    <IPCard
                      role="Photographers"
                      items={[
                        'Retain full ownership of their images',
                        'Grant Gallopics non-exclusive display and promotion rights',
                        'Gallopics may use images for marketing with consent',
                      ]}
                    />
                    <IPCard
                      role="Customers"
                      items={[
                        'Purchased images for personal use only unless otherwise agreed',
                        'No reselling, distributing, or commercial use without photographer permission',
                      ]}
                    />
                  </div>
                </SectionBlock>

                <SectionBlock
                  id="public-events"
                  number="06"
                  title="Public Event Photography"
                >
                  <P>
                    Gallopics operates under a Swedish publishing certificate (
                    <em>utgivningsbevis</em>), which allows us to publish images
                    from public events such as sports competitions, in
                    accordance with Swedish law.
                  </P>
                  <P>
                    Even though consent is not required, we strive to handle all
                    content with respect for the individuals depicted. If you
                    appear in an image on Gallopics and would like it removed,
                    please contact us and we will review your request.
                  </P>
                </SectionBlock>

                <SectionBlock id="use" number="07" title="Use of the Platform">
                  <P>
                    You agree not to use the platform for illegal purposes,
                    attempt to interfere with or disrupt the service, or copy,
                    misuse, or distribute content without proper rights.
                  </P>
                </SectionBlock>

                <SectionBlock
                  id="availability"
                  number="08"
                  title="Availability"
                >
                  <P>
                    We aim to keep Gallopics available at all times, but we do
                    not guarantee uninterrupted or error-free service.
                  </P>
                </SectionBlock>

                <SectionBlock
                  id="liability"
                  number="09"
                  title="Limitation of Liability"
                >
                  <P>
                    Gallopics is provided "as is" without warranties of any
                    kind. We are not liable for indirect or consequential
                    damages, loss of data, income, or business, or issues caused
                    by third-party services.
                  </P>
                </SectionBlock>

                <SectionBlock
                  id="changes-svc"
                  number="10"
                  title="Changes to the Service"
                >
                  <P>
                    We reserve the right to modify, suspend, or discontinue any
                    part of the platform at any time without prior notice.
                  </P>
                </SectionBlock>

                <SectionBlock
                  id="changes-terms"
                  number="11"
                  title="Changes to These Terms"
                >
                  <P>
                    We may update these Terms from time to time. Continued use
                    of the platform after changes means you accept the updated
                    terms.
                  </P>
                </SectionBlock>

                <SectionBlock
                  id="governing-law"
                  number="12"
                  title="Governing Law"
                >
                  <P>
                    These Terms of Service are governed by the laws of Sweden.
                  </P>
                </SectionBlock>

                <div id="contact" className="info-section scroll-mt-28 mt-7">
                  <span className="info-section-num">13</span>
                  <h2 className="text-base font-semibold text-[var(--color-text-primary)] m-0 leading-snug mb-3">
                    Contact
                  </h2>
                  <P>
                    If you have any questions about these Terms, please contact
                    us.
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
                  href="/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-sm text-[var(--color-text-secondary)] no-underline hover:text-[var(--brand)] transition-colors duration-150"
                >
                  Privacy Policy →
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
  );
};
