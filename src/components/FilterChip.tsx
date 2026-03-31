import React from 'react';

interface FilterChipProps {
  label: string | React.ReactNode;
  isActive?: boolean;
  onClick: () => void;
  badge?: number;
  className?: string;
  /** New: variant for PG Uploads filter chips with count badge */
  variant?: 'default' | 'filterCount';
  /** Count to display as badge (used with filterCount variant) */
  count?: number;
  /** Whether chip is disabled (used when count is 0) */
  disabled?: boolean;
  /** New: accent color for the chip */
  accent?: 'red';
}

export const FilterChip: React.FC<FilterChipProps> = ({
  label,
  isActive = false,
  onClick,
  badge,
  className = '',
  variant = 'default',
  count,
  disabled = false,
  accent,
}) => {
  // For filterCount variant, disable if count is 0
  const isDisabled = disabled || (variant === 'filterCount' && count === 0);

  const handleClick = () => {
    if (!isDisabled) {
      onClick();
    }
  };

  if (variant === 'filterCount') {
    // Determine badge classes
    const badgeClasses = [
      'inline-flex items-center justify-center min-w-[20px] h-5 px-[6px] rounded-[10px]',
      'text-[0.6875rem] font-semibold transition-all duration-200 ease-in-out',
      'border border-[var(--color-border)]',
      isActive
        ? 'bg-[rgba(255,255,255,0.2)] text-white border-[rgba(255,255,255,0.3)]'
        : accent === 'red'
          ? 'bg-[var(--color-danger)] text-white border-[var(--color-danger)]'
          : 'bg-[var(--ui-bg-subtle)] text-[var(--color-text-secondary)] border-[var(--color-border)]',
    ].join(' ');

    // Chip classes for filterCount
    const chipClasses = [
      'inline-flex items-center gap-[6px] px-[14px] py-[6px] pr-[10px]',
      'rounded-[999px] border cursor-pointer transition-all duration-200 ease-in-out whitespace-nowrap',
      // Active state
      isActive
        ? 'bg-[var(--color-brand-primary)] border-[var(--color-brand-primary)]'
        : accent === 'red'
          ? 'border-[var(--color-danger-tint)] bg-[var(--color-danger-tint)]'
          : 'bg-white border-[var(--color-border)]',
      // Disabled
      isDisabled ? 'cursor-not-allowed opacity-50 pointer-events-none' : '',
      className,
    ].join(' ');

    const labelClasses = [
      'text-[0.8125rem] font-medium',
      isActive
        ? 'text-white'
        : isDisabled
          ? 'text-[var(--color-text-secondary)]'
          : accent === 'red'
            ? 'text-[var(--color-danger)]'
            : 'text-[var(--color-text-secondary)]',
    ].join(' ');

    return (
      <button
        className={chipClasses}
        onClick={handleClick}
        type="button"
        disabled={isDisabled}
      >
        <span className={labelClasses}>{label}</span>
        <span className={badgeClasses}>{count ?? 0}</span>
      </button>
    );
  }

  // Default variant
  const defaultChipClasses = [
    'inline-flex items-center gap-2 px-4 py-2 rounded-[999px]',
    'border border-[var(--color-border)] cursor-pointer transition-all duration-200 ease-in-out whitespace-nowrap',
    'text-[0.875rem] font-medium',
    isActive
      ? 'bg-[var(--color-text-primary)] text-white border-[var(--color-text-primary)]'
      : [
          'bg-[var(--color-surface)] text-[var(--color-text-secondary)]',
          'hover:bg-[var(--ui-bg-subtle)] hover:border-[var(--color-border)] hover:text-[var(--color-text-primary)]',
        ].join(' '),
    className,
  ].join(' ');

  return (
    <button className={defaultChipClasses} onClick={onClick} type="button">
      {label}
      {badge !== undefined && badge > 0 && (
        <span
          className={[
            'flex items-center justify-center px-[6px] h-[18px] rounded-[9px]',
            'text-[0.75rem] font-semibold leading-none',
            'bg-[var(--color-danger)] text-white',
          ].join(' ')}
        >
          {badge}
        </span>
      )}
    </button>
  );
};
