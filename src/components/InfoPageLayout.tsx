import { useEffect, useState } from "react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { ContactSupportModal } from "@/components/ContactSupportModal"
import { Footer } from "@/components/Footer"
import { PageHeader } from "@/components/PageHeader"
import { TitleHeader } from "@/components/TitleHeader"

/* ─── Layout for FAQ, Terms and Privacy ───────────────────────────── */

interface InfoPageLayoutProps {
  title: string
  subtitle: React.ReactNode
  rightContent?: React.ReactNode
  /** Sections listed in the "On this page" sidebar */
  sections: { id: string; label: string }[]
  /** Links under the sidebar, e.g. to the other info pages */
  links: { label: string; href: string }[]
  /** Shown above the content card */
  intro?: React.ReactNode
  children: React.ReactNode
}

export function InfoPageLayout({
  title,
  subtitle,
  rightContent,
  sections,
  links,
  intro,
  children,
}: InfoPageLayoutProps) {
  const [isContactOpen, setIsContactOpen] = useState(false)
  const activeSection = useActiveSection(sections.map((s) => s.id))

  // No main Header here, so this page owns the contact modal
  useEffect(() => {
    const handleContact = () => setIsContactOpen(true)
    window.addEventListener("open-contact-support", handleContact)
    return () =>
      window.removeEventListener("open-contact-support", handleContact)
  }, [])

  return (
    <div className="flex min-h-screen flex-col bg-[linear-gradient(180deg,#e2e5eb_0%,var(--background)_40%)]">
      <PageHeader />
      <TitleHeader
        variant="info"
        title={title}
        subtitle={<span className="text-sm">{subtitle}</span>}
        rightContent={rightContent}
      />

      <section className="pt-6 pb-16">
        <div className="container">
          <div className="grid grid-cols-[1fr_200px] items-start gap-12 max-lg:block">
            <div className="min-w-0">
              {intro}
              <Card className="gap-0 px-8 py-8 shadow-[0_1px_4px_rgba(0,0,0,0.04)] md:px-10 md:py-10">
                {children}
              </Card>
            </div>

            {/* Sticky table of contents — desktop only */}
            <aside className="sticky top-24 self-start max-lg:hidden">
              <p className="mb-2 px-1 text-[10px] font-semibold tracking-widest text-muted-foreground/70 uppercase">
                On this page
              </p>
              <nav className="space-y-0.5">
                {sections.map((s) => (
                  <a
                    key={s.id}
                    href={`#${s.id}`}
                    className={cn(
                      "block rounded-lg px-3 py-2.5 text-sm leading-snug transition-all duration-150",
                      activeSection === s.id
                        ? "bg-primary/8 font-medium text-primary"
                        : "text-muted-foreground hover:bg-background hover:text-foreground"
                    )}
                  >
                    {s.label}
                  </a>
                ))}
              </nav>
              <div className="mt-5 space-y-1 border-t px-1 pt-4">
                {links.map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block text-sm text-muted-foreground transition-colors duration-150 hover:text-primary"
                  >
                    {link.label} →
                  </a>
                ))}
              </div>
            </aside>
          </div>
        </div>
      </section>

      <Footer minimal noLinks />
      <ContactSupportModal
        isOpen={isContactOpen}
        onClose={() => setIsContactOpen(false)}
      />
    </div>
  )
}

/** Id of the section currently near the top of the viewport. */
function useActiveSection(ids: string[]) {
  const [active, setActive] = useState(ids[0])
  const key = ids.join(",")

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActive(entry.target.id)
        })
      },
      { rootMargin: "-10% 0px -75% 0px", threshold: 0 }
    )
    key.split(",").forEach((id) => {
      const el = document.getElementById(id)
      if (el) observer.observe(el)
    })
    return () => observer.disconnect()
  }, [key])

  return active
}

/* ─── Content helpers ─────────────────────────────────────────────── */

export function ContactSupportButton({ className }: { className?: string }) {
  return (
    <Button
      variant="outline"
      className={className}
      onClick={() => window.dispatchEvent(new Event("open-contact-support"))}
    >
      Contact support
    </Button>
  )
}

/** "Updated <date>" note shown at the right of the title */
export function InfoUpdated({ date }: { date: string }) {
  return (
    <span className="text-xs whitespace-nowrap text-muted-foreground/70">
      Updated {date}
    </span>
  )
}

export function InfoText({
  className,
  children,
}: {
  className?: string
  children: React.ReactNode
}) {
  return (
    <p
      className={cn(
        // my-0 cancels the section's space-y like the old P helper (mt-0 mb-0)
        "my-0 text-sm leading-[1.75] text-muted-foreground",
        className
      )}
    >
      {children}
    </p>
  )
}

/** Inline emphasis inside InfoText */
export function InfoStrong({
  className,
  children,
}: {
  className?: string
  children: React.ReactNode
}) {
  return (
    <strong className={cn("font-medium text-foreground", className)}>
      {children}
    </strong>
  )
}

export function InfoList({ items }: { items: string[] }) {
  return (
    <ul className="mt-2 space-y-1.5">
      {items.map((item, i) => (
        <li
          key={i}
          className="flex items-start gap-2.5 text-sm leading-[1.7] text-muted-foreground"
        >
          <span className="mt-[0.55em] size-1.25 shrink-0 rounded-full bg-muted-foreground opacity-30" />
          {item}
        </li>
      ))}
    </ul>
  )
}

export function InfoBox({
  label,
  className,
  children,
}: {
  label: string
  className?: string
  children: React.ReactNode
}) {
  return (
    <div className={cn("rounded-lg border bg-background p-5.5", className)}>
      <p className="mb-2.5 text-[0.6875rem] leading-normal font-semibold tracking-[0.06em] text-muted-foreground uppercase">
        {label}
      </p>
      {children}
    </div>
  )
}

interface InfoSectionProps {
  id: string
  number: string
  title: string
  /** Hide the divider below the section */
  last?: boolean
  headingClassName?: string
  contentClassName?: string
  children: React.ReactNode
}

export function InfoSection({
  id,
  number,
  title,
  last,
  headingClassName,
  contentClassName,
  children,
}: InfoSectionProps) {
  return (
    <div id={id} className="mt-7 scroll-mt-28 first:mt-0">
      <span className="mb-1.5 block text-[0.625rem] leading-normal font-semibold tracking-[0.05em] text-muted-foreground/70 tabular-nums select-none">
        {number}
      </span>
      <h2
        className={cn(
          "mb-3 text-base leading-snug font-semibold text-foreground",
          headingClassName
        )}
      >
        {title}
      </h2>
      <div className={cn("space-y-2", contentClassName)}>{children}</div>
      {!last && <Separator className="mt-7" />}
    </div>
  )
}
