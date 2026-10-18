import { useCallback, useEffect, useRef, useState } from "react"
import { Link } from "react-router"
import { useUser } from "@clerk/clerk-react"
import { Camera, LayoutDashboard } from "lucide-react"

import { assetUrl, cn } from "@/lib/utils"
import { useAuth } from "@/context/AuthContext"
import { Button } from "@/components/ui/button"
import {
  ModernSearchBar,
  type EventSearchProps,
} from "@/components/ModernSearchBar"

/* Home page hero (old `TitleHeader variant="ehome"`). */

interface HomeHeroProps {
  title: React.ReactNode
  description: React.ReactNode
  search?: EventSearchProps
}

const cardBase =
  "flex flex-col justify-between rounded-[32px] transition-[translate,box-shadow] duration-400 ease-[cubic-bezier(0.2,0,0.2,1)] hover:-translate-y-1"

/** Guest view on mobile: cards become a full-bleed swipe carousel */
const guestSlide =
  "max-md:min-h-75 max-md:max-h-130 max-md:w-[calc(100%-32px)] max-md:flex-[0_0_calc(100%-32px)] max-md:snap-center max-md:mx-4 max-md:justify-start max-md:gap-5 max-md:overflow-hidden max-md:rounded-3xl max-md:border max-md:border-black/4 max-md:p-7 max-[374px]:min-h-55 max-[374px]:p-6"

/** Card headings: one line per phrase on desktop, free wrapping on mobile */
const guestHeading =
  "max-md:text-[2rem]! max-md:leading-[1.1]! max-md:tracking-[-0.02em] max-md:text-balance max-md:[&_br]:hidden max-[374px]:text-[1.75rem]!"

/** Photo background of the main hero card (also used by PendingApproval) */
export const heroCardBackground = {
  style: {
    "--hero-bg": `url(${assetUrl("images/card1.jpg")})`,
    "--hero-bg-mobile": `url(${assetUrl("images/card1_mobile.jpg")})`,
  } as React.CSSProperties,
  className: cn(
    "rounded-[32px] bg-cover bg-center p-14 text-white max-lg:p-10 max-md:px-6 max-md:py-7",
    "bg-[image:linear-gradient(to_right,rgba(0,0,0,0.4)_0%,rgba(0,0,0,0.1)_60%,transparent_100%),var(--hero-bg)]",
    "max-md:bg-[image:linear-gradient(to_right,rgba(0,0,0,0.4)_0%,rgba(0,0,0,0.1)_60%,transparent_100%),var(--hero-bg-mobile)]"
  ),
}

function MainCard({
  title,
  description,
  search = {},
  guest,
}: HomeHeroProps & { guest?: boolean }) {
  return (
    <div
      style={heroCardBackground.style}
      className={cn(
        cardBase,
        heroCardBackground.className,
        "min-h-80 hover:shadow-[0_12px_32px_rgba(0,0,0,0.08)] max-md:min-h-65",
        guest && guestSlide
      )}
    >
      <div className="z-2 flex max-w-120 flex-1 flex-col gap-4">
        <h1
          className={cn(
            "font-heading text-5xl leading-[1.05] font-semibold tracking-[-0.03em] text-white max-[375px]:text-[2.25rem] max-md:text-[2.5rem]",
            guest && guestHeading
          )}
        >
          {title}
        </h1>
        <p
          className={cn(
            "text-base leading-relaxed font-[450] text-white/90",
            guest && "max-md:text-sm max-md:leading-[1.4] max-md:font-normal"
          )}
        >
          {description}
        </p>
      </div>
      <div className="mt-8 max-w-140 max-md:hidden">
        <ModernSearchBar
          theme="light"
          heroMode
          isMobileTrigger
          mobilePlaceholder="Search events"
          desktopPlaceholder="Search events, riders, horses, photographers..."
          eventOptions={search.searchEvents}
          eventSearchIndex={search.eventSearchIndex}
          eventMatchLabels={search.eventMatchLabels}
          eventOnly={Boolean(search.searchEvents)}
          onSearchChange={search.onSearchChange}
        />
      </div>
    </div>
  )
}

