import { cn } from "@/lib/utils"
import { FacebookIcon } from "@/components/icons/FacebookIcon"
import { InstagramIcon } from "@/components/icons/InstagramIcon"
import { TikTokIcon } from "@/components/icons/TikTokIcon"

export interface CopyrightBarProps {
  /** White bar without social icons (standalone, no full footer above) */
  minimal?: boolean
  /** Compact stacked variant for the photographer sidebar */
  sidebar?: boolean
  /** Hide the Support link (admin context) */
  isAdmin?: boolean
  /** Hide all nav links (info pages) */
  noLinks?: boolean
}

const year = new Date().getFullYear()

function openSupport(photographerOnly = false) {
  window.dispatchEvent(
    new CustomEvent("open-contact-support", { detail: { photographerOnly } })
  )
}

function FooterLink({
  href,
  className,
  children,
}: {
  href: string
  className?: string
  children: React.ReactNode
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "text-[0.8125rem] text-muted-foreground transition-colors hover:text-foreground",
        className
      )}
    >
      {children}
    </a>
  )
}

const socialLinkClass =
  "flex size-9 items-center justify-center rounded-full bg-white/10 text-white transition-all hover:scale-110 hover:bg-white/20 max-md:size-11"

export function CopyrightBar({
  minimal = false,
  sidebar = false,
  isAdmin = false,
  noLinks = false,
}: CopyrightBarProps) {
  if (sidebar) {
    const sidebarLink = "text-xs leading-normal hover:text-primary"
    return (
      <div className="flex w-full flex-col items-start gap-2">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <FooterLink href="/faq" className={sidebarLink}>
            FAQs
          </FooterLink>
          {!isAdmin && (
            <button
              type="button"
              onClick={() => openSupport(true)}
              className="text-xs leading-normal text-muted-foreground hover:text-primary"
            >
              Support
            </button>
          )}
          <FooterLink href="/terms" className={sidebarLink}>
            Terms
          </FooterLink>
          <FooterLink href="/privacy" className={sidebarLink}>
            Privacy
          </FooterLink>
        </div>
        <span className="text-xs leading-normal text-muted-foreground">
          © {year} Gallopics
        </span>
      </div>
    )
  }

  if (minimal) {
    return (
      <div className="mt-auto border-t py-4">
        <div className="container">
          <div
            className={cn(
              "flex items-center justify-between gap-4 max-md:flex-col max-md:items-start max-md:gap-2",
              // Info pages: only the copyright, centered
              noLinks && "justify-center max-md:items-center"
            )}
          >
            <span className="text-[0.8125rem] text-muted-foreground">
              © {year} Gallopics
            </span>
            {!noLinks && (
              <div className="flex items-center gap-4">
                <FooterLink href="/faq">FAQs</FooterLink>
                <FooterLink href="/terms">Terms of service</FooterLink>
                <FooterLink href="/privacy">Privacy policy</FooterLink>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  // Full dark bar, shown below the dark footer
  const darkLink = "hover:text-white"
  return (
    <div className="border-t border-white/5 bg-[#1a1a1a] py-7 lg:py-3.5">
      <div className="container">
        <div className="grid w-full grid-cols-[1fr_auto_1fr] items-center max-md:flex max-md:flex-col max-md:gap-6 max-md:text-center">
          <div className="flex justify-start gap-3 max-md:order-1 max-md:justify-center">
            <a
              href="https://www.instagram.com/gallopics"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
              className={socialLinkClass}
            >
              <InstagramIcon size={20} />
            </a>
            <a
              href="https://www.tiktok.com/@gallopics"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="TikTok"
              className={socialLinkClass}
            >
              <TikTokIcon size={20} />
            </a>
            <a
              href="https://www.facebook.com/share/1DriauvcA6/?mibextid=wwXIfr"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Facebook"
              className={socialLinkClass}
            >
              <FacebookIcon size={20} />
            </a>
          </div>

          <span className="text-center text-[0.8125rem] whitespace-nowrap text-muted-foreground max-md:order-3 max-md:whitespace-normal">
            © {year} Gallopics
          </span>

          <div className="flex items-center justify-end gap-4 max-md:order-2 max-md:flex-wrap max-md:justify-center max-md:gap-y-2">
            <FooterLink
              href="/faq"
              className={cn(darkLink, "hidden max-md:inline")}
            >
              FAQs
            </FooterLink>
            <FooterLink href="/terms" className={darkLink}>
              Terms of service
            </FooterLink>
            <FooterLink href="/privacy" className={darkLink}>
              Privacy policy
            </FooterLink>
          </div>
        </div>
      </div>
    </div>
  )
}
