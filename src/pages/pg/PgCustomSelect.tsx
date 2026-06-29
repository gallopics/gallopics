import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronDown, Check } from 'lucide-react';

interface Option {
  label: string;
  value: string;
  subtext?: string;
  disabled?: boolean;
}

interface PgCustomSelectProps {
  value: string;
  options: Option[];
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  displayValue?: string;
  searchable?: boolean;
}

export const PgCustomSelect: React.FC<PgCustomSelectProps> = ({
  value,
  options,
  onChange,
  placeholder = 'Select...',
  disabled,
  displayValue,
  searchable = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchValue, setSearchValue] = useState(value);
  const [isSearching, setIsSearching] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSearchValue(value);
  }, [value]);

  // Click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setIsSearching(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleSelect = (val: string) => {
    onChange(val);
    setSearchValue(val);
    setIsSearching(false);
    setIsOpen(false);
  };

  const filteredOptions = useMemo(() => {
    if (!searchable || !isSearching || !searchValue.trim()) return options;

    const query = searchValue.trim().toLocaleLowerCase();
    return options.filter(option =>
      `${option.label} ${option.subtext || ''}`
        .toLocaleLowerCase()
        .includes(query)
    );
  }, [options, searchValue, searchable, isSearching]);

  const selectedOption = options.find(o => o.value === value);
  // Use displayValue if provided, otherwise check if value matches an option, otherwise use placeholder
  // If value is present but no option matches (e.g. custom/mixed), we might want to fall back to placeholder OR show value?
  // In our case, we use displayValue for the weird Mixed states.
  const triggerText =
    displayValue ||
    (selectedOption ? selectedOption.label : value || placeholder);

  if (searchable) {
    return (
      <div
        className={`pg-custom-select-trigger ${disabled ? 'disabled opacity-60 cursor-not-allowed bg-[var(--ui-bg-subtle)]' : ''}`}
        ref={containerRef}
      >
        <input
          type="text"
          value={searchValue}
          placeholder={placeholder}
          disabled={disabled}
          aria-label={placeholder}
          aria-autocomplete="list"
          aria-expanded={isOpen}
          className="pg-custom-select-input"
          onFocus={event => {
            setIsOpen(true);
            setIsSearching(false);
            event.currentTarget.select();
          }}
          onClick={event => event.stopPropagation()}
          onChange={event => {
            const nextValue = event.target.value;
            setSearchValue(nextValue);
            onChange(nextValue);
            setIsSearching(true);
            setIsOpen(true);
          }}
          onKeyDown={event => {
            if (event.key === 'Escape') {
              setIsOpen(false);
              event.currentTarget.blur();
            }

            if (
              event.key === 'Enter' &&
              isSearching &&
              filteredOptions.length > 0
            ) {
              event.preventDefault();
              handleSelect(filteredOptions[0].value);
            }
          }}
        />
        <button
          type="button"
          className="pg-custom-select-toggle"
          aria-label={isOpen ? 'Close options' : 'Show options'}
          disabled={disabled}
          onClick={() => {
            setIsSearching(false);
            setIsOpen(open => !open);
          }}
        >
          <ChevronDown
            size={16}
            color="var(--color-text-secondary)"
            className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          />
        </button>

        {isOpen && (
          <div className="pg-custom-select-list" role="listbox">
            {filteredOptions.map(opt => (
              <div
                key={opt.value}
                role="option"
                aria-selected={opt.value === value}
                className={`pg-select-option ${opt.value === value ? 'selected bg-[var(--color-revenue-bg)] text-[var(--color-brand-primary)] font-semibold' : 'font-normal'} ${opt.disabled ? 'disabled' : ''}`}
                onMouseDown={event => event.preventDefault()}
                onClick={() => !opt.disabled && handleSelect(opt.value)}
              >
                <span className="flex-1">{opt.label}</span>
                {opt.value === value && (
                  <Check size={14} color="var(--color-brand-primary)" />
                )}
              </div>
            ))}
            {filteredOptions.length === 0 && (
              <div className="px-3 py-2 text-[0.875rem] text-[var(--color-text-secondary)]">
                No matches. The typed value will be used.
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      className={`pg-custom-select-trigger ${disabled ? 'disabled opacity-60 cursor-not-allowed bg-[var(--ui-bg-subtle)]' : ''}`}
      ref={containerRef}
      onClick={() => !disabled && setIsOpen(!isOpen)}
    >
      <span
        className={`flex-1 mr-2 whitespace-nowrap overflow-hidden text-ellipsis ${value || displayValue ? 'text-[var(--color-text-primary)]' : 'text-[var(--color-text-secondary)]'}`}
      >
        {triggerText}
      </span>
      <ChevronDown
        size={16}
        color="var(--color-text-secondary)"
        className={`flex-shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
      />

      {isOpen && (
        <div
          className="pg-custom-select-list"
          onClick={e => e.stopPropagation()}
        >
          {options.map(opt => (
            <div
              key={opt.value}
              className={`pg-select-option ${opt.value === value ? 'selected bg-[var(--color-revenue-bg)] text-[var(--color-brand-primary)] font-semibold' : 'font-normal'} ${opt.disabled ? 'disabled' : ''}`}
              onClick={() => !opt.disabled && handleSelect(opt.value)}
            >
              <span className="flex-1">{opt.label}</span>
              {opt.value === value && (
                <Check size={14} color="var(--color-brand-primary)" />
              )}
            </div>
          ))}
          {options.length === 0 && (
            <div className="px-3 py-2 text-[0.875rem] text-[var(--color-text-secondary)]">
              No options
            </div>
          )}
        </div>
      )}
    </div>
  );
};