function SideCard({
  heading,
  text,
  action,
  className,
  style,
  guest,
}: {
  heading: React.ReactNode
  text: React.ReactNode
  action: React.ReactNode
  className?: string
  style?: React.CSSProperties
  guest?: boolean
}) {
  return (
    <div
      style={style}
      className={cn(
        cardBase,
        "p-8 hover:shadow-[0_12px_32px_rgba(0,0,0,0.12)]",
        guest && guestSlide,
        className
      )}
    >
      <div className="z-2 flex max-w-120 flex-1 flex-col gap-4">
        <h2
          className={cn(
            "font-heading text-2xl leading-[1.1] font-semibold tracking-[-0.02em] text-balance text-white max-md:text-[2.5rem]",
            guest && guestHeading
          )}
        >
          {heading}
        </h2>
        <p className="text-[0.8125rem] leading-normal text-white/90">{text}</p>
      </div>
      <div className="mt-8 max-md:mt-auto">{action}</div>
    </div>
  )
}

function GuestHero({ title, description, search }: HomeHeroProps) {
  const carouselRef = useRef<HTMLDivElement>(null)
  const [activeSlide, setActiveSlide] = useState(0)

  const handleScroll = useCallback(() => {
    const el = carouselRef.current
    if (!el) return
    const index = Math.round(el.scrollLeft / el.offsetWidth)
    setActiveSlide(Math.min(2, Math.max(0, index)))
  }, [])

  useEffect(() => {
    const el = carouselRef.current
    if (!el) return
    el.addEventListener("scroll", handleScroll, { passive: true })
    return () => el.removeEventListener("scroll", handleScroll)
  }, [handleScroll])

  const scrollToSlide = (i: number) => {
    const el = carouselRef.current
    if (!el) return
    el.scrollTo({ left: i * el.offsetWidth, behavior: "smooth" })
  }

  return (
    <div>
      {/* Mobile: full-bleed past the page gutter */}
      <div className="max-md:-mx-4 max-md:w-[calc(100%+32px)] max-md:overflow-hidden">
        <div
          ref={carouselRef}
          className="grid w-full grid-cols-[minmax(420px,8fr)_minmax(240px,2fr)_minmax(240px,2fr)] items-stretch gap-6 max-lg:grid-cols-2 max-md:flex max-md:snap-x max-md:snap-mandatory max-md:scrollbar-none max-md:gap-0 max-md:overflow-x-auto max-md:[&::-webkit-scrollbar]:hidden"
        >
          <MainCard
            title={title}
            description={description}
            search={search}
            guest
          />

          <SideCard
            guest
            heading={
              <>
                I am a <br />
                Photographer
              </>
            }
            text="Gallopics is a platform for competition photographers. Book events, upload galleries, manage orders and track your sales – all in one place."
            style={
              {
                "--pg-bg": `url(${assetUrl("images/card2.jpg")})`,
              } as React.CSSProperties
            }
            className="bg-[image:linear-gradient(rgba(0,0,0,0.4),rgba(0,0,0,0.3)),var(--pg-bg)] bg-cover bg-center hover:shadow-[0_12px_32px_rgba(0,0,0,0.08)]"
            action={
              <Button
                className="font-bold"
                onClick={() =>
                  window.dispatchEvent(
                    new CustomEvent("open-auth-modal", {
                      detail: { tab: "register", type: "photographer" },
                    })
                  )
                }
              >
                Register
              </Button>
            }
          />

          <SideCard
            guest
            heading={
              <>
                Organizing a <br />
                competition?
              </>
            }
            text="Helps you find the right photographers, coordinate coverage, and make it easy for riders to discover and purchase their photos."
            className="bg-primary"
            action={
              <Button
                className="bg-foreground font-bold hover:bg-black"
                onClick={() =>
                  window.dispatchEvent(new Event("open-contact-support"))
                }
              >
                Contact us
              </Button>
            }
          />
        </div>
      </div>

      {/* Pagination dots — mobile only */}
      <div className="mx-auto mt-3 hidden w-fit items-center gap-1.5 rounded-full bg-black/4 px-2.5 py-1 max-md:flex">
        {[0, 1, 2].map((i) => (
          <button
            key={i}
            type="button"
            aria-label={`Go to slide ${i + 1}`}
            onClick={() => scrollToSlide(i)}
            className={cn(
              "h-1.5 rounded-full bg-black/20 transition-all duration-300 ease-[cubic-bezier(0.2,0,0.2,1)]",
              activeSlide === i ? "w-5 rounded-[3px] bg-primary" : "w-1.5"
            )}
          />
        ))}
      </div>
    </div>
  )
}

