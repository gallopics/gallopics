import React, { useState, useCallback } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import {
  LayoutGrid,
  // CreditCard,
  // Settings,
  // DollarSign,
  // FileText,
  ChevronLeft,
  ChevronRight,
  // Palette,
  Camera,
  Users,
} from 'lucide-react';
import { Header } from '../../components/Header';
import { ErrorBoundary } from '../../components/ErrorBoundary';
import { Footer } from '../../components/Footer';
import { useWorkspace } from '../../context/WorkspaceContext';
import { useAuth } from '../../context/AuthContext';

// Sidebar widths as constants so NavItem can use them without prop drilling
const W_COLLAPSED = 72;
const W_EXPANDED = 260;

interface NavItemProps {
  to: string;
  icon: React.ReactNode;
  label: string;
  collapsed: boolean;
  onNavigate: () => void;
}

// Defined OUTSIDE layout — stable identity, never remounts on state change
const SidebarNavItem: React.FC<NavItemProps> = ({
  to,
  icon,
  label,
  collapsed,
  onNavigate,
}) => (
  <NavLink
    to={to}
    title={collapsed ? label : ''}
    onClick={onNavigate}
    className={({ isActive }) =>
      `w-full flex items-center h-[42px] rounded-full no-underline font-medium overflow-hidden transition-colors duration-150 ${
        isActive
          ? 'bg-[rgba(27,58,236,0.08)] text-brand'
          : 'text-secondary hover:bg-[var(--ui-bg-subtle)] hover:text-primary'
      }`
    }
  >
    {/* Icon: fixed 42px — center always at nav_padding(15) + 21 = 36px. Never moves. */}
    <span className="flex-shrink-0 flex items-center justify-center w-[42px] h-[42px]">
      {icon}
    </span>
    {/* Label: opacity only — zero reflow, zero position change */}
    <span
      className="text-[0.875rem] whitespace-nowrap pr-2 transition-opacity duration-200"
      style={{ opacity: collapsed ? 0 : 1 }}
    >
      {label}
    </span>
  </NavLink>
);

export const PhotographerLayout: React.FC = () => {
  const { basePath, isAdmin } = useWorkspace();
  const [collapsed, setCollapsed] = useState(true);

  const { user } = useAuth();
  const sidebarTitle = isAdmin ? 'My Console' : 'My Studio';

  const handleNavClick = useCallback(() => setCollapsed(true), []);
  const toggle = useCallback(() => setCollapsed(v => !v), []);

  return (
    <div className="flex flex-col min-h-screen pg-layout-shell">
      <Header />

      <div className="flex flex-1">
        {/* Sidebar */}
        <aside
          className="flex-shrink-0 bg-[var(--color-surface)] border-r border-[var(--color-border)] flex flex-col overflow-hidden transition-[width] duration-[240ms] ease-[cubic-bezier(0.4,0,0.2,1)] sticky top-[70px] self-start h-[calc(100vh-70px)]"
          style={{ width: collapsed ? W_COLLAPSED : W_EXPANDED }}
        >
          {/* Toggle row */}
          <div
            className="flex items-center flex-shrink-0 mt-3 mb-5"
            style={{
              height: 36,
              justifyContent: collapsed ? 'center' : 'space-between',
              padding: collapsed ? 0 : '0 8px 0 16px',
            }}
          >
            <span
              className="text-[0.75rem] uppercase tracking-[1px] font-bold text-tertiary whitespace-nowrap overflow-hidden transition-opacity duration-200"
              style={{
                opacity: collapsed ? 0 : 1,
                width: collapsed ? 0 : 'auto',
              }}
            >
              {sidebarTitle}
            </span>

            <button
              onClick={toggle}
              title={collapsed ? 'Expand' : 'Collapse'}
              className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full text-[var(--ui-icon-muted)] transition-colors duration-150 hover:bg-[var(--ui-bg-subtle)] hover:text-primary border-none bg-transparent cursor-pointer"
            >
              {collapsed ? (
                <ChevronRight size={15} />
              ) : (
                <ChevronLeft size={15} />
              )}
            </button>
          </div>

          {/* Nav items */}
          <nav className="flex flex-col gap-0.5 flex-1 overflow-y-auto overflow-x-hidden px-[15px]">
            <SidebarNavItem
              to={`${basePath}/events`}
              icon={<LayoutGrid size={18} />}
              label="Events"
              collapsed={collapsed}
              onNavigate={handleNavClick}
            />

            {!isAdmin && user?.id && (
              <SidebarNavItem
                to={`/photographer/${user.id}`}
                icon={<Camera size={18} />}
                label="My Studio"
                collapsed={collapsed}
                onNavigate={handleNavClick}
              />
            )}

            {isAdmin && (
              <SidebarNavItem
                to={`${basePath}/photographers`}
                icon={<Users size={18} />}
                label="Photographers"
                collapsed={collapsed}
                onNavigate={handleNavClick}
              />
            )}

            {/* <SidebarNavItem
              to={`${basePath}/sold`}
              icon={<DollarSign size={18} />}
              label="Sales"
              collapsed={collapsed}
              onNavigate={handleNavClick}
            /> */}
            {/* <SidebarNavItem
              to={`${basePath}/receipts`}
              icon={<FileText size={18} />}
              label="Receipts"
              collapsed={collapsed}
              onNavigate={handleNavClick}
            /> */}

            {/* Divider */}
            <div className="h-px bg-[var(--color-border)] mx-3 my-3" />

            {/* <SidebarNavItem
              to={`${basePath}/billing`}
              icon={<CreditCard size={18} />}
              label="Billing details"
              collapsed={collapsed}
              onNavigate={handleNavClick}
            /> */}
            {/* <SidebarNavItem
              to={`${basePath}/settings`}
              icon={<Settings size={18} />}
              label="Settings"
              collapsed={collapsed}
              onNavigate={handleNavClick}
            /> */}
            {/* <SidebarNavItem to={`${basePath}/tokens`} icon={<Palette size={18} />} label="Tokens" collapsed={collapsed} onNavigate={handleNavClick} /> */}
          </nav>

          {/* Footer */}
          <div
            className="text-[0.75rem] overflow-hidden transition-[opacity,max-height] duration-200"
            style={{
              opacity: collapsed ? 0 : 1,
              maxHeight: collapsed ? 0 : 140,
              padding: collapsed ? 0 : '12px 20px 24px',
              pointerEvents: collapsed ? 'none' : 'auto',
            }}
          >
            <Footer minimal={true} sidebar={true} isAdmin={isAdmin} />
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 min-w-0">
          <ErrorBoundary>
            <Outlet />
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
};
