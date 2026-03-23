import React from 'react';
import { useNavigate } from 'react-router-dom';
import type { EventData } from '../data/mockEvents';

interface FolderEventCardProps {
    event: EventData;
    onClick: (id: string) => void;
    forceDisabled?: boolean; // New prop to force disabled state
}

export const FolderEventCard: React.FC<FolderEventCardProps> = ({ event, onClick, forceDisabled }) => {
    const navigate = useNavigate();

    const isDisabled = forceDisabled || event.status === 'disabled';

    // Live Logic: Check if today is within event.period
    const isLive = (() => {
        try {
            const todayMock = new Date('2026-01-21T00:00:00');
            const currentYear = todayMock.getFullYear();
            const parts = event.period.split('–').map(s => s.trim());

            let start, end;
            if (parts.length === 2) {
                let startStr = parts[0];
                let endStr = parts[1];
                if (!startStr.match(/\d{4}/)) startStr += ` ${currentYear}`;
                if (!endStr.match(/\d{4}/)) endStr += ` ${currentYear}`;

                start = new Date(startStr);
                end = new Date(endStr);
            } else {
                let dateStr = parts[0];
                if (!dateStr.match(/\d{4}/)) dateStr += ` ${currentYear}`;
                start = new Date(dateStr);
                end = new Date(dateStr);
            }

            // Normalize times
            const TODAY = new Date(todayMock);
            TODAY.setHours(0, 0, 0, 0);
            start.setHours(0, 0, 0, 0);
            end.setHours(23, 59, 59, 999);

            return TODAY.getTime() >= start.getTime() && TODAY.getTime() <= end.getTime();
        } catch {
            return false;
        }
    })();


    return (
        <div
            className={`relative flex flex-col overflow-visible cursor-pointer mt-4 transition-[translate] duration-300 ease-[ease] before:content-[''] before:absolute before:top-[-12px] before:left-0 before:w-[120px] before:h-[12.5px] before:bg-[var(--brand-badge-bg)] before:rounded-[96px_144px_0_0] before:border before:border-[rgba(27,58,236,0.15)] before:border-b-0 before:z-0 before:transition-[background-color,border-color] before:duration-[600ms] before:ease-out hover:before:bg-[rgba(27,58,236,0.5)] hover:before:border-[rgba(27,58,236,0.5)] hover:-translate-y-1 max-md:hover:translate-y-0 group ${isDisabled ? 'disabled opacity-60 cursor-not-allowed grayscale' : ''}`}
            onClick={() => !isDisabled && onClick(event.id)}
            tabIndex={isDisabled ? -1 : 0}
            title={isDisabled ? "Not available" : ""}
        >
            <div className="bg-white rounded-[0_24px_24px_24px] overflow-hidden flex flex-col border border-black/[0.04] shadow-[0_4px_16px_rgba(0,0,0,0.06)] p-3 [transform:translate3d(0,0,0)] transition-[border-color,box-shadow] duration-[600ms] ease-out group-hover:shadow-[0_12px_32px_rgba(0,0,0,0.10)] group-hover:border-[rgba(27,58,236,0.2)]">
                {/* Cover Area inside padding - Hide if disabled */}
                {!isDisabled && (
                    <div className="w-full aspect-[16/9] overflow-hidden relative rounded-xl">
                        <img
                            src={event.coverImage}
                            alt={event.name}
                            className="w-full h-full object-cover transition-[scale] duration-[600ms] ease-[ease] group-hover:scale-[1.05]"
                            loading="lazy"
                        />
                        {isLive && (
                            <span className="live-badge absolute top-[10px] right-[10px] bg-[#FF0000] text-white px-2 py-1 rounded-[4px] text-[10px] font-bold uppercase z-10">
                                Live
                            </span>
                        )}
                    </div>
                )}

                {/* Info Panel */}
                <div className={`flex flex-col gap-1 ${isDisabled ? 'pt-0' : 'pt-4'}`}>
                    {/* Header Block: Avatar + (Title/Period) */}
                    <div className="flex items-center gap-3 mb-1">
                        <img src={event.logo} alt="" className="w-[42px] h-[42px] rounded-xl object-contain bg-[var(--ui-bg-subtle)] flex-shrink-0 border border-[var(--color-border)] p-0.5" />

                        <div className="flex flex-col gap-0.5">
                            <h3 className="text-[0.8125rem] font-semibold text-[var(--color-text-primary)] leading-[1.25]">{event.name}</h3>
                            <span className="text-[0.75rem] text-[var(--color-text-secondary)] mb-0 block">{event.period}</span>
                            {isDisabled && <span className="text-[10px] uppercase text-[var(--color-text-secondary)] block">Not available yet</span>}
                        </div>
                    </div>

                    {/* Bottom Row: Location + Count + Avatar */}
                    <div className="flex justify-between items-center border-t border-[var(--color-border)] pt-3 mt-2">
                        <div className="flex items-center gap-2 text-[0.75rem] text-[var(--color-text-primary)] font-medium">
                            <span className="flag">{event.flag}</span>
                            <span className="city">{event.city}</span>
                        </div>

                        <div className="flex items-center gap-2">
                            {!isDisabled && event.photoCount && (
                                <span className="text-[0.75rem] text-[var(--color-text-secondary)]">{event.photoCount} photos</span>
                            )}
                            {/* Photographer Avatar */}
                            {event.photographer && (
                                <img
                                    src={event.photographer.avatar}
                                    alt={event.photographer.name}
                                    className="w-7 h-7 rounded-full object-cover border border-white shadow-[0_1px_3px_rgba(0,0,0,0.1)] cursor-pointer"
                                    title={`Photo: ${event.photographer.name}`}
                                    onClick={(e) => {
                                        if (!event.photographer) return;
                                        e.stopPropagation();
                                        navigate(`/photographer/${event.photographer.id}`);
                                    }}
                                    onError={(e) => {
                                        if (event.photographer) {
                                            (e.target as HTMLImageElement).src = 'https://ui-avatars.com/api/?name=' + event.photographer.name;
                                        }
                                    }}
                                />
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
