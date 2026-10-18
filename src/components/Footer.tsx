import { assetUrl } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { CopyrightBar } from "@/components/CopyrightBar"

interface FooterProps {
  minimal?: boolean
  sidebar?: boolean
  isAdmin?: boolean
  noLinks?: boolean
}

export function Footer({
  minimal = false,
  sidebar = false,
  isAdmin = false,
  noLinks = false,
}: FooterProps) {
  if (minimal) {
    return (
      <CopyrightBar
        minimal
        sidebar={sidebar}
        isAdmin={isAdmin}
        noLinks={noLinks}
      />
    )
  }

  return (
    <>
      <footer
        className="mt-auto bg-[#1a1a1a] py-7 text-white"
        data-footer="guest-full"
      >
        <div className="container">
          <div className="flex items-center justify-between gap-10 max-md:flex-col max-md:gap-8 max-md:text-center">
            <div className="flex max-w-110 flex-1 flex-col gap-4 max-md:max-w-full max-md:items-center">
              <img
                src={assetUrl("images/logo2.svg")}
                alt="Gallopics"
                className="h-8 w-auto self-start object-contain opacity-90 brightness-0 invert max-md:self-center"
              />
              <p className="text-sm leading-relaxed text-muted-foreground">
                We capture horse competitions across Sweden. Search your event,
                spot your photos, and purchase your favorites.
              </p>
            </div>

            <div className="flex flex-none items-center gap-6 max-md:w-full max-md:flex-col">
              {/* Mobile: links hidden but the empty row keeps its 24px gap (as on the old site) */}
              <div className="flex items-center gap-3 max-md:*:hidden">
                <a
                  href="/faq"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-medium text-muted-foreground transition-colors hover:text-white"
                >
                  FAQs
                </a>
                <span className="text-[0.4rem] text-foreground">•</span>
              </div>
              <Button
                size="sm"
                // Old footer button: 20px/8px padding, 14px text (13px on mobile)
                className="h-auto border-0 bg-white px-5 py-2 text-sm leading-normal text-black hover:-translate-y-0.5 hover:bg-border max-md:px-4 max-md:py-1.5 max-md:text-[0.8125rem]"
                onClick={() =>
                  window.dispatchEvent(new Event("open-contact-support"))
                }
              >
                Contact support
              </Button>
            </div>
          </div>
        </div>
      </footer>
      <CopyrightBar />
    </>
  )
}
