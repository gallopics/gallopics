import React, { useState, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  X,
  Calendar,
  ChevronRight,
  Camera,
  Image,
  ArrowRight,
} from 'lucide-react';
import {
  RIDERS,
  HORSES,
  COMPETITIONS,
  RIDER_PRIMARY_HORSE,
  HORSE_PRIMARY_RIDER,
  PHOTOGRAPHERS,
  photos,
} from '../data/mockData';
import { useMobileSearchMode } from '../hooks/useMobileSearchMode';

import { HorseIcon } from './icons/HorseIcon';
import { RiderIcon } from './icons/RiderIcon';

interface SearchResult {
  id: string;
  type: 'event' | 'rider' | 'horse' | 'photographer' | 'photo';
  title: string;
  subtitle: string;
  meta?: string;
  photoSrc?: string; // For thumbnail
}

type GroupedResults = {
  [key in SearchResult['type']]?: SearchResult[];
};

interface ModernSearchBarProps {
  collapsible?: boolean;
  theme?: 'dark' | 'light';
  isMobileTrigger?: boolean;
  mobilePlaceholder?: string;
  desktopPlaceholder?: string;
  heroMode?: boolean;
}

export const ModernSearchBar: React.FC<ModernSearchBarProps> = ({
  collapsible = false,
  theme = 'dark',
  isMobileTrigger = false,
  mobilePlaceholder,
  desktopPlaceholder,
  heroMode = false,
}) => {
  const defaultDesktopPlaceholder =
    'Search riders, horses, events, photographers, photo ID...';
  const defaultMobilePlaceholder = 'Search...';

  // Determine current placeholder based on width/prop
  const isMobileBreakpoint =
    typeof window !== 'undefined' ? window.innerWidth <= 768 : false;
  const currentPlaceholder = isMobileBreakpoint
    ? mobilePlaceholder || defaultMobilePlaceholder
    : desktopPlaceholder || defaultDesktopPlaceholder;
  const [query, setQuery] = useState('');
  const [groups, setGroups] = useState<GroupedResults>({});
  const [hasResults, setHasResults] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(!collapsible);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const isFirstRender = useRef(true);
  const navigate = useNavigate();

  // Mobile Search Mode Hook
  const { activateSearch, deactivateSearch } = useMobileSearchMode(
    wrapperRef as React.RefObject<HTMLElement>,
  );

  const handleResultClick = (item: SearchResult) => {
    deactivateSearch();
    setIsOpen(false);
    setQuery('');
    // Force full close if collapsible to ensure clean state
    if (collapsible) setIsExpanded(false);

    switch (item.type) {
      case 'event':
        navigate(`/event/${item.id}`);
        break;
      case 'rider':
        navigate(`/rider/${item.id}`);
        break;
      case 'horse':
        navigate(`/horse/${item.id}`);
        break;
      case 'photographer':
        navigate(`/photographer/${item.id}`);
        break;
      case 'photo':
        navigate(`/photo/${item.id}`);
        break;
    }
  };

  // Helpers
  const formatDate = (d: string, end?: string) => {
    const start = new Date(d);
    const startStr = start.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
    });
    if (!end) return startStr;
    const endDate = new Date(end);
    const endStr = endDate.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
    return `${startStr} – ${endStr}`;
  };

  /**
   * Compute Top Association based on explicit mappings (Source of Truth)
   */
  const getAssociation = (id: string, type: 'rider' | 'horse'): string => {
    if (type === 'rider') {
      // Find primary horse
      const match = RIDER_PRIMARY_HORSE.find(m => m.riderId === id);
      if (match) {
        const horse = HORSES.find(h => h.id === match.primaryHorseId);
        return horse ? horse.registeredName || horse.name : '—'; // Use registered name if available
      }
    } else {
      // Find primary rider
      const match = HORSE_PRIMARY_RIDER.find(m => m.horseId === id);
      if (match) {
        const rider = RIDERS.find(r => r.id === match.primaryRiderId);
        return rider ? `${rider.firstName} ${rider.lastName}` : '—';
      }
    }
    return '—';
  };

  const handleSearch = (val: string) => {
    setQuery(val);
    if (val.length < 2) {
      setGroups({});
      setHasResults(false);
      setIsOpen(false);
      return;
    }

    const lower = val.toLowerCase();
    const MAX_PER_GROUP = 3;
    const newGroups: GroupedResults = {};
    let count = 0;

    // 1. Events
    const events = COMPETITIONS.filter(
      c =>
        c.name.toLowerCase().includes(lower) ||
        c.city.toLowerCase().includes(lower),
    )
      .slice(0, MAX_PER_GROUP)
      .map(c => ({
        id: c.id,
        type: 'event' as const,
        title: c.name,
        subtitle: `${c.city} • ${formatDate(c.date, c.endDate)} • ${c.discipline}`,
        meta: c.country,
      }));
    if (events.length) newGroups['event'] = events;
    count += events.length;

    // 2. Riders
    const riders = RIDERS.filter(r =>
      `${r.firstName} ${r.lastName}`.toLowerCase().includes(lower),
    )
      .slice(0, MAX_PER_GROUP)
      .map(r => {
        const fullName = `${r.firstName} ${r.lastName}`;
        return {
          id: r.id,
          type: 'rider' as const,
          title: fullName,
          subtitle: getAssociation(r.id, 'rider'),
        };
      });
    if (riders.length) newGroups['rider'] = riders;
    count += riders.length;

    // 3. Horses
    const horses = HORSES.filter(
      h =>
        h.name.toLowerCase().includes(lower) ||
        h.registeredName.toLowerCase().includes(lower),
    )
      .slice(0, MAX_PER_GROUP)
      .map(h => ({
        id: h.id,
        type: 'horse' as const,
        title: h.name,
        subtitle: getAssociation(h.id, 'horse'),
      }));
    if (horses.length) newGroups['horse'] = horses;
    count += horses.length;

    // 4. Photographers
    const photographers = PHOTOGRAPHERS.filter(p =>
      `${p.firstName} ${p.lastName}`.toLowerCase().includes(lower),
    )
      .slice(0, MAX_PER_GROUP)
      .map(p => ({
        id: p.id,
        type: 'photographer' as const,
        title: `${p.firstName} ${p.lastName}`,
        subtitle: p.city || 'Photographer',
      }));
    if (photographers.length) newGroups['photographer'] = photographers;
    count += photographers.length;

    // 5. Photos (Search by ID)
    // Clean query for ID search: remove # if present
    const cleanQuery = lower.replace(/^#/, '');
    const matchingPhotos = photos
      .filter(p => p.id.toLowerCase().includes(cleanQuery))
      .slice(0, MAX_PER_GROUP)
      .map(p => ({
        id: p.id,
        type: 'photo' as const,
        title: `#${p.id.toUpperCase()}`,
        subtitle: `${p.event} • ${p.rider}`,
      }));

    if (matchingPhotos.length) newGroups['photo'] = matchingPhotos;
    count += matchingPhotos.length;

    setGroups(newGroups);
    setHasResults(count > 0);
    setIsOpen(true);
  };

  // Close outside or Collapse
  useEffect(() => {
    const outsideClick = (e: MouseEvent) => {
      const isInsideWrapper =
        wrapperRef.current && wrapperRef.current.contains(e.target as Node);
      const isInsideDropdown =
        dropdownRef.current && dropdownRef.current.contains(e.target as Node);

      if (!isInsideWrapper && !isInsideDropdown) {
        setIsOpen(false);
        deactivateSearch();
        if (collapsible) {
          setIsExpanded(false);
        }
      }
    };
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
        deactivateSearch();
        if (collapsible) setIsExpanded(false);
      }
    };

    document.addEventListener('mousedown', outsideClick);
    document.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('mousedown', outsideClick);
      document.removeEventListener('keydown', handleEsc);
    };
  }, [collapsible, deactivateSearch]);

  // Listener for external trigger (Header search specific)
  useEffect(() => {
    if (!collapsible) return; // Only header search listens

    const handleOpenEvent = () => {
      setIsExpanded(true);
      setIsOpen(true);
      // Small timeout to Ensure focus works after expansion render cycle
      setTimeout(() => inputRef.current?.focus(), 50);
    };

    window.addEventListener('open-header-search', handleOpenEvent);
    return () =>
      window.removeEventListener('open-header-search', handleOpenEvent);
  }, [collapsible]);

  // Determine if we should use Portal (Mobile Only)
  const isMobile =
    typeof window !== 'undefined' ? window.innerWidth <= 768 : false;
  const usePortal = collapsible && isExpanded && isMobile;

  // Portal for Desktop clipping fix
  const [dropdownRect, setDropdownRect] = useState<{
    top: number;
    left: number;
    right: number;
    width: number;
  } | null>(null);

  useEffect(() => {
    const updateRect = () => {
      if (wrapperRef.current && isOpen && !usePortal) {
        const rect = wrapperRef.current.getBoundingClientRect();
        setDropdownRect({
          top: rect.bottom + window.scrollY,
          left: rect.left + window.scrollX,
          right: window.innerWidth - rect.right,
          width: rect.width,
        });
      }
    };

    if (isOpen && !usePortal) {
      updateRect();
      window.addEventListener('resize', updateRect);
      window.addEventListener('scroll', updateRect);
      return () => {
        window.removeEventListener('resize', updateRect);
        window.removeEventListener('scroll', updateRect);
      };
    }
  }, [isOpen, usePortal]);

  // Focus input on expand & Body Scroll Lock
  useEffect(() => {
    if (isExpanded && !isFirstRender.current) {
      inputRef.current?.focus();
    }
    isFirstRender.current = false;

    // Critical Fix: Only lock scroll if we are in Portal/Overlay mode (Mobile + Collapsible Header Search)
    // And ONLY if we are NOT in the PG workspace (as per ground rules to scope overlay/scroll-lock)
    const isPgFlow = location.pathname.startsWith('/pg');

    if (usePortal && !isPgFlow) {
      document.body.style.overflow = 'hidden';
      document.body.classList.add('isSearchMode');
    } else {
      document.body.style.overflow = '';
      document.body.classList.remove('isSearchMode');
    }

    return () => {
      document.body.style.overflow = '';
      document.body.classList.remove('isSearchMode');
    };
  }, [isExpanded, usePortal, location.pathname]);

  const getGroupLabel = (type: string) => {
    switch (type) {
      case 'event':
        return 'Events';
      case 'rider':
        return 'Riders';
      case 'horse':
        return 'Horses';
      case 'photographer':
        return 'Photographers';
      case 'photo':
        return 'Photos';
      default:
        return '';
    }
  };

  const getIcon = (type: SearchResult['type']) => {
    switch (type) {
      case 'event':
        return <Calendar size={16} />;
      case 'rider':
        return <RiderIcon size={16} />;
      case 'horse':
        return <HorseIcon size={16} />;
      case 'photographer':
        return <Camera size={16} />;
      case 'photo':
        return <Image size={16} />;
    }
  };

  // Icon tint classes per type (dark theme)
  const getIconBoxClass = (type: string, isLight: boolean) => {
    if (isLight) {
      switch (type) {
        case 'event':
          return 'text-[#1976D2] bg-[rgba(25,118,210,0.08)]';
        case 'rider':
          return 'text-[#7c3aed] bg-[rgba(124,58,237,0.08)]';
        case 'horse':
          return 'text-[#E65100] bg-[rgba(230,81,0,0.08)]';
        default:
          return 'bg-[var(--ui-bg-subtle)] text-[var(--color-text-secondary)] border-black/[0.05]';
      }
    }
    switch (type) {
      case 'event':
        return 'text-[#90caf9] bg-[rgba(144,202,249,0.1)]';
      case 'rider':
        return 'text-[#a78bfa] bg-[rgba(167,139,250,0.1)]';
      case 'horse':
        return 'text-[#ffcc80] bg-[rgba(255,204,128,0.1)]';
      default:
        return 'bg-[var(--color-text-primary)] text-[var(--color-border)] border-white/[0.05]';
    }
  };

  // Priority Order for rendering groups
  const groupOrder: Array<SearchResult['type']> = [
    'event',
    'rider',
    'horse',
    'photographer',
    'photo',
  ];

  const isLight = theme === 'light';

  // Render Logic for Dropdown Results
  const renderResults = () => {
    if (!isOpen) return null;

    const style: React.CSSProperties =
      dropdownRect && !usePortal
        ? {
            position: 'absolute',
            top: dropdownRect.top + 8,
            left: collapsible ? 'auto' : dropdownRect.left,
            right: collapsible ? dropdownRect.right : 'auto',
            width: collapsible ? 380 : dropdownRect.width || 420,
            margin: 0,
            zIndex: 9999,
          }
        : {};

    const content = (
      <div
        ref={dropdownRef}
        className={`absolute top-[calc(100%+8px)] left-0 right-auto w-[420px] rounded-xl py-2 overflow-y-auto max-h-[420px] [animation:slideScale_0.15s_ease-out] [scrollbar-width:thin] [scrollbar-color:#444_transparent] [&::-webkit-scrollbar]:w-[6px] [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-[#444] [&::-webkit-scrollbar-thumb]:rounded-[3px] ${
          isLight
            ? 'bg-white border border-black/10 shadow-[0_16px_48px_rgba(0,0,0,0.15),0_4px_12px_rgba(0,0,0,0.05)]'
            : 'bg-[#262626] border border-white/10 shadow-[0_16px_48px_rgba(0,0,0,0.5),0_4px_12px_rgba(0,0,0,0.2)]'
        } ${!hasResults ? 'px-4 py-6 text-center' : ''}`}
        style={style}
      >
        {hasResults
          ? groupOrder.map(type => {
              const groupItems = groups[type];
              if (!groupItems) return null;

              return (
                <div
                  key={type}
                  className={`pb-1 mb-1 last:border-b-0 last:mb-0 last:pb-0 ${isLight ? 'border-b border-black/[0.04]' : 'border-b border-white/[0.06]'}`}
                >
                  <div
                    className={`px-4 pt-[10px] pb-1 text-[0.75rem] uppercase tracking-[0.08em] font-semibold ${isLight ? 'text-[var(--color-text-secondary)]' : 'text-[var(--color-text-secondary)]'}`}
                  >
                    {getGroupLabel(type)}
                  </div>
                  {groupItems.map(item => (
                    <div
                      key={item.id}
                      className={`flex items-center px-4 h-14 cursor-pointer transition-[background] duration-[150ms] ease-linear clickable ${isLight ? 'hover:bg-[var(--brand-tint-hover)]' : 'hover:bg-white/[0.06]'}`}
                      onMouseDown={e => e.preventDefault()}
                      onClick={() => handleResultClick(item)}
                    >
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 flex-shrink-0 border border-white/[0.05] ${getIconBoxClass(item.type, isLight)}`}
                      >
                        {getIcon(item.type)}
                      </div>
                      <div className="flex flex-col justify-center overflow-hidden flex-1">
                        <span
                          className={`text-[0.875rem] font-medium whitespace-nowrap overflow-hidden text-ellipsis leading-[1.2] ${isLight ? 'text-[var(--color-text-primary)]' : 'text-[#EEE]'}`}
                        >
                          {item.title}
                        </span>
                        <span
                          className={`text-[0.75rem] whitespace-nowrap overflow-hidden text-ellipsis mt-0.5 leading-[1.2] ${isLight ? 'text-[var(--color-text-secondary)]' : 'text-[var(--color-text-secondary)]'}`}
                        >
                          {item.subtitle}
                        </span>
                      </div>
                      <ChevronRight
                        size={14}
                        className={`ml-2 opacity-0 -translate-x-1 transition-all duration-200 ease-linear group-hover:opacity-100 group-hover:translate-x-0 text-[var(--color-text-secondary)]`}
                      />
                    </div>
                  ))}
                </div>
              );
            })
          : query.length >= 2 && (
              <span
                className={`no-result-text text-[var(--color-text-secondary)]`}
              >
                No matches found
              </span>
            )}
      </div>
    );

    // If on desktop, we wrap in a themed context to ensure styles apply
    if (dropdownRect && !usePortal) {
      return (
        <div
          className={`modern-search-wrapper ${theme}-theme ${collapsible ? 'is-collapsible expanded' : ''} static`}
        >
          {content}
        </div>
      );
    }

    return content;
  };

  // Mobile Overlay Content (Portaled)
  const mobileOverlayContent = (
    <div className="fixed inset-0 z-[2000] pointer-events-none pt-[calc(env(safe-area-inset-top)+12px)] px-3 flex flex-col items-center">
      <div
        className="fixed inset-0 bg-black/65 backdrop-blur-[2px] z-[2001] pointer-events-auto [animation:fadeIn_0.2s_ease]"
        onClick={() => {
          setIsOpen(false);
          deactivateSearch();
          setIsExpanded(false);
        }}
      />

      <div className="relative w-full max-w-full mx-auto z-[2005] pointer-events-auto">
        <div className="bg-[#1A1A1A] border border-white/15 rounded-xl px-4 h-12 flex items-center w-full shadow-[0_4px_20px_rgba(0,0,0,0.3)]">
          <Search
            className="text-[var(--color-text-secondary)] flex-shrink-0"
            size={20}
          />
          <input
            ref={usePortal ? inputRef : null}
            type="text"
            className="flex-1 border-none bg-transparent text-[16px] text-white! font-normal outline-none ml-2 min-w-0 whitespace-nowrap overflow-hidden text-ellipsis placeholder:text-white/70"
            placeholder={currentPlaceholder}
            value={query}
            onChange={e => handleSearch(e.target.value)}
          />
          {query && (
            <button
              className="bg-white/15 rounded-full border-none text-[var(--color-border)] cursor-pointer flex items-center justify-center w-6 h-6 ml-2 transition-all duration-[150ms] ease-linear hover:bg-white/30 hover:text-white"
              onClick={e => {
                e.stopPropagation();
                setQuery('');
                setGroups({});
                inputRef.current?.focus();
              }}
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Mobile Helper Line */}
        <div className="mt-2 px-0 w-full text-white/90 text-[12px] font-medium tracking-[0.02em] [text-shadow:0_1px_2px_rgba(0,0,0,0.6)] whitespace-normal leading-[1.3] line-clamp-2 text-center pointer-events-none">
          Riders • Horses • Events • Photographers • Photo ID
        </div>

        {renderResults()}
      </div>
    </div>
  );

  // Collapsible wrapper: ALWAYS 44px wide (matches original CSS). Bar overflows left via absolute positioning.
  // Hero mode: full width to fill card.
  const wrapperClass = collapsible
    ? 'relative w-11 h-11 z-[1100]'
    : heroMode
      ? 'relative w-full z-[105]'
      : 'relative w-[420px] focus-within:w-[500px] transition-[width] duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)] z-[105]';

  // Bar styles — collapsible bar is always absolute right-0, width animates from 44px → 480px
  const getBarClass = () => {
    if (collapsible) {
      // width + border-radius animate; background-color and border-radius use same cubic-bezier as original
      const transition =
        'transition-[width,border-radius,background-color] duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)]';
      if (!isExpanded) {
        // Collapsed: 44px circle. Use CSS scale (separate from translate) so centering stays intact.
        return `absolute right-0 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-[#1A1A1A] border-transparent p-0 flex items-center justify-center cursor-pointer overflow-hidden shadow-[0_2px_8px_rgba(0,0,0,0.1)] ${transition} hover:bg-[#333] hover:scale-105`;
      } else {
        // Expanded: 480px pill, 40px tall, anchored right-0 — overflows wrapper to the left
        return `absolute right-0 top-1/2 -translate-y-1/2 w-[480px] h-10 rounded-[99px] bg-[#1A1A1A] border border-white/15 px-4 flex items-center shadow-[0_10px_30px_rgba(0,0,0,0.25)] ${transition}`;
      }
    }
    // Hero mode: taller bar (56px), left pad 20px, right pad 56px to clear the absolute go button
    if (heroMode) {
      return 'relative flex items-center bg-white border border-black/10 shadow-[0_4px_12px_rgba(0,0,0,0.08)] rounded-[99px] pl-5 pr-14 h-14 transition-[background-color,transform,box-shadow,border-color] duration-200 ease-linear focus-within:bg-white focus-within:border-[var(--brand-border-focus)] focus-within:shadow-[0_0_0_4px_var(--brand-ring-focus)]';
    }
    // Default non-collapsible
    const focusClass = isLight
      ? 'focus-within:bg-white focus-within:border-[var(--brand-border-focus)] focus-within:shadow-[0_0_0_4px_var(--brand-ring-focus)]'
      : 'focus-within:bg-[#2C2C2C] focus-within:border-white/30 focus-within:shadow-[0_4px_16px_rgba(0,0,0,0.25)]';
    return `flex items-center ${isLight ? 'bg-white border border-black/10 shadow-[0_4px_12px_rgba(0,0,0,0.08)]' : 'bg-[#1A1A1A] border border-white/15 shadow-[0_2px_4px_rgba(0,0,0,0.05)]'} rounded-[99px] px-[14px] h-10 transition-[background-color,transform,box-shadow,border-color] duration-200 ease-linear ${focusClass}`;
  };

  return (
    <>
      <div className={wrapperClass} ref={wrapperRef}>
        <div
          className={getBarClass()}
          onClick={() => {
            if (collapsible && !isExpanded) {
              setIsExpanded(true);
            }
          }}
        >
          <Search
            className={`flex-shrink-0 ${collapsible && !isExpanded ? 'text-white m-0!' : collapsible && isExpanded ? 'text-[var(--color-text-secondary)] mr-3' : isLight ? 'text-[var(--color-text-secondary)] mr-[10px]' : 'text-[var(--color-text-secondary)] mr-[10px]'}`}
            size={20}
          />

          {/* Only render Input in Wrapper if NOT using Portal */}
          <input
            ref={!usePortal ? inputRef : null}
            type="text"
            className={`${collapsible && !isExpanded ? 'flex-none' : 'flex-1'} border-none bg-transparent font-normal outline-none min-w-0 transition-[font-size,font-weight] duration-200 ease-linear not-placeholder-shown:text-base not-placeholder-shown:font-medium ${
              collapsible && !isExpanded
                ? 'opacity-0 pointer-events-none w-0'
                : 'opacity-100 pointer-events-auto w-full'
            } ${isLight ? 'text-[var(--color-text-primary)]! caret-[var(--brand-border-focus)] placeholder:text-[var(--color-text-secondary)]' : 'text-white! placeholder:text-[#AAA] placeholder:font-normal'} text-[0.875rem] ${usePortal ? 'hidden' : ''}`}
            placeholder={currentPlaceholder}
            value={query}
            onChange={e => handleSearch(e.target.value)}
            onFocus={e => {
              if (
                isMobileTrigger &&
                window.matchMedia('(max-width: 768px)').matches
              ) {
                e.preventDefault();
                e.target.blur();
                return;
              }

              activateSearch();
              if (query.length >= 2) {
                setHasResults(Object.keys(groups).length > 0);
                setIsOpen(true);
              }
            }}
            onClick={e => {
              if (
                isMobileTrigger &&
                window.matchMedia('(max-width: 768px)').matches
              ) {
                e.preventDefault();
                e.currentTarget.blur();
                window.dispatchEvent(new Event('open-header-search'));
              }
            }}
            disabled={collapsible && !isExpanded}
          />

          {query && !usePortal && (
            <button
              className={`rounded-full border-none cursor-pointer flex items-center justify-center w-6 h-6 ml-2 transition-all duration-[150ms] ease-linear ${isLight ? 'bg-black/5 text-[var(--color-text-secondary)] hover:bg-black/10 hover:text-[var(--color-text-primary)]' : 'bg-white/15 text-[var(--color-border)] hover:bg-white/30 hover:text-white'}`}
              onClick={e => {
                e.stopPropagation();
                setQuery('');
                setGroups({});
              }}
            >
              <X size={14} />
            </button>
          )}

          {theme === 'light' && !collapsible && (
            <button
              className={
                heroMode
                  ? 'absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-[var(--color-brand-primary)] text-white flex items-center justify-center border-none cursor-pointer flex-shrink-0 transition-[scale,background-color] duration-200 [&_svg]:w-5 [&_svg]:h-5 hover:bg-[var(--color-brand-primary-hover)] hover:scale-[1.05]'
                  : 'w-9 h-9 rounded-full bg-[var(--color-brand-primary)] text-white flex items-center justify-center border-none ml-2 cursor-pointer flex-shrink-0 transition-[scale,background-color] duration-200 [&_svg]:w-5 [&_svg]:h-5 hover:bg-[var(--color-brand-primary-hover)] hover:scale-[1.05]'
              }
              onClick={e => {
                e.stopPropagation();
                if (!isOpen && query.length >= 2) setIsOpen(true);
                inputRef.current?.focus();
              }}
            >
              <ArrowRight size={18} />
            </button>
          )}
        </div>

        {/* Desktop Dropdown (In-Flow fallback) */}
        {!usePortal && !dropdownRect && renderResults()}
      </div>

      {/* Portal for Desktop Dropdown (Escapes overflow:hidden) */}
      {!usePortal &&
        dropdownRect &&
        isOpen &&
        typeof document !== 'undefined' &&
        ReactDOM.createPortal(renderResults(), document.body)}

      {/* Portal for Mobile Expanded */}
      {usePortal &&
        typeof document !== 'undefined' &&
        ReactDOM.createPortal(mobileOverlayContent, document.body)}
    </>
  );
};
