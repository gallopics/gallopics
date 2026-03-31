import React, { useState, useRef, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Check, X, Search } from 'lucide-react';

interface Option {
  label: string;
  value: string;
  subtext?: string;
  icon?: string;
}

interface MultiSelectProps {
  label?: string;
  values: string[];
  options: Option[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  disabled?: boolean;
}

export const MultiSelect: React.FC<MultiSelectProps> = ({
  values,
  options,
  onChange,
  placeholder = 'Select options',
  searchPlaceholder = 'Search...',
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [menuPosition, setMenuPosition] = useState<{
    top: number;
    left: number;
    width: number;
  } | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const filteredOptions = useMemo(() => {
    if (!searchTerm) return options;
    const lowerSearch = searchTerm.toLowerCase();
    return options.filter(opt => opt.label.toLowerCase().includes(lowerSearch));
  }, [options, searchTerm]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const menuEl = document.querySelector('.multi-select-portal-menu');

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
      if (dropdownRef.current) {
        const rect = dropdownRef.current.getBoundingClientRect();
        const scrollX = window.scrollX || 0;
        const scrollY = window.scrollY || 0;

        setMenuPosition({
          top: rect.bottom + scrollY + 4,
          left: rect.left + scrollX,
          width: Math.max(280, rect.width),
        });
      }
    } else {
      setSearchTerm('');
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleToggleOption = (optionValue: string) => {
    if (values.includes(optionValue)) {
      onChange(values.filter(v => v !== optionValue));
    } else {
      onChange([...values, optionValue]);
    }
  };

  const handleRemoveTag = (e: React.MouseEvent, optionValue: string) => {
    e.stopPropagation();
    onChange(values.filter(v => v !== optionValue));
  };

  const selectedOptions = options.filter(opt => values.includes(opt.value));

  const renderMenuContent = () => (
    <div
      className="bg-white rounded-xl shadow-[0_10px_25px_-5px_rgba(0,0,0,0.1),0_8px_10px_-6px_rgba(0,0,0,0.1)] border border-[var(--color-border)] p-[6px] [animation:fadeInScale_0.15s_ease-out] [transform-origin:top_left] multi-select-portal-menu"
      style={
        menuPosition
          ? {
              position: 'absolute',
              top: menuPosition.top,
              left: menuPosition.left,
              width: menuPosition.width,
              zIndex: 9999,
            }
          : undefined
      }
    >
      <div className="flex items-center gap-2 px-3 py-2 border-b border-[var(--color-border)] mb-1">
        <Search size={14} className="text-[var(--color-text-secondary)]" />
        <input
          type="text"
          className="border-none bg-transparent w-full outline-none text-[0.875rem]"
          placeholder={searchPlaceholder}
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          autoFocus
        />
      </div>
      <div className="max-h-[240px] overflow-y-auto [&::-webkit-scrollbar]:w-[4px] [&::-webkit-scrollbar-thumb]:bg-[var(--color-border)] [&::-webkit-scrollbar-thumb]:rounded-[2px]">
        {filteredOptions.length > 0 ? (
          filteredOptions.map(option => {
            const isSelected = values.includes(option.value);
            return (
              <button
                key={option.value}
                className={`w-full flex! flex-row! items-center! justify-between! px-3 py-[6px] border-none bg-transparent cursor-pointer rounded-lg transition-[background] duration-100 min-h-12 hover:bg-[var(--color-bg)] ${isSelected ? 'bg-[var(--color-brand-tint)] text-[var(--color-brand-primary)]' : ''}`}
                onClick={() => handleToggleOption(option.value)}
                type="button"
              >
                <div className="flex! flex-row! items-center! justify-between! text-left flex-1 min-w-0 m-0 p-0">
                  <div className="flex! flex-row! items-center! gap-3 min-w-0 mr-auto">
                    {option.icon && (
                      <img
                        src={option.icon}
                        alt=""
                        className="w-6 h-6 rounded-full object-cover flex-shrink-0"
                      />
                    )}
                    <div className="text-[0.875rem] font-medium whitespace-nowrap overflow-hidden text-ellipsis">
                      {option.label}
                    </div>
                  </div>
                  {option.subtext && (
                    <div className="text-[0.75rem] text-[var(--color-border)] ml-3 whitespace-nowrap">
                      {option.subtext}
                    </div>
                  )}
                </div>
                {isSelected && (
                  <Check
                    size={16}
                    className="text-[var(--color-brand-primary)] ml-2 flex-shrink-0"
                  />
                )}
              </button>
            );
          })
        ) : (
          <div className="p-3 text-center text-[var(--color-text-secondary)] text-[0.875rem]">
            No results
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div
      className={`relative w-full ${isOpen ? 'open' : ''}`}
      ref={dropdownRef}
    >
      <div
        className={`min-h-11 px-4 bg-[var(--ui-bg-subtle)] border border-[var(--color-border)] rounded-[6px] flex items-center justify-between gap-2 cursor-pointer transition-all duration-200 hover:border-[var(--color-brand-primary)] hover:bg-white ${isOpen ? 'border-[var(--color-brand-primary)] bg-white shadow-[0_0_0_3px_var(--color-brand-tint)]' : ''} ${disabled ? 'disabled opacity-50 cursor-not-allowed' : ''}`}
        onClick={() => !disabled && setIsOpen(!isOpen)}
      >
        <div className="flex flex-wrap gap-[6px] flex-1">
          {selectedOptions.length > 0 ? (
            selectedOptions.map(opt => (
              <span
                key={opt.value}
                className="inline-flex items-center gap-[6px] bg-[var(--color-brand-tint)] text-[var(--color-brand-primary)] py-1 px-[10px] rounded-[99px] text-[0.8125rem] font-medium"
              >
                {opt.icon && (
                  <img
                    src={opt.icon}
                    alt=""
                    className="w-5 h-5 rounded-full object-cover -ml-1"
                  />
                )}
                <span className="tag-text">{opt.label}</span>
                <button
                  className="flex items-center justify-center bg-transparent border-none text-[var(--color-brand-primary)] cursor-pointer p-0 opacity-60 transition-opacity duration-200 hover:opacity-100"
                  onClick={e => handleRemoveTag(e, opt.value)}
                  type="button"
                >
                  <X size={12} />
                </button>
              </span>
            ))
          ) : (
            <span className="text-[var(--color-text-secondary)] text-[0.875rem]">
              {placeholder}
            </span>
          )}
        </div>
        <ChevronDown
          className={`text-inherit transition-transform duration-200 ease-linear ${isOpen ? 'rotate-180' : ''}`}
          size={16}
        />
      </div>

      {isOpen && createPortal(renderMenuContent(), document.body)}
    </div>
  );
};
