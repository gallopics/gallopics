import { useState } from "react"
import { NavLink, Outlet, useLocation } from "react-router"
import {
  Camera,
  ChevronLeft,
  ChevronRight,
  DollarSign,
  LayoutGrid,
  Menu,
  Users,
  Wallet,
} from "lucide-react"

import { useAuth } from "@/context/AuthContext"
import { useWorkspace } from "@/context/WorkspaceContext"
import { Button } from "@/components/ui/button"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarSeparator,
  useSidebar,
} from "@/components/ui/sidebar"
import { CopyrightBar } from "@/components/CopyrightBar"
import { ErrorBoundary } from "@/components/ErrorBoundary"
import { Header } from "@/components/Header"
import { StripeConnectBanner } from "@/components/StripeConnectBanner"

// Old sidebar widths: 72px collapsed, 260px expanded
const sidebarSizes = {
  "--sidebar-width": "260px",
  "--sidebar-width-icon": "72px",
} as React.CSSProperties

function NavItem({
  to,
  icon,
  label,
}: {
  to: string
  icon: React.ReactNode
  label: string
}) {
  const { pathname } = useLocation()
  const { setOpen, setOpenMobile } = useSidebar()
  const isActive = pathname === to || pathname.startsWith(`${to}/`)

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        isActive={isActive}
        tooltip={label}
        render={<NavLink to={to} />}
        onClick={() => {
          // Old behaviour: collapse after choosing a page
          setOpen(false)
          setOpenMobile(false)
        }}
        // Old: colours fade in 150ms; the active item keeps its brand tint on hover
        className="h-10.5 gap-0 rounded-full p-0 font-medium text-muted-foreground transition-[width,height,padding,color,background-color] duration-150 group-data-[collapsible=icon]:size-10.5! group-data-[collapsible=icon]:p-0! hover:bg-muted hover:text-foreground data-active:bg-primary/8 data-active:text-primary data-active:hover:bg-primary/8 data-active:hover:text-primary [&_svg]:size-4.5"
      >
        <span className="flex size-10.5 shrink-0 items-center justify-center">
          {icon}
        </span>
        <span className="pr-2 text-sm whitespace-nowrap">{label}</span>
      </SidebarMenuButton>
    </SidebarMenuItem>
  )
}

function WorkspaceSidebar() {
  const { basePath, isAdmin } = useWorkspace()
  const { user } = useAuth()
  const { state, toggleSidebar } = useSidebar()
  const collapsed = state === "collapsed"

  return (
    <Sidebar
      collapsible="icon"
      className="md:top-[74px] md:h-[calc(100svh-74px)]"
    >
      <SidebarHeader className="mt-3 mb-5 h-9 flex-row items-center justify-between p-0 pr-2 pl-4 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0">
        <span className="overflow-hidden text-xs font-bold tracking-[1px] whitespace-nowrap text-muted-foreground/70 uppercase group-data-[collapsible=icon]:hidden">
          {isAdmin ? "My Console" : "My Studio"}
        </span>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={toggleSidebar}
          title={collapsed ? "Expand" : "Collapse"}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="text-muted-foreground/60 hover:text-foreground max-md:hidden [&_svg]:size-3.75"
        >
          {collapsed ? <ChevronRight /> : <ChevronLeft />}
        </Button>
      </SidebarHeader>

      <SidebarContent className="px-3.75">
        <SidebarMenu className="gap-0.5">
          <NavItem
            to={`${basePath}/events`}
            icon={<LayoutGrid />}
            label="Events"
          />
          {!isAdmin && user?.id && (
            <NavItem
              to={`/photographer/${user.id}`}
              icon={<Camera />}
              label="My Studio"
            />
          )}
          {!isAdmin && (
            <NavItem
              to={`${basePath}/sold`}
              icon={<DollarSign />}
              label="Sales"
            />
          )}
          {!isAdmin && (
            <NavItem
              to={`${basePath}/billing`}
              icon={<Wallet />}
              label="Payouts"
            />
          )}
          {isAdmin && (
            <NavItem
              to={`${basePath}/photographers`}
              icon={<Users />}
              label="Photographers"
            />
          )}
          {/* Receipts and Settings are hidden in the old app too (still mock) */}
        </SidebarMenu>
        <SidebarSeparator className="mx-3 my-3 data-horizontal:w-auto" />
      </SidebarContent>

      <SidebarFooter className="px-5 pt-3 pb-6 text-xs group-data-[collapsible=icon]:hidden">
        <CopyrightBar minimal sidebar isAdmin={isAdmin} />
      </SidebarFooter>
    </Sidebar>
  )
}

/** Opens the sidebar drawer on mobile (the old sidebar had no mobile mode) */
function MobileMenuButton() {
  const { toggleSidebar } = useSidebar()

  return (
    <div className="border-b bg-card px-4 py-2 md:hidden">
      <Button variant="ghost" size="sm" onClick={toggleSidebar}>
        <Menu />
        Menu
      </Button>
    </div>
  )
}

export function PhotographerLayout() {
  // Starts collapsed, like the old sidebar
  const [open, setOpen] = useState(false)

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <SidebarProvider
        open={open}
        onOpenChange={setOpen}
        style={sidebarSizes}
        className="min-h-0 flex-1"
      >
        <WorkspaceSidebar />
        <main className="min-w-0 flex-1">
          <MobileMenuButton />
          <StripeConnectBanner />
          <ErrorBoundary>
            <Outlet />
          </ErrorBoundary>
        </main>
      </SidebarProvider>
    </div>
  )
}
