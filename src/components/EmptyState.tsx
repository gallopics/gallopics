import React from 'react';

interface EmptyStateProps {
    onClearFilters: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ onClearFilters }) => {
    return (
        <div className="container flex justify-center items-center py-[var(--spacing-xl)] min-h-[400px]">
            <div className="text-center max-w-[400px]">
                <h3 className="text-[var(--fs-xl)] font-[var(--fw-semibold)] mb-[var(--spacing-sm)] text-[var(--color-text-primary)]">
                    No photos found
                </h3>
                <p className="text-[var(--color-text-secondary)] mb-[var(--spacing-lg)] text-[var(--fs-base)]">
                    Try adjusting your filters or search terms.
                </p>
                <button
                    className="bg-[var(--color-text-primary)] text-[var(--color-surface)] px-6 py-3 rounded-[var(--radius-full)] font-[var(--fw-medium)] transition-opacity duration-200 hover:opacity-90"
                    onClick={onClearFilters}
                >
                    Clear all filters
                </button>
            </div>
        </div>
    );
};
