import React, { useState } from 'react';
import { TitleHeader } from '../../components/TitleHeader';
import { Button } from '../../components/Button';
import { InfoChip } from '../../components/InfoChip';
import { FilterChip } from '../../components/FilterChip';
import { ModernDropdown } from '../../components/ModernDropdown';
import { ModernSearchBar } from '../../components/ModernSearchBar';
import { PhotoCard } from '../../components/PhotoCard';
import { FolderEventCard } from '../../components/FolderEventCard';
import { CopyrightBar } from '../../components/CopyrightBar';
import {
  Search,
  Palette,
  Type,
  Box,
  LayoutTemplate,
  FileInput,
  CreditCard,
  ChevronRight,
  ChevronLeft,
  Upload,
  LayoutGrid,
  ShoppingBag,
  Settings,
  X,
} from 'lucide-react';
import { Toggle } from '../../components/Toggle';
import { PageTabs } from '../../components/PageTabs';
import { StatusPill } from '../../components/StatusPill';
import { ProfileAvatar } from '../../components/ProfileAvatar';

// Mock Data for showcase
const MOCK_PHOTO = {
  id: 'p1',
  src: 'https://images.unsplash.com/photo-1534068590799-09895a701e3e?auto=format&fit=crop&w=800&q=80',
  rider: 'Alva Karlsson',
  horse: 'Göta Glimt',
  event: 'Summer Cup 2025',
  eventId: 'e1',
  date: '2025-07-15',
  width: 800,
  height: 600,
  className: '',
  time: '14:30',
  city: 'Stockholm',
  arena: 'Main Arena',
  countryCode: 'se',
  discipline: 'Show Jumping',
  photographer: 'Hanna Björk',
  photographerId: 'ph1',
};

const MOCK_EVENT = {
  id: 'e1',
  name: 'Summer Cup 2025',
  period: 'Jul 15 - Jul 18',
  coverImage:
    'https://images.unsplash.com/photo-1534068590799-09895a701e3e?auto=format&fit=crop&w=800&q=80',
  logo: 'https://ui-avatars.com/api/?name=SC&background=random',
  city: 'Stockholm',
  flag: '🇸🇪',
  status: 'active' as const,
  photoCount: 1240,
  discipline: 'Show Jumping',
  country: 'Sweden',
  photographer: {
    id: 'ph1',
    name: 'Hanna Björk',
    avatar: 'https://ui-avatars.com/api/?name=Hanna+Bjork&background=random',
  },
};

