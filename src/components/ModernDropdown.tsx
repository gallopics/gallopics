import React, { useState, useRef, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Check, Search } from 'lucide-react';

interface Option {
  label: string;
  subtext?: string;
  description?: string; // New: Detailed purpose / description
  value: string;
  icon?: React.ReactNode;
  disabled?: boolean;
}

interface ModernDropdownProps {
  label?: string;
  value: string;
  options: Option[];
  onChange: (value: string) => void;
  icon?: React.ReactNode;
  placeholder?: string;
  searchPlaceholder?: string;
  showSearch?: boolean;
  variant?: 'default' | 'pill'; // New prop
  disabled?: boolean;
}

export const ModernDropdown: React.FC<ModernDropdownProps> = ({
  value,
  options,
  onChange,
  icon,
  placeholder = 'Select',
  showSearch = false,
  searchPlaceholder = 'Search...',
  variant = 'default',
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [menuPosition, setMenuPosition] = useState<{
    top: number;
    left: number;
    width: number;
  } | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Filter options based on search term
  const filteredOptions = useMemo(() => {
    if (!searchTerm) return options;
    const lowerSearch = searchTerm.toLowerCase();
    return options.filter(opt => opt.label.toLowerCase().includes(lowerSearch));
  }, [options, searchTerm]);

  // Close on click outside and Reset search
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const menuEl = document.querySelector('.modern-dropdown-portal-menu');

      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(target) &&
        (!menuEl || !menuEl.contains(target))
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);

      if (window.innerWidth <= 768 && dropdownRef.current) {
        const rect = dropdownRef.current.getBoundingClientRect();
        const scrollX = window.scrollX || 0;
        const scrollY = window.scrollY || 0;

        let left = rect.left + scrollX;
        const minWidth = 280;
        if (left + minWidth > window.innerWidth - 16) {
          left = window.innerWidth - minWidth - 16;
          if (left < 16) left = 16;
        }

        setMenuPosition({
          top: rect.bottom + scrollY + 6,
          left,
          width: Math.max(minWidth, rect.width),
        });

        if (showSearch) {
          setTimeout(() => {
            const input = document.querySelector(
              '.modern-dropdown-portal-menu .dropdown-search-input',
            ) as HTMLInputElement;
            input?.focus();
          }, 50);
        }
      } else {
        setMenuPosition(null);
        if (showSearch) {
          setTimeout(() => searchInputRef.current?.focus(), 0);
        }
      }
    } else {
      setSearchTerm('');
      setHighlightedIndex(-1);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, showSearch]);

  // Keyboard Navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'Enter' || e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        setIsOpen(true);
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev =>
          prev < filteredOptions.length - 1 ? prev + 1 : prev,
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => (prev > 0 ? prev - 1 : 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (
          highlightedIndex >= 0 &&
          highlightedIndex < filteredOptions.length
        ) {
          handleSelect(filteredOptions[highlightedIndex].value);
        } else if (filteredOptions.length === 1) {
          handleSelect(filteredOptions[0].value);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        break;
      case 'Tab':
        setIsOpen(false);
        break;
    }
  };

  const handleSelect = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
  };

  const selectedOption = options.find(opt => opt.value === value);
  const displayLabel = selectedOption ? selectedOption.label : placeholder;

  // Check if any option in the list actually has an icon to avoid empty left padding
  const hasIcons = useMemo(() => options.some(opt => !!opt.icon), [options]);

  const isPill = variant === 'pill';

  // RENDER CONTENT GENERATOR
  const renderMenuContent = (isPortal = false) => (
    <div
      className={`${isPortal ? '' : 'absolute top-[calc(100%+6px)] left-0'} w-full min-w-[240px] bg-white ${showSearch ? 'rounded-b-lg rounded-t-[12px]' : 'rounded-lg'} shadow-[0_4px_12px_rgba(0,0,0,0.08),0_1px_4px_rgba(0,0,0,0.04)] border border-black/[0.06] p-1.5 z-[1000] [animation:fadeInScale_0.15s_ease-out] [transform-origin:top_left] modern-dropdown-portal-menu`}
      role="listbox"
      style={
        isPortal && menuPosition
          ? {
              position: 'absolute',
              top: menuPosition.top,
              left: menuPosition.left,
              width: Math.max(240, menuPosition.width),
              zIndex: 9999,
              margin: 0,
            }
          : undefined
      }
    >
      {showSearch && (
        <div className="flex items-center gap-2 px-3 py-2 border-b border-[var(--color-border)] mb-1 -mx-1.5 -mt-1.5 px-3">
          <Search size={14} className="text-[var(--color-text-secondary)]" />
          <input
            ref={isPortal ? null : searchInputRef}
            type="text"
            className="dropdown-search-input border-none bg-transparent w-full outline-none text-[var(--fs-sm)]"
            placeholder={searchPlaceholder}
            value={searchTerm}
            onChange={e => {
              setSearchTerm(e.target.value);
              setHighlightedIndex(0);
            }}
            autoFocus={!isPortal && showSearch}
          />
        </div>
      )}
      <div className="max-h-[280px] overflow-y-auto [&::-webkit-scrollbar]:w-[4px] [&::-webkit-scrollbar-thumb]:bg-[var(--color-border)] [&::-webkit-scrollbar-thumb]:rounded-[2px]">
        {filteredOptions.length > 0 ? (
          filteredOptions.map((option, index) => (
            <button
              key={option.value}
              className={`w-full grid ${hasIcons ? 'grid-cols-[24px_1fr_20px]' : 'grid-cols-[1fr_20px]'} ${option.description ? 'items-start' : 'items-center'} gap-3 px-4 ${option.description ? 'py-3 h-auto' : 'h-11'} border-none rounded-md cursor-pointer text-left text-[var(--color-text-primary)] text-[0.875rem] transition-[background-color] duration-100 ease-linear hover:bg-[var(--brand-tint-hover)] ${option.value === value ? 'selected' : ''} ${option.disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
              style={
                option.value === value
                  ? {
                      backgroundColor: 'var(--brand-tint-active)',
                      color: 'var(--color-text-primary)',
                      fontWeight: 500,
                    }
                  : undefined
              }
              onClick={() => !option.disabled && handleSelect(option.value)}
              role="option"
              aria-selected={option.value === value}
              aria-disabled={option.disabled}
              onMouseEnter={() =>
                !option.disabled && setHighlightedIndex(index)
              }
            >
              {/* 1. Icon Column */}
              {hasIcons && (
                <span className="text-[1.1em] flex items-center justify-center w-6">
                  {option.icon}
                </span>
              )}

              {/* 2. Label Column */}
              <div className="flex flex-col gap-0.5 text-left min-w-0">
                <div className="text-[0.875rem] font-medium text-[var(--color-text-primary)] leading-[1.4] truncate">
                  {option.label}
                </div>
                {option.subtext && (
                  <div className="text-[0.75rem] text-[var(--color-text-secondary)] leading-[1.4]">
                    {option.subtext}
                  </div>
                )}
                {option.description && (
                  <div className="text-[0.75rem] text-[var(--color-text-tertiary)] leading-[1.5] whitespace-normal break-words mt-0.5">
                    {option.description}
                  </div>
                )}
              </div>

              {/* 3. Check Column */}
              {option.value === value ? (
                <Check
                  size={16}
                  className="text-[var(--color-text-primary)] opacity-100"
                />
              ) : (
                <div />
              )}
            </button>
          ))
        ) : (
          <div className="px-4 py-3 text-center text-[0.75rem] text-[var(--color-border)]">
            No results
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div
      className={`relative box-border ${isPill ? 'w-auto' : 'block w-full'}`}
      ref={dropdownRef}
      onKeyDown={handleKeyDown}
    >
      <button
        className={`flex items-center gap-[var(--spacing-sm)] cursor-pointer transition-all duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] w-full justify-between focus:outline-none ${
          isPill
            ? `min-h-10 h-10 px-[var(--spacing-md)] rounded-[20px] bg-white border border-[var(--color-border)] text-[0.875rem] font-medium min-w-0 gap-[var(--spacing-sm)] hover:bg-[var(--color-bg)] ${isOpen ? 'border-[var(--color-brand-primary)] text-[var(--color-brand-primary)] bg-[var(--color-brand-tint)]' : ''}`
            : `min-h-11 py-2.5 px-4 bg-white border border-[var(--color-border)] rounded-[8px] hover:border-[var(--color-border)] ${isOpen ? 'border-[var(--color-brand-primary)] shadow-[0_0_0_4px_var(--color-brand-tint)]' : ''}`
        } ${disabled ? 'disabled opacity-50 cursor-not-allowed' : ''}`}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        disabled={disabled}
      >
        {icon && (
          <span
            className={`flex items-center text-[${isPill ? '1rem' : '1.1em'}] ${isPill ? 'w-4 justify-center' : 'w-5 justify-center'}`}
          >
            {icon}
          </span>
        )}
        <div className="flex-1 flex flex-col text-left gap-1 min-w-0 overflow-hidden">
          <span className="text-[0.875rem] font-medium text-[var(--color-text-primary)] truncate">
            {displayLabel}
          </span>
          {selectedOption?.subtext && (
            <span className="text-[0.75rem] text-[var(--color-text-secondary)] font-normal">
              {selectedOption.subtext}
            </span>
          )}
        </div>
        <ChevronDown
          className={`self-center flex-shrink-0 text-inherit transition-transform duration-200 ease-linear ${isOpen ? 'rotate-180' : ''}`}
          size={16}
        />
      </button>

      {isOpen &&
        (menuPosition
          ? createPortal(renderMenuContent(true), document.body)
          : renderMenuContent(false))}
    </div>
  );
};
