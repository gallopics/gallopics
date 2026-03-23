import React from 'react';
import type { Photo as PgPhoto } from '../../context/PhotographerContext';
import { PhotoCard } from '../../components/PhotoCard';
import { Check } from 'lucide-react';
import type { Photo as UiPhoto } from '../../types';

interface PgPhotoCardProps {
    photo: PgPhoto;
    isSelected: boolean;
    onToggleSelect: (photo: PgPhoto, multiSelect: boolean) => void;
}

const StatusBadge = ({ photo }: { photo: PgPhoto }) => {
    if (photo.soldCount > 0) {
        return (
            <div className={`absolute top-[10px] right-[10px] px-2 py-1 rounded-[var(--radius-sm)] text-[0.75rem] font-bold uppercase backdrop-blur-sm z-[45] pointer-events-none tracking-[0.02em] text-white bg-[var(--color-success)]`}>
                Sold {photo.soldCount > 1 ? `×${photo.soldCount}` : ''}
            </div>
        );
    }
    if (photo.status === 'processing') return (
        <div className="absolute top-[10px] right-[10px] px-2 py-1 rounded-[var(--radius-sm)] text-[0.75rem] font-bold uppercase backdrop-blur-sm z-[45] pointer-events-none tracking-[0.02em] text-white bg-[var(--color-warning)]">
            Processing
        </div>
    );
    if (photo.status === 'needsReview') return (
        <div className="absolute top-[10px] right-[10px] px-2 py-1 rounded-[var(--radius-sm)] text-[0.75rem] font-bold uppercase backdrop-blur-sm z-[45] pointer-events-none tracking-[0.02em] text-white bg-[var(--color-danger)]">
            Review
        </div>
    );
    return null; // Published is default
};

export const PgPhotoCard: React.FC<PgPhotoCardProps> = ({
    photo,
    isSelected,
    onToggleSelect
}) => {

    // Map Context Photo to UI Photo (for shared component)
    const uiPhoto: UiPhoto = {
        id: photo.id,
        src: photo.url,
        rider: photo.rider || 'Unknown',
        horse: photo.horse || 'Unknown',
        event: 'Event', // Placeholder or fetch if needed
        eventId: photo.eventId,
        date: new Date().toISOString(), // Mock
        time: photo.timestamp || '12:00',
        city: 'Location',
        countryCode: 'SE',
        width: photo.width,
        height: photo.height,
        className: 'pg-item',
        arena: 'Arena 1'
    };

    const handleWrapperClick = (e: React.MouseEvent) => {
        // Intercept click for selection logic
        // We use the wrapper to handle the click so we can access the event (Shift/Meta keys)
        // which PhotoCard's onClick prop might not expose fully if strictly reused.
        onToggleSelect(photo, e.shiftKey || e.metaKey || e.ctrlKey);
    };

    return (
        <div
            className="group relative w-full cursor-pointer select-none rounded-[var(--radius-md)] transition-all duration-200 [&_.hover-actions-bottom]:!hidden [&_.card-mobile-actions]:!hidden [&_.event-info-patch]:!hidden"
            style={isSelected ? { boxShadow: '0 0 0 2px var(--color-brand-primary)', zIndex: 5 } : undefined}
            onClick={handleWrapperClick}
        >
            {/* Selected tint overlay */}
            {isSelected && (
                <div className="absolute inset-0 bg-[var(--color-brand-tint)] rounded-[var(--radius-md)] z-10 pointer-events-none" />
            )}

            <PhotoCard
                photo={uiPhoto}
                onClick={() => { }} /* No-op, wrapper handles click */
            />

            {/* Checkbox — hidden by default, visible on hover or when selected */}
            <div className={`absolute top-[10px] left-[10px] z-50 transition-opacity duration-150 ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                <div className={`w-[22px] h-[22px] rounded-[5px] border-2 flex items-center justify-center backdrop-blur-sm transition-all duration-150 ${isSelected ? 'bg-[var(--color-brand-primary)] border-[var(--color-brand-primary)]' : 'bg-white/90 border-white/60'}`}>
                    {isSelected && <Check size={13} color="white" strokeWidth={3} />}
                </div>
            </div>

            {/* Status Badge (Top Right) */}
            <StatusBadge photo={photo} />

            {/* Selection Border (if needed, usually handled by wrapper style) */}
        </div>
    );
};