export const TokensPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<
    | 'colors'
    | 'typography'
    | 'components'
    | 'forms'
    | 'layout'
    | 'cards'
    | 'utilities'
  >('colors');
  const [mockSidebarCollapsed, setMockSidebarCollapsed] = useState(false);
  const [mockAuthTab, setMockAuthTab] = useState<'login' | 'register'>('login');

  return (
    <div className="tokens-page">
      <TitleHeader
        title="Design Tokens"
        subtitle="The foundational elements of the Gallopics design system"
        variant="workspace"
      />

      {/* Context Bar Example (Simulating Image 1) */}
      <div className="bg-white border-b border-[var(--color-border)] px-[5%] h-16 flex items-center gap-3 mb-10">
        <span className="text-[1.25rem] font-extrabold text-primary">
          Settings
        </span>
        <div className="bg-[var(--color-brand-primary)] text-white px-3 py-1 rounded-full text-[0.8125rem] font-semibold">
          Tokens
        </div>
      </div>

      <div className="container">
        <div className="tokens-tabs-scroll">
          <div className="tokens-tabs">
            <button
              className={`tokens-tab-btn ${activeTab === 'colors' ? 'active' : ''}`}
              onClick={() => setActiveTab('colors')}
            >
              <Palette size={18} /> Colors
            </button>
            <button
              className={`tokens-tab-btn ${activeTab === 'typography' ? 'active' : ''}`}
              onClick={() => setActiveTab('typography')}
            >
              <Type size={18} /> Typography
            </button>
            <button
              className={`tokens-tab-btn ${activeTab === 'components' ? 'active' : ''}`}
              onClick={() => setActiveTab('components')}
            >
              <Box size={18} /> Components
            </button>
            <button
              className={`tokens-tab-btn ${activeTab === 'forms' ? 'active' : ''}`}
              onClick={() => setActiveTab('forms')}
            >
              <FileInput size={18} /> Forms
            </button>
            <button
              className={`tokens-tab-btn ${activeTab === 'layout' ? 'active' : ''}`}
              onClick={() => setActiveTab('layout')}
            >
              <LayoutTemplate size={18} /> Layout
            </button>
            <button
              className={`tokens-tab-btn ${activeTab === 'cards' ? 'active' : ''}`}
              onClick={() => setActiveTab('cards')}
            >
              <CreditCard size={18} /> Cards
            </button>
            <button
              className={`tokens-tab-btn ${activeTab === 'utilities' ? 'active' : ''}`}
              onClick={() => setActiveTab('utilities')}
            >
              <Settings size={18} /> Utilities
            </button>
          </div>
        </div>

        <div className="tokens-content">
          {activeTab === 'colors' && (
            <div className="tokens-section">
              <h3>Base Colors</h3>
              <div className="color-grid">
                <ColorSwatch
                  name="Background"
                  variable="--color-bg"
                  value="#F9FAFB"
                />
                <ColorSwatch
                  name="Surface"
                  variable="--color-surface"
                  value="#FFFFFF"
                />
                <ColorSwatch
                  name="Text Primary"
                  variable="--color-text-primary"
                  value="#111111"
                />
                <ColorSwatch
                  name="Text Secondary"
                  variable="--color-text-secondary"
                  value="#666666"
                />
                <ColorSwatch
                  name="Border"
                  variable="--color-border"
                  value="#E5E5E5"
                />
                <ColorSwatch
                  name="Accent"
                  variable="--color-accent"
                  value="#000000"
                />
              </div>

              <h3>Brand Colors</h3>
              <div className="color-grid">
                <ColorSwatch
                  name="Brand Primary"
                  variable="--color-brand-primary"
                  value="#1B3AEC"
                />
                <ColorSwatch
                  name="Brand Hover"
                  variable="--color-brand-primary-hover"
                  value="#152DBB"
                />
                <ColorSwatch
                  name="Brand Tint"
                  variable="--color-brand-tint"
                  value="rgba(27, 58, 236, 0.08)"
                />
                <ColorSwatch
                  name="Brand Tint Strong"
                  variable="--color-brand-tint-strong"
                  value="rgba(27, 58, 236, 0.12)"
                />
              </div>

              <h3>Shadows & Elevations</h3>
              <div className="elevation-grid">
                <div className="elevation-card">
                  <div className="elevation-box elevation-box--sm">SM</div>
                  <div className="elevation-meta">
                    Shadow Small
                    <code>--shadow-sm</code>
                  </div>
                </div>
                <div className="elevation-card">
                  <div className="elevation-box elevation-box--hover">
                    Hover
                  </div>
                  <div className="elevation-meta">
                    Shadow Hover
                    <code>--shadow-hover</code>
                  </div>
                </div>
                <div className="elevation-card">
                  <div className="elevation-box elevation-box--overlay">
                    Overlay
                  </div>
                  <div className="elevation-meta">
                    Shadow Overlay
                    <code>--shadow-overlay</code>
                  </div>
                </div>
                <div className="elevation-card">
                  <div className="elevation-box elevation-box--float">
                    Float
                  </div>
                  <div className="elevation-meta">
                    Medium Floating
                    <code>--shadow-float</code>
                  </div>
                </div>
                <div className="elevation-card">
                  <div className="elevation-box elevation-box--brand bg-[var(--color-brand-primary)] text-white">
                    Brand
                  </div>
                  <div className="elevation-meta">
                    Brand Lift
                    <code>0 6px 16px (Blue)</code>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'typography' && (
            <div className="tokens-section">
              <h3>Font Hierarchy</h3>
              <div className="typo-list">
                <TypoItem
                  label="Display"
                  size="3rem"
                  weight="800"
                  variable="--fs-display"
                />
                <TypoItem
                  label="H1 (3XL)"
                  size="2rem"
                  weight="800"
                  variable="--fs-3xl"
                />
                <TypoItem
                  label="H2 (2XL)"
                  size="1.5rem"
                  weight="700"
                  variable="--fs-2xl"
                />
                <TypoItem
                  label="Large"
                  size="1.125rem"
                  weight="400"
                  variable="--fs-lg"
                />
                <TypoItem
                  label="Base"
                  size="1rem"
                  weight="400"
                  variable="--fs-base"
                />
                <TypoItem
                  label="Small"
                  size="0.875rem"
                  weight="400"
                  variable="--fs-sm"
                />
                <TypoItem
                  label="Extra Small"
                  size="0.75rem"
                  weight="500"
                  variable="--fs-xs"
                />
              </div>
            </div>
          )}

          {activeTab === 'components' && (
            <div className="tokens-section">
              <h3>Button Sizes & Variants</h3>
              <div className="comp-showcase">
                <div className="comp-row">
                  <TokenShowcase label='size="small"'>
                    <Button size="small" variant="primary">
                      Small
                    </Button>
                  </TokenShowcase>
                  <TokenShowcase label='size="medium"'>
                    <Button size="medium" variant="primary">
                      Medium
                    </Button>
                  </TokenShowcase>
                  <TokenShowcase label='size="large"'>
                    <Button size="large" variant="primary">
                      Large
                    </Button>
                  </TokenShowcase>
                  <TokenShowcase label=".btn-hero-primary (TitleHeader.css)">
                    <button className="btn-hero-primary">Hero Action</button>
                  </TokenShowcase>
                </div>
                <div className="comp-row">
                  <TokenShowcase label='variant="secondary" size="small"'>
                    <Button size="small" variant="secondary">
                      Small
                    </Button>
                  </TokenShowcase>
                  <TokenShowcase label='variant="secondary" size="medium"'>
                    <Button size="medium" variant="secondary">
                      Medium
                    </Button>
                  </TokenShowcase>
                  <TokenShowcase label='variant="secondary" size="large"'>
                    <Button size="large" variant="secondary">
                      Large
                    </Button>
                  </TokenShowcase>
                </div>
                <div className="comp-row">
                  <TokenShowcase label='variant="ghost"'>
                    <Button variant="ghost">Cancel</Button>
                  </TokenShowcase>
                  <TokenShowcase label="disabled">
                    <Button variant="primary" disabled>
                      Disabled
                    </Button>
                  </TokenShowcase>
                </div>
              </div>

              <h3>Button States (Simulation)</h3>
              <div className="comp-showcase">
                <div className="comp-row">
                  <TokenShowcase label="Normal">
                    <Button variant="primary">Submit</Button>
                  </TokenShowcase>
                  <TokenShowcase label="Hover (Interaction)">
                    <Button variant="primary">Hover Me</Button>
                  </TokenShowcase>
                  <TokenShowcase label="Disabled">
                    <Button variant="primary" disabled>
                      Submit
                    </Button>
                  </TokenShowcase>
                  <TokenShowcase label="Loading (Pending)">
                    <Button variant="primary" disabled>
                      Processing...
                    </Button>
                  </TokenShowcase>
                </div>
              </div>

              <h3>Component Sizes (Scale)</h3>
              <div className="comp-showcase">
                <div className="comp-row items-start">
                  <div className="comp-col w-auto">
                    <h4>Icon Actions</h4>
                    <div className="flex gap-4 items-center">
                      <TokenShowcase label='shape="circle" size="medium"'>
                        <Button
                          shape="circle"
                          size="medium"
                          variant="ghost"
                          icon={<Search size={20} />}
                        />
                      </TokenShowcase>
                      <TokenShowcase label='shape="circle" size="floating"'>
                        <div className="flex gap-3">
                          <Button
                            shape="circle"
                            size="floating"
                            variant="white"
                            icon={<Upload size={20} />}
                            title="White Variant"
                          />
                          <Button
                            shape="circle"
                            size="floating"
                            variant="primary"
                            icon={<Upload size={20} />}
                            title="Primary Blue Variant"
                          />
                        </div>
                      </TokenShowcase>
                      <TokenShowcase label='shape="circle" size="large"'>
                        <Button
                          shape="circle"
                          size="large"
                          variant="primary"
                          icon={<Upload size={24} />}
                        />
                      </TokenShowcase>
                    </div>
                  </div>

                  <div className="comp-col w-auto">
                    <h4>Avatars</h4>
                    <div className="flex gap-4 items-center">
                      <TokenShowcase label="size={36}">
                        <ProfileAvatar
                          size={36}
                          url="https://ui-avatars.com/api/?name=U&background=random"
                        />
                      </TokenShowcase>
                      <TokenShowcase label='size={48} variant="photographer"'>
                        <ProfileAvatar
                          size={48}
                          variant="photographer"
                          url="https://ui-avatars.com/api/?name=P&background=random"
                        />
                      </TokenShowcase>
                      <TokenShowcase label="size={80}">
                        <ProfileAvatar
                          size={80}
                          url="https://ui-avatars.com/api/?name=XL&background=random"
                        />
                      </TokenShowcase>
                    </div>
                  </div>
                </div>
              </div>

              <h3>Input & Search Scale</h3>
              <div className="comp-showcase">
                <div className="comp-row">
                  <TokenShowcase label="<ModernSearchBar /> (Standard)">
                    <div className="showcase-viewport">
                      <ModernSearchBar theme="light" />
                    </div>
                  </TokenShowcase>
                  <TokenShowcase label="Hero Context (.gallery-hero-context)">
                    <div className="gallery-hero-context showcase-viewport">
                      <ModernSearchBar theme="light" />
                    </div>
                  </TokenShowcase>
                </div>
              </div>

              <h3>Header Elements</h3>
              <div className="comp-showcase">
                <div className="comp-row">
                  <TokenShowcase label="User Profile Pill (Header Context)">
                    <button className="user-chip">
                      <div className="user-avatar-circle bg-[var(--color-text-primary)]">
                        <img
                          src="https://ui-avatars.com/api/?name=Klara+Fors&background=333&color=fff"
                          alt=""
                          className="w-full h-full rounded-full object-cover"
                        />
                      </div>
                      <div className="user-details">
                        <span className="user-name">Klara Fors</span>
                        <span className="user-meta">STOCKHOLM</span>
                      </div>
                    </button>
                  </TokenShowcase>

                  <TokenShowcase label="Header Actions Group">
                    <div className="flex gap-2 items-center">
                      {/* Simulated Header Context using real classes found in HeaderActions.css */}
                      <button className="share-icon-btn">
                        <Search size={20} />
                      </button>
                      <button className="share-icon-btn">
                        <ShoppingBag size={20} />
                      </button>
                      <button className="share-icon-btn">
                        <LayoutGrid size={20} />
                      </button>
                      <div className="w-px h-6 bg-[var(--color-border)] mx-1"></div>
                      <Button size="medium" variant="primary">
                        Submit Photo
                      </Button>
                    </div>
                  </TokenShowcase>
                </div>
              </div>

              <h3>Chips & Avatars</h3>
              <div className="comp-showcase">
                <div className="comp-row">
                  <TokenShowcase label='<InfoChip variant="rider" />'>
                    <InfoChip
                      label="RIDER"
                      name="Alva Karlsson"
                      variant="rider"
                      onClick={() => {}}
                    />
                  </TokenShowcase>
                  <TokenShowcase label='<InfoChip variant="horse" />'>
                    <InfoChip
                      label="HORSE"
                      name="Göta Glimt"
                      variant="horse"
                      onClick={() => {}}
                    />
                  </TokenShowcase>
                </div>
                <div className="comp-row">
                  <TokenShowcase label="<FilterChip isActive />">
                    <FilterChip label="All" isActive onClick={() => {}} />
                  </TokenShowcase>
                  <TokenShowcase label="<FilterChip badge={5} />">
                    <FilterChip
                      label="Needs Review"
                      badge={5}
                      onClick={() => {}}
                    />
                  </TokenShowcase>
                </div>
              </div>

              <h3>Dropdowns</h3>
              <div className="comp-showcase">
                <div className="comp-row items-start">
                  <div className="w-[200px]">
                    <TokenShowcase label="<ModernDropdown />">
                      <ModernDropdown
                        value="all"
                        options={[
                          { label: 'All Countries', value: 'all' },
                          { label: 'Sweden', value: 'se' },
                        ]}
                        onChange={() => {}}
                        label="Country"
                        placeholder="Default"
                      />
                    </TokenShowcase>
                  </div>
                  <div className="w-[180px]">
                    <TokenShowcase label='<ModernDropdown variant="pill" />'>
                      <ModernDropdown
                        value="all"
                        variant="pill"
                        options={[
                          { label: 'All Classes', value: 'all' },
                          { label: '1.10m', value: '110' },
                        ]}
                        onChange={() => {}}
                        label="Class"
                      />
                    </TokenShowcase>
                  </div>
                </div>
              </div>

              <h3>Navigation & Controls (Tokenised)</h3>
              <div className="comp-showcase">
                <div className="comp-row">
                  <TokenShowcase label="<PageTabs />">
                    <div className="w-full min-w-[320px]">
                      <PageTabs
                        tabs={[
                          { id: 'highlights', label: 'Highlights' },
                          { id: 'photos', label: 'Photos' },
                          { id: 'albums', label: 'Albums' },
                        ]}
                        activeTab="highlights"
                        onChange={() => {}}
                      />
                    </div>
                  </TokenShowcase>
                </div>
                <div className="comp-row">
                  <TokenShowcase label="<Toggle />">
                    <Toggle label="Show hidden" onChange={() => {}} />
                  </TokenShowcase>

                  <TokenShowcase label='<StatusPill status="neutral" />'>
                    <StatusPill label="Not available atm" status="neutral" />
                  </TokenShowcase>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'forms' && (
            <div className="tokens-section">
              <h3>Input Fields</h3>
              <div className="comp-showcase">
                <div className="comp-col max-w-[400px]">
                  <TokenShowcase label='class="token-input" (Standard)'>
                    <div className="token-form-group">
                      <label className="token-label">Email Address</label>
                      <input
                        type="email"
                        className="token-input"
                        placeholder="name@example.com"
                      />
                    </div>
                  </TokenShowcase>
                  <TokenShowcase label='class="token-input error"'>
                    <div className="token-form-group">
                      <label className="token-label">Error State</label>
                      <input
                        type="text"
                        className="token-input error"
                        defaultValue="Invalid input"
                      />
                      <span className="token-error-msg">
                        This field is required
                      </span>
                    </div>
                  </TokenShowcase>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'layout' && (
            <div className="tokens-section">
              <h3>Sidebar Navigation</h3>
              <div className="comp-showcase bg-[var(--ui-bg-subtle)] p-0">
                <TokenShowcase label="PhotographerLayout Sidebar">
                  <div className="mock-sidebar-container">
                    <aside
                      className={`mock-sidebar ${mockSidebarCollapsed ? 'collapsed' : ''}`}
                    >
                      <div className="mock-sidebar-header">
                        {!mockSidebarCollapsed && (
                          <span className="mock-sidebar-label">Workspace</span>
                        )}
                        <button
                          className="mock-collapse-btn"
                          onClick={() =>
                            setMockSidebarCollapsed(!mockSidebarCollapsed)
                          }
                        >
                          {mockSidebarCollapsed ? (
                            <ChevronRight size={14} />
                          ) : (
                            <ChevronLeft size={14} />
                          )}
                        </button>
                      </div>
                      <nav className="mock-nav">
                        <div className="mock-cta">
                          <Upload size={18} />
                          {!mockSidebarCollapsed && <span>Upload</span>}
                        </div>
                        <div className="mock-nav-item active">
                          <LayoutGrid size={18} />
                          {!mockSidebarCollapsed && <span>Events</span>}
                        </div>
                        <div className="mock-nav-separator"></div>
                        <div className="mock-nav-item text-brand bg-[var(--color-brand-tint)]">
                          <Palette size={18} />
                          {!mockSidebarCollapsed && <span>Tokens</span>}
                        </div>
                      </nav>
                    </aside>
                    <div className="mock-content">
                      <div className="mock-placeholder">Main Content Area</div>
                    </div>
                  </div>
                </TokenShowcase>
              </div>

              <h3>Modal Structure</h3>
              <div className="comp-showcase bg-[var(--color-text-primary)] p-10 flex justify-center">
                <TokenShowcase label="<AuthModal /> Structure" darkBg>
                  <div className="mock-modal">
                    <button className="mock-modal-close">
                      <X size={20} />
                    </button>
                    <div className="mock-modal-header">
                      <div className="mock-tabs">
                        <button
                          className={`mock-tab ${mockAuthTab === 'login' ? 'active' : ''}`}
                          onClick={() => setMockAuthTab('login')}
                        >
                          Sign in
                        </button>
                        <button
                          className={`mock-tab ${mockAuthTab === 'register' ? 'active' : ''}`}
                          onClick={() => setMockAuthTab('register')}
                        >
                          Register
                        </button>
                      </div>
                    </div>
                    <div className="mock-modal-content">
                      <div className="token-form-group">
                        <label className="token-label">Email</label>
                        <input type="text" className="token-input" />
                      </div>
                      <Button variant="primary" className="mt-4 w-full">
                        Sign In
                      </Button>
                    </div>
                  </div>
                </TokenShowcase>
              </div>

              <h3>Footer Elements</h3>
              <div className="comp-showcase bg-[var(--color-text-primary)] p-0">
                <TokenShowcase label="<CopyrightBar />" darkBg>
                  <CopyrightBar />
                </TokenShowcase>
              </div>
            </div>
          )}

          {activeTab === 'cards' && (
            <div className="tokens-section">
              <h3>Cards</h3>
              <div className="comp-showcase">
                <div className="card-grid-showcase">
                  <TokenShowcase label="<PhotoCard />">
                    <PhotoCard photo={MOCK_PHOTO} onClick={() => {}} />
                  </TokenShowcase>
                  <TokenShowcase label="<FolderEventCard />">
                    <FolderEventCard event={MOCK_EVENT} onClick={() => {}} />
                  </TokenShowcase>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'utilities' && (
            <div className="tokens-section">
              <h3>Navigation & Helpers</h3>
              <div className="comp-showcase">
                <div className="comp-row">
                  <TokenShowcase label="Breadcrumbs Pattern">
                    <div className="flex gap-2 items-center text-secondary text-[0.875rem]">
                      <span>Home</span>
                      <ChevronRight size={14} />
                      <span>Gallery</span>
                      <ChevronRight size={14} />
                      <span className="text-primary font-medium">
                        Summer Cup
                      </span>
                    </div>
                  </TokenShowcase>
                </div>
                <div className="comp-row">
                  <TokenShowcase label="Empty State Message">
                    <div className="text-center p-6">
                      <div className="text-[1.2rem] font-semibold mb-2">
                        No photos found
                      </div>
                      <div className="text-secondary text-[0.875rem]">
                        Try adjusting your filters
                      </div>
                    </div>
                  </TokenShowcase>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const TokenShowcase: React.FC<{
  label: string;
  children: React.ReactNode;
  darkBg?: boolean;
}> = ({ label, children, darkBg }) => (
  <div className="token-showcase-item">
    <div className="token-showcase-render">{children}</div>
    <div className={`token-showcase-label ${darkBg ? 'dark-bg-label' : ''}`}>
      {label}
    </div>
  </div>
);

const ColorSwatch: React.FC<{
  name: string;
  variable: string;
  value: string;
}> = ({ name, variable, value }) => (
  <div className="color-swatch">
    <div
      className="swatch-box"
      style={{
        backgroundColor: value,
        border: value === '#FFFFFF' ? '1px solid var(--color-border)' : 'none',
      }}
    ></div>
    <div className="swatch-info">
      <span className="swatch-name">{name}</span>
      <code className="swatch-variable">{variable}</code>
      <span className="swatch-value">{value}</span>
    </div>
  </div>
);

const TypoItem: React.FC<{
  label: string;
  size: string;
  weight: string;
  variable: string;
}> = ({ label, size, weight, variable }) => (
  <div className="typo-item">
    <div className="typo-sample" style={{ fontSize: size, fontWeight: weight }}>
      {label} sample
    </div>
    <div className="typo-meta">
      <code>{size}</code> • <code>{weight}</code> • <code>{variable}</code>
    </div>
  </div>
);
