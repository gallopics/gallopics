import React from 'react';

interface StatusPillProps {
    label: string;
    status?: 'neutral' | 'success' | 'warning' | 'error';
    className?: string;
}

const statusClasses: Record<string, string> = {
    neutral: 'bg-[var(--ui-bg-subtle)] text-[var(--color-text-secondary)]',
    success: 'bg-[var(--color-success-tint)] text-[var(--color-success)]',
    warning: 'bg-[var(--color-warning-tint)] text-[var(--color-warning)]',
    error: 'bg-[var(--color-danger-tint)] text-[var(--color-danger)]',
};

export const StatusPill: React.FC<StatusPillProps> = ({ label, status = 'neutral', className = '' }) => {
    return (
        <div
            className={[
                'px-6 py-3 rounded-[99px] text-base font-semibold',
                'inline-flex items-center justify-center whitespace-nowrap min-h-[48px]',
                statusClasses[status] || statusClasses.neutral,
                className,
            ].join(' ')}
        >
            {label}
        </div>
    );
};
