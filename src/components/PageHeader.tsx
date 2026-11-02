import { assetUrl, cn } from "@/lib/utils"
import { useScrolled } from "@/hooks/useScrolled"

/** Logo-only header used on info pages (FAQ, Terms, Privacy). */
export function PageHeader() {
  const scrolled = useScrolled()

  return (
    <header
      className={cn(
        "sticky top-0 z-40 border border-black/4 bg-card transition-[background-color,box-shadow] duration-400 ease-[cubic-bezier(0.2,0,0.2,1)]",
        scrolled &&
          "border-b-black/5 bg-card/85 shadow-[0_4px_12px_rgba(0,0,0,0.03)] backdrop-blur-md"
      )}
    >
      <div className="container flex min-h-16 max-w-none items-center md:h-18">
        <a href={assetUrl("")} className="flex shrink-0 items-center">
          <img
            src={assetUrl("images/logo1-blue.svg")}
            alt="GALLOPICS"
            className="block h-6 w-auto min-[480px]:h-7"
          />
        </a>
      </div>
    </header>
  )
}
