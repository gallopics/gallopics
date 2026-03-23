import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

interface CreatableComboboxProps {
    value: string;
    options: string[]; // List of existing batch names
    onChange: (value: string) => void;
    placeholder?: string;
    label?: string;
}

export const CreatableCombobox: React.FC<CreatableComboboxProps> = ({
    value,
    options,
    onChange,
    placeholder = 'Choose or create...',
    label
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [inputValue, setInputValue] = useState(value);
    const [filteredOptions, setFilteredOptions] = useState<string[]>(options);
    const wrapperRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setInputValue(value);
    }, [value]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setInputValue(val);

        // Filter options
        const filtered = options.filter(opt =>
            opt.toLowerCase().includes(val.toLowerCase())
        );
        setFilteredOptions(filtered);
        setIsOpen(true);
    };

    const handleSelectOption = (option: string) => {
        setInputValue(option);
        onChange(option);
        setIsOpen(false);
    };



    const handleFocus = () => {
        setFilteredOptions(options);
        setIsOpen(true);
    };

    const showCreateOption = inputValue.trim() &&
        !options.some(opt => opt.toLowerCase() === inputValue.toLowerCase());

    return (
        <div className="relative w-full" ref={wrapperRef}>
            {label && (
                <label className="block text-[0.875rem] font-medium text-[var(--color-text-primary)] mb-[6px]">
                    {label}
                </label>
            )}
            <div className="relative flex items-center">
                <input
                    type="text"
                    className="flex-1 min-h-[52px] py-0 pl-4 pr-10 bg-white border border-[var(--color-border)] rounded-[var(--radius-md)] text-[var(--fs-base)] text-[var(--color-text-primary)] transition-all duration-200 ease-linear outline-none placeholder:text-[var(--color-text-secondary)] focus:border-[var(--color-brand-primary)] focus:shadow-[0_0_0_3px_var(--color-brand-tint)]"
                    value={inputValue}
                    onChange={handleInputChange}
                    onFocus={handleFocus}
                    placeholder={placeholder}
                />
                <button
                    type="button"
                    className="absolute right-3 flex items-center justify-center bg-none border-none cursor-pointer text-[var(--color-text-secondary)] transition-[color] duration-200 ease-linear hover:text-[var(--color-text-primary)]"
                    onClick={() => setIsOpen(!isOpen)}
                >
                    <ChevronDown size={16} className={isOpen ? 'rotate-180' : ''} />
                </button>
            </div>

            {isOpen && (
                <div className="absolute top-[calc(100%+8px)] left-0 right-0 bg-white border border-[var(--color-border)] rounded-xl shadow-[0_10px_25px_rgba(0,0,0,0.1)] max-h-[320px] overflow-y-auto z-[1000] [animation:dropdownFadeIn_0.2s_cubic-bezier(0.16,1,0.3,1)]">
                    <div className="p-2">
                        {filteredOptions.length > 0 ? (
                            filteredOptions.map((option, idx) => (
                                <button
                                    key={idx}
                                    type="button"
                                    className="w-full py-3 px-4 text-left bg-none border-none rounded-lg text-[var(--fs-base)] text-[var(--color-text-primary)] cursor-pointer transition-all duration-[150ms] ease-linear hover:bg-[var(--color-brand-tint)] hover:text-[var(--color-brand-primary)]"
                                    onClick={() => handleSelectOption(option)}
                                >
                                    {option}
                                </button>
                            ))
                        ) : !showCreateOption && (
                            <div className="py-4 px-3 text-center text-[var(--color-text-secondary)] text-[var(--fs-sm)]">No matches found</div>
                        )}

                        {/* The "Create" action is now always visible or shows as a prompt when typing a new name */}
                        {(!inputValue.trim() || showCreateOption) && (
                            <button
                                type="button"
                                className="w-full py-[14px] px-4 text-left bg-[var(--color-surface)] border-none border-t border-t-[var(--color-border)] mt-2 rounded-lg text-[var(--fs-base)] text-[var(--color-brand-primary)] font-bold cursor-pointer transition-all duration-[150ms] ease-linear flex items-center hover:bg-[var(--color-brand-tint)]"
                                onClick={() => {
                                    const name = inputValue.trim() || 'New Batch';
                                    setInputValue(name);
                                    handleSelectOption(name);
                                }}
                            >
                                <span className="text-[1.4em] mr-3 inline-flex items-center justify-center w-6 h-6 bg-[var(--color-brand-primary)] text-white rounded-md font-normal">+</span>
                                <span>{inputValue.trim() ? `Create "${inputValue}"` : "Create new batch"}</span>
                            </button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