function SignedInHero({ title, description, search }: HomeHeroProps) {
  const { user } = useAuth()
  const { user: clerkUser } = useUser()

  const isAdmin = user?.role === "admin"
  const publicApprovalStatus =
    typeof clerkUser?.publicMetadata?.approvalStatus === "string"
      ? clerkUser.publicMetadata.approvalStatus
      : undefined
  const unsafeApprovalStatus =
    typeof clerkUser?.unsafeMetadata?.approvalStatus === "string"
      ? clerkUser.unsafeMetadata.approvalStatus
      : undefined
  const effectiveApprovalStatus =
    user?.approvalStatus ?? publicApprovalStatus ?? unsafeApprovalStatus
  const isPendingPhotographer =
    !isAdmin && effectiveApprovalStatus !== "approved"
  const fullName = user?.displayName ?? "Photographer"

  const consoleDescription = isAdmin
    ? "Approve photographers, manage events, monitor platform activity, and keep everything running smoothly."
    : isPendingPhotographer
      ? "Your photographer account is waiting for approval. We will unlock studio access as soon as an admin approves it in Clerk."
      : "Manage your events, upload galleries, track your sales, and grow your photography business — all in one place."
  const consoleHref = isAdmin
    ? "/admin"
    : isPendingPhotographer
      ? "/pg/pending-approval"
      : user?.id
        ? `/photographer/${user.id}`
        : "/pg"
  const consoleLabel = isAdmin
    ? "My Console"
    : isPendingPhotographer
      ? "Approval pending"
      : "My Studio"

  return (
    <div className="grid grid-cols-[1fr_280px] items-stretch gap-6 max-lg:grid-cols-[1fr_240px] max-md:grid-cols-1">
      <MainCard title={title} description={description} search={search} />

      <div className={cn(cardBase, "bg-primary p-8 max-md:hidden")}>
        <div className="flex flex-col gap-4">
          <h2 className="font-heading text-2xl leading-[1.1] font-semibold tracking-[-0.02em] text-white">
            Hello,
            <br />
            {fullName} 👋
          </h2>
          <p className="text-sm leading-[1.6] text-white/80">
            {consoleDescription}
          </p>
        </div>
        <Button
          size="lg"
          className="mt-8 h-12 self-start bg-black px-6 text-sm font-bold hover:bg-foreground"
          nativeButton={false}
          render={<Link to={consoleHref} />}
        >
          {isAdmin ? (
            <LayoutDashboard className="size-4.5" />
          ) : (
            <Camera className="size-4.5" />
          )}
          {consoleLabel}
        </Button>
      </div>
    </div>
  )
}

export function HomeHero({ title, description, search }: HomeHeroProps) {
  const { isLoaded, isAuthenticated } = useAuth()

  return (
    <section className="pt-10 pb-6 max-md:pt-6">
      <div className="container">
        {!isLoaded ? null : isAuthenticated ? (
          <SignedInHero
            title={title}
            description={description}
            search={search}
          />
        ) : (
          <GuestHero title={title} description={description} search={search} />
        )}
      </div>
    </section>
  )
}
