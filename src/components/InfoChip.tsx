import React from 'react';
import { ProfileAvatar } from './ProfileAvatar';

interface InfoChipProps {
  label: string;
  name: string;
  avatarUrl?: string; // Optional, can fallback
  variant?: 'rider' | 'horse' | 'photographer'; // New: Context-aware styling
  onClick?: () => void;
  className?: string;
  icon?: React.ReactNode; // Leave for flex, but mostly automated now
}

export const InfoChip: React.FC<InfoChipProps> = ({
  label,
  name,
  avatarUrl,
  variant,
  onClick,
  className = '',
}) => {
  return (
    <div
      className={[
        'flex items-center gap-3 py-[6px] pr-4 pl-2 rounded-full',
        'bg-[var(--ui-bg-subtle)] border border-[var(--color-border)]',
        'transition-all duration-200 ease-[cubic-bezier(0.2,0,0,1)]',
        'no-underline',
        onClick
          ? 'cursor-pointer hover:-translate-y-px hover:shadow-[0_4px_8px_rgba(0,0,0,0.04)] hover:bg-[var(--brand-tint-hover)] hover:border-[var(--brand-border-hover)] [&:hover_.chip-name-text]:underline'
          : '',
        variant ? `variant-${variant}` : '',
        className,
      ].join(' ')}
      onClick={onClick}
    >
      <ProfileAvatar
        variant={variant}
        url={avatarUrl}
        name={name}
        size={34}
        className="flex-shrink-0"
      />
      <div className="flex flex-col">
        <span className="text-[9px] text-[var(--color-text-secondary)] uppercase tracking-[0.5px] font-medium leading-[1.2]">
          {label}
        </span>
        <span className="chip-name-text text-[0.875rem] font-semibold text-[var(--color-text-primary)] leading-[1.2]">
          {name}
        </span>
      </div>
    </div>
  );
};
