import React from 'react';

interface ToggleProps {
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
}

export const Toggle: React.FC<ToggleProps> = ({
  checked = false,
  onChange,
  label,
  disabled,
}) => {
  return (
    <label
      className={`inline-flex items-center gap-3 cursor-pointer transition-opacity duration-200 ${disabled ? 'disabled' : ''}`}
    >
      <div className="relative w-11 h-6 flex-shrink-0">
        <input
          type="checkbox"
          className="opacity-0 w-0 h-0"
          checked={checked}
          onChange={e => onChange?.(e.target.checked)}
          disabled={disabled}
        />
        <span
          className={[
            'absolute cursor-pointer top-0 left-0 right-0 bottom-0 rounded-[34px] transition-[background-color] duration-300',
            checked
              ? 'bg-[var(--color-brand-primary)]'
              : 'bg-[var(--color-border)]',
            'before:absolute before:content-[""] before:h-[18px] before:w-[18px] before:left-[3px] before:bottom-[3px]',
            'before:bg-white before:rounded-full before:shadow-[0_2px_4px_rgba(0,0,0,0.1)] before:transition-transform before:duration-300',
            checked ? 'before:translate-x-5' : 'before:translate-x-0',
            'group-hover:shadow-[0_0_0_4px_rgba(0,0,0,0.05)]',
          ].join(' ')}
        />
      </div>
      {label && (
        <span className="text-[0.875rem] text-[var(--color-text-primary)] font-medium">
          {label}
        </span>
      )}
    </label>
  );
};
