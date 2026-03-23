import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Search, X, Image, ChevronRight } from 'lucide-react';
import { HorseIcon } from './icons/HorseIcon';
import { RiderIcon } from './icons/RiderIcon';

/**
 * SearchDropdown_v2 (guest-flow)
 * Used in guest-flow profile/event search fields to provide a structured,
 * grouped dropdown experience mirroring the global header search.
 * Global header uses separate components; this is a scoped variant.
 */
export interface ScopedSearchOption {
    label: string;
    value: string;
    type?: 'rider' | 'horse' | 'photo' | 'email' | 'id';
    subtitle?: string;
    id?: string;
}

interface ScopedSearchBarProps {
    placeholder: string;
    onSelect: (value: string) => void;
    onSearchChange?: (value: string) => void;
    currentValue: string;
    options: ScopedSearchOption[];
    variant?: 'v1' | 'v2';
}

export const ScopedSearchBar: React.FC<ScopedSearchBarProps> = ({
    placeholder,
    onSelect,
    onSearchChange,
    currentValue,
    options,
    variant = 'v1'
}) => {
    // If currentValue is 'All', we show empty string or just the placeholder
    const [inputValue, setInputValue] = useState(currentValue === 'All' ? '' : currentValue);
    const [isFocused, setIsFocused] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(-1);
    const [dropdownPosition, setDropdownPosition] = useState<{ top: number; left: number; width: number } | null>(null);
    const wrapperRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Sync internal state if parent updates currentValue externally (e.g. Reset button)
    useEffect(() => {
        setInputValue(currentValue === 'All' ? '' : currentValue);
    }, [currentValue]);

    const filteredOptions = options.filter(opt =>
        opt.label.toLowerCase().includes(inputValue.toLowerCase()) && opt.value !== 'All'
    );

    // Grouping for v2
    const groupedResults = filteredOptions.reduce((acc, curr) => {
        const type = curr.type || 'other';
        if (!acc[type]) acc[type] = [];
        acc[type].push(curr);
        return acc;
    }, {} as Record<string, ScopedSearchOption[]>);

    const groupOrder = ['rider', 'horse', 'photo', 'other'];

    const handleSelect = (val: string) => {
        onSelect(val);
        if (onSearchChange) onSearchChange(val); // Also trigger search update on selection
        setInputValue(val === 'All' ? '' : val);
        setIsFocused(false);
        setSelectedIndex(-1);
    };

    const handleClear = (e: React.MouseEvent) => {
        e.stopPropagation();
        onSelect('All');
        if (onSearchChange) onSearchChange('');
        setInputValue('');
        inputRef.current?.focus();
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (!isFocused || filteredOptions.length === 0) return;

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSelectedIndex(prev => (prev + 1) % filteredOptions.length);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSelectedIndex(prev => (prev - 1 + filteredOptions.length) % filteredOptions.length);
        } else if (e.key === 'Enter' && selectedIndex >= 0) {
            handleSelect(filteredOptions[selectedIndex].value);
        } else if (e.key === 'Escape') {
            setIsFocused(false);
        }
    };

    // Outside click handler
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as Node;
            // Check if click is inside wrapper or inside portal menu
            const portalMenu = document.querySelector('.scoped-portal-menu');

            if (
                wrapperRef.current &&
                !wrapperRef.current.contains(target) &&
                (!portalMenu || !portalMenu.contains(target))
            ) {
                setIsFocused(false);
            }
        };

        if (isFocused) {
            document.addEventListener('mousedown', handleClickOutside);

            // Calculate portal position on mobile
            if (window.innerWidth <= 768 && wrapperRef.current) {
                const updatePosition = () => {
                    if (wrapperRef.current) {
                        const rect = wrapperRef.current.getBoundingClientRect();
                        setDropdownPosition({
                            top: rect.bottom + window.scrollY + 4,
                            left: rect.left + window.scrollX,
                            width: rect.width
                        });
                    }
                };

                updatePosition();
                window.addEventListener('scroll', updatePosition);
                window.addEventListener('resize', updatePosition);

                return () => {
                    document.removeEventListener('mousedown', handleClickOutside);
                    window.removeEventListener('scroll', updatePosition);
                    window.removeEventListener('resize', updatePosition);
                };
            } else {
                setDropdownPosition(null);
            }
        }

        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isFocused]);

    const getIcon = (type?: string) => {
        switch (type) {
            case 'rider': return <RiderIcon size={16} />;
            case 'horse': return <HorseIcon size={16} />;
            case 'photo':
            case 'id': return <Image size={16} />;
            case 'email': return <Search size={16} />;
            default: return <Search size={16} />;
        }
    };

    const getGroupLabel = (type: string) => {
        switch (type) {
            case 'rider': return 'RIDERS';
            case 'horse': return 'HORSES';
            case 'photo': return 'PHOTOS';
            default: return 'OTHER';
        }
    };

    const getIconBoxTypeClass = (type?: string) => {
        switch (type) {
            case 'rider': return 'text-[#7c3aed] bg-[rgba(124,58,237,0.08)]';
            case 'horse': return 'text-[#E65100] bg-[rgba(230,81,0,0.08)]';
            case 'photo': return 'text-[var(--color-text-secondary)] bg-[var(--ui-bg-subtle)]';
            default: return 'bg-[var(--ui-bg-subtle)] text-[var(--color-text-secondary)] border-black/[0.03]';
        }
    };

    // Render Content Logic
    const renderDropdownContent = (isPortal = false) => (
        <div
            className={`${variant === 'v2' ? 'p-0 max-h-[380px]' : 'py-2 max-h-[240px]'} absolute top-[calc(100%+4px)] left-0 right-0 bg-white rounded-xl shadow-[0_16px_48px_rgba(0,0,0,0.15),0_4px_12px_rgba(0,0,0,0.05)] border border-black/10 z-[100] overflow-y-auto [scrollbar-width:thin] scoped-portal-menu`}
            style={isPortal && dropdownPosition ? {
                position: 'fixed',
                top: dropdownPosition.top - window.scrollY,
                left: dropdownPosition.left - window.scrollX,
                width: dropdownPosition.width,
                zIndex: 9999,
                maxHeight: 'min(50vh, 320px)'
            } : undefined}
        >
            {filteredOptions.length > 0 ? (
                variant === 'v2' ? (
                    groupOrder.map(type => {
                        const groupItems = groupedResults[type];
                        if (!groupItems) return null;

                        return (
                            <div key={type} className="border-b border-black/[0.05] pb-1 last:border-b-0 last:pb-0">
                                <div className="px-4 pt-3 pb-1 text-[0.75rem] uppercase tracking-[0.08em] text-[var(--color-text-secondary)] font-bold">
                                    {getGroupLabel(type)}
                                </div>
                                {groupItems.map((opt) => {
                                    const isFocusedRow = filteredOptions.indexOf(opt) === selectedIndex;
                                    return (
                                        <div
                                            key={opt.value}
                                            className={`flex items-center px-4 py-2 min-h-[52px] cursor-pointer transition-[background] duration-[150ms] ease-linear ${isFocusedRow ? 'bg-[rgba(27,58,236,0.04)]' : ''} hover:bg-[rgba(27,58,236,0.04)] group`}
                                            onClick={() => handleSelect(opt.value)}
                                        >
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 flex-shrink-0 border border-black/[0.03] ${getIconBoxTypeClass(opt.type)}`}>
                                                {getIcon(opt.type)}
                                            </div>
                                            <div className="flex flex-col justify-center flex-1 overflow-hidden">
                                                <span className="text-[0.875rem] font-medium text-[var(--color-text-primary)] whitespace-nowrap overflow-hidden text-ellipsis">
                                                    {opt.label}
                                                </span>
                                                {opt.subtitle && (
                                                    <span className="text-[0.75rem] text-[var(--color-text-secondary)] whitespace-nowrap overflow-hidden text-ellipsis mt-px">
                                                        {opt.subtitle}
                                                    </span>
                                                )}
                                            </div>
                                            <ChevronRight
                                                size={14}
                                                className="text-[var(--color-border)] ml-2 opacity-0 -translate-x-1 transition-all duration-200 ease-linear group-hover:opacity-100 group-hover:translate-x-0"
                                            />
                                        </div>
                                    );
                                })}
                            </div>
                        );
                    })
                ) : (
                    filteredOptions.map((opt) => (
                        <div
                            key={opt.value}
                            className="flex items-center px-4 py-[10px] cursor-pointer transition-[background] duration-[150ms] ease-linear hover:bg-[rgba(27,58,236,0.04)]"
                            onClick={() => handleSelect(opt.value)}
                        >
                            <span className="text-[0.875rem] text-[var(--color-text-primary)]">{opt.label}</span>
                        </div>
                    ))
                )
            ) : (
                <div className="p-4 text-center text-[var(--color-text-secondary)] text-[0.875rem]">No matches</div>
            )}
        </div>
    );

    return (
        <div className="relative flex-1 min-w-[200px] h-10 z-10" ref={wrapperRef}>
            <div className="flex items-center bg-white border border-[var(--color-border)] rounded-[20px] px-4 h-10 transition-all duration-200 ease-linear shadow-[0_1px_2px_rgba(0,0,0,0.05)] focus-within:bg-white focus-within:border-[var(--color-brand-primary)] focus-within:shadow-[0_0_0_4px_rgba(27,58,236,0.12)]">
                <Search className="text-[var(--color-text-secondary)] flex-shrink-0 mr-[10px]" size={20} />
                <input
                    ref={inputRef}
                    type="text"
                    className="flex-1 border-none bg-transparent text-[0.875rem] text-[var(--color-text-primary)] font-normal outline-none min-w-0 h-full placeholder:text-[var(--color-text-secondary)]"
                    placeholder={placeholder}
                    value={inputValue}
                    onChange={(e) => {
                        const val = e.target.value;
                        setInputValue(val);
                        if (onSearchChange) onSearchChange(val);
                        setSelectedIndex(-1);
                    }}
                    onFocus={() => setIsFocused(true)}
                    onKeyDown={handleKeyDown}
                />
                {inputValue && (
                    <button
                        className="bg-black/5 rounded-full border-none text-[var(--color-text-secondary)] cursor-pointer flex items-center justify-center w-5 h-5 ml-2 flex-shrink-0 transition-all duration-[150ms] ease-linear p-0 hover:bg-black/10 hover:text-[var(--color-text-primary)]"
                        onClick={handleClear}
                    >
                        <X size={14} />
                    </button>
                )}
            </div>

            {isFocused && (filteredOptions.length > 0 || inputValue.length > 0) && (
                dropdownPosition ?
                    createPortal(renderDropdownContent(true), document.body)
                    : renderDropdownContent(false)
            )}
        </div>
    );
};
