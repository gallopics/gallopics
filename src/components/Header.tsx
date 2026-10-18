import { useEffect, useState } from "react"
import { Link, useLocation, useNavigate } from "react-router"
import { useUser } from "@clerk/clerk-react"
import { Camera, LayoutDashboard, ShoppingBag, User } from "lucide-react"

import { assetUrl, cn } from "@/lib/utils"
import { useMediaQuery } from "@/hooks/useMediaQuery"
import { useScrolled } from "@/hooks/useScrolled"
import { useAuth } from "@/context/AuthContext"
import { useCart } from "@/context/CartContext"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Separator } from "@/components/ui/separator"
import { AuthModal } from "@/components/AuthModal"
import { ContactSupportModal } from "@/components/ContactSupportModal"
import { DesktopRecommendationModal } from "@/components/DesktopRecommendationModal"
import { EditProfileModal } from "@/components/EditProfileModal"
import {
  ModernSearchBar,
  type EventSearchProps,
} from "@/components/ModernSearchBar"

type AuthTab = "signin" | "register"
type AccountType = "photographer" | "buyer"

const AVATAR_COLORS = [
  "#3b82f6",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#ec4899",
]

/** Stable colour per name for avatars without a photo */
function getAvatarColor(name: string) {
  let hash = 0
  for (let i = 0; i < name.length; i++)
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}

const iconButtonClass =
  "relative shadow-[0_1px_2px_rgba(0,0,0,0.04)] hover:scale-105 hover:border-border hover:shadow-[0_2px_4px_rgba(0,0,0,0.05)] aria-expanded:border-border"

export function Header({
  searchEvents,
  eventSearchIndex,
  eventMatchLabels,
  onSearchChange,
}: EventSearchProps = {}) {
  const scrolled = useScrolled()
  const isMobile = useMediaQuery("(max-width: 767px)")

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const [authModalConfig, setAuthModalConfig] = useState<{
    tab: AuthTab
    type: AccountType
  }>({ tab: "signin", type: "photographer" })
  const [isEditProfileModalOpen, setIsEditProfileModalOpen] = useState(false)
  const [isRecommendationOpen, setIsRecommendationOpen] = useState(false)
  const [isContactModalOpen, setIsContactModalOpen] = useState(false)
  const [isContactPhotographerOnly, setIsContactPhotographerOnly] =
    useState(false)

  const { cart } = useCart()
  const { isLoaded, isAuthenticated, user, logout } = useAuth()
  const { user: clerkUser } = useUser()

  const navigate = useNavigate()
  const location = useLocation()

  const currentPath = encodeURIComponent(location.pathname + location.search)
  const isOnboarding = location.pathname.startsWith("/pg/onboarding")
  const isHomePage = location.pathname === "/"

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
  const isAdmin = user?.role === "admin"
  const isPendingPhotographer =
    !isAdmin && effectiveApprovalStatus !== "approved"
  const workspacePath = isAdmin
    ? "/admin"
    : isPendingPhotographer
      ? "/pg/pending-approval"
      : "/pg"
  const accountShortcutLabel = isAdmin
    ? "My Console"
    : isPendingPhotographer
      ? "Approval pending"
      : "My Studio"

  const openAuth = (tab: AuthTab, type: AccountType = "photographer") => {
    setAuthModalConfig({ tab, type })
    setIsAuthModalOpen(true)
  }

  // Pages open the header modals through window events
  useEffect(() => {
    const handleOpenAuth = (e: Event) => {
      const detail = (e as CustomEvent<{ tab: AuthTab; type: AccountType }>)
        .detail
      setIsContactModalOpen(false)
      openAuth(detail?.tab ?? "signin", detail?.type ?? "photographer")
    }
    const handleOpenMobileRecommendation = () => {
      setIsAuthModalOpen(false)
      setIsContactModalOpen(false)
      setIsRecommendationOpen(true)
    }
    const handleOpenContact = (e: Event) => {
      const detail = (e as CustomEvent<{ photographerOnly?: boolean }>).detail
      setIsAuthModalOpen(false)
      setIsEditProfileModalOpen(false)
      setIsContactPhotographerOnly(!!detail?.photographerOnly)
      setIsContactModalOpen(true)
    }

    window.addEventListener("open-auth-modal", handleOpenAuth)
    window.addEventListener(
      "open-mobile-recommendation",
      handleOpenMobileRecommendation
    )
    window.addEventListener("open-contact-support", handleOpenContact)
    return () => {
      window.removeEventListener("open-auth-modal", handleOpenAuth)
      window.removeEventListener(
        "open-mobile-recommendation",
        handleOpenMobileRecommendation
      )
      window.removeEventListener("open-contact-support", handleOpenContact)
    }
  }, [])

  const cartButton = (
    <Button
      variant="outline"
      size="icon"
      aria-label="Cart"
      title="Cart"
      className={iconButtonClass}
      onClick={() => navigate(`/cart?from=${currentPath}`)}
    >
      <ShoppingBag className="size-5.5" />
      {cart.length > 0 && (
        <Badge className="absolute top-1.5 right-1.5 h-4.5 min-w-4.5 border-2 border-white px-1 text-[0.625rem] font-bold">
          {cart.length}
        </Badge>
      )}
    </Button>
  )

  const displayName = user?.displayName || "Account"

  return (
    <>
      <header
        className={cn(
          "sticky top-0 z-40 border border-black/4 bg-card transition-[background-color,box-shadow] duration-400 ease-[cubic-bezier(0.2,0,0.2,1)]",
          scrolled &&
            "border-b-black/5 bg-card/85 shadow-[0_4px_12px_rgba(0,0,0,0.03)] backdrop-blur-md"
        )}
      >
        <div className="container flex min-h-16 max-w-none items-center justify-between gap-3 md:h-18 md:gap-6">
          <Link to="/" className="flex shrink-0 items-center">
            <img
              src={assetUrl("images/logo1-blue.svg")}
              alt="GALLOPICS"
              className="block h-6 w-auto min-[480px]:h-7"
            />
          </Link>

          {!isOnboarding && (
            <div className="relative ml-auto flex flex-wrap items-center justify-end gap-1.5 min-[480px]:gap-3">
              <ModernSearchBar
                collapsible
                eventOptions={searchEvents}
                eventSearchIndex={eventSearchIndex}
                eventMatchLabels={eventMatchLabels}
                eventOnly={Boolean(searchEvents)}
                onSearchChange={onSearchChange}
              />

              {!isLoaded ? null : isAuthenticated ? (
                <>
                  {cartButton}

                  {!isMobile && (
                    <>
                      <Separator
                        orientation="vertical"
                        className="mx-1 h-6 data-vertical:self-center"
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        aria-label="Workspace"
                        title={`Go to ${accountShortcutLabel}`}
                        className={iconButtonClass}
                        onClick={() => navigate(workspacePath)}
                      >
                        {isAdmin ? (
                          <LayoutDashboard className="size-5" />
                        ) : (
                          <Camera className="size-5" />
                        )}
                      </Button>
                    </>
                  )}

                  <DropdownMenu>
                    <DropdownMenuTrigger className="ml-2 flex items-center gap-3 rounded-full border bg-card py-1.5 pr-4 pl-1.5 shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-all hover:scale-[1.02] hover:bg-muted hover:shadow-[0_2px_4px_rgba(0,0,0,0.05)] max-md:border-0 max-md:p-1">
                      <Avatar className="size-9">
                        {user?.avatarUrl && (
                          <AvatarImage src={user.avatarUrl} alt="Avatar" />
                        )}
                        <AvatarFallback
                          className="text-sm font-semibold text-white uppercase"
                          style={{
                            backgroundColor: getAvatarColor(displayName),
                          }}
                        >
                          {(user?.displayName || "U").charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="flex flex-col text-left leading-[1.2] max-md:hidden">
                        <span className="text-sm leading-[1.2] font-semibold">
                          {displayName}
                        </span>
                        <span className="text-[9px] font-medium tracking-[0.5px] text-muted-foreground uppercase">
                          {isAdmin ? "Admin" : user?.city || "Photographer"}
                        </span>
                      </span>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-44 min-w-44">
                      {(!isAdmin || isHomePage) && (
                        <DropdownMenuItem
                          onClick={() =>
                            navigate(
                              isAdmin || isPendingPhotographer || !user?.id
                                ? workspacePath
                                : `/photographer/${user.id}`
                            )
                          }
                        >
                          {accountShortcutLabel}
                        </DropdownMenuItem>
                      )}
                      {!isAdmin && !isPendingPhotographer && (
                        <DropdownMenuItem
                          onClick={() => navigate("/pg/events")}
                        >
                          Events
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem
                        variant="destructive"
                        onClick={async () => {
                          await logout()
                          navigate("/")
                        }}
                      >
                        Log out
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              ) : (
                <>
                  {cartButton}

                  <Separator
                    orientation="vertical"
                    className="mx-1 h-6 max-md:hidden data-vertical:self-center"
                  />

                  {isMobile ? (
                    <Button
                      variant="outline"
                      size="icon"
                      aria-label="Sign in or Register"
                      className={iconButtonClass}
                      onClick={() => setIsRecommendationOpen(true)}
                    >
                      <User className="size-5.5" />
                    </Button>
                  ) : (
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        render={
                          <Button
                            variant="outline"
                            size="icon"
                            aria-label="Sign in or Register"
                            className={iconButtonClass}
                          />
                        }
                      >
                        <User className="size-5.5" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        align="end"
                        className="w-36 min-w-36"
                      >
                        <DropdownMenuItem onClick={() => openAuth("signin")}>
                          Sign in
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => openAuth("register")}>
                          Register
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </header>

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        initialTab={authModalConfig.tab}
        initialAccountType={authModalConfig.type}
        onSwitchTab={() =>
          setAuthModalConfig((prev) => ({
            ...prev,
            tab: prev.tab === "signin" ? "register" : "signin",
          }))
        }
      />

      <EditProfileModal
        isOpen={isEditProfileModalOpen}
        onClose={() => setIsEditProfileModalOpen(false)}
      />

      <DesktopRecommendationModal
        isOpen={isRecommendationOpen}
        onClose={() => setIsRecommendationOpen(false)}
      />

      <ContactSupportModal
        isOpen={isContactModalOpen}
        onClose={() => setIsContactModalOpen(false)}
        photographerOnly={isContactPhotographerOnly}
      />
    </>
  )
}
