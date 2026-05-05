import React from 'react';
import { Image as ImageIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { PgEvent } from '../../../context/PhotographerContext';
import { useWorkspace } from '../../../context/WorkspaceContext';

interface PgEventCardProps {
  event: PgEvent;
  onCoverChange: (eventId: string) => void;
  onEdit?: (event: PgEvent) => void;
  onCancelBooking?: (event: PgEvent, e: React.MouseEvent) => void;
  fromTab?: string;
  eventProfilePath?: string;
  eventProfileState?: unknown;
  hideLogo?: boolean;
}

export const PgEventCard: React.FC<PgEventCardProps> = ({
  event,
  onCoverChange,
  onCancelBooking,
  fromTab,
  eventProfilePath,
  eventProfileState,
  hideLogo = false,
}) => {
  const { basePath } = useWorkspace();
  const navigate = useNavigate();
  const hasCover = !!event.coverImage;
  const eventTargetPath = eventProfilePath ?? `${basePath}/events/${event.id}`;
  const eventTargetState = eventProfileState ?? { fromTab: fromTab ?? 'my' };

  return (
    <div
      className="relative flex flex-col cursor-pointer transition-[translate,box-shadow] duration-300 ease-[cubic-bezier(0.2,0,0.2,1)] mt-4 hover:-translate-y-1 group"
      onClick={() =>
        navigate(eventTargetPath, {
          state: eventTargetState,
        })
      }
    >
      {/* Folder Tab pseudo-element simulation */}
      <div className="absolute -top-3 left-0 w-[110px] h-[13px] bg-[var(--color-brand-tint)] rounded-[96px_144px_0_0] border border-black/[0.08] border-b-0 z-0 transition-all duration-300" />

      <div className="bg-white rounded-[0_24px_24px_24px] overflow-hidden flex flex-col border border-black/[0.04] shadow-[0_4px_16px_rgba(0,0,0,0.06)] p-4 transition-all duration-300 group-hover:shadow-[0_12px_32px_rgba(0,0,0,0.10)]">
        {/* 1. Cover Area */}
        <div className="w-full aspect-video overflow-hidden relative rounded-xl bg-[var(--ui-bg-subtle)]">
          <img
            src={
              event.coverImage ||
              'https://images.unsplash.com/photo-1551884831-bbf3cdc6469e?auto=format&fit=crop&q=80&w=800'
            }
            alt={event.title}
            className={`w-full h-full object-cover will-change-transform transition-[scale] duration-500 ease-[cubic-bezier(0.2,0,0.2,1)] group-hover:scale-[1.04] ${
              !hasCover ? 'grayscale opacity-10' : ''
            }`}
          />

          {!hasCover && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <span className="text-[0.8125rem] font-medium text-[var(--color-text-secondary)]">
                Add cover photo
              </span>
            </div>
          )}

          {/* Edit Overlay (Top-Right Circle) */}
          <div className="absolute top-3 right-3 z-30 opacity-0 -translate-y-1 transition-[translate,opacity] duration-[250ms] ease-in-out pointer-events-none group-hover:opacity-100 group-hover:translate-y-0">
            <button
              className={`w-9 h-9 rounded-full bg-white/95 text-[var(--color-text-primary)] flex items-center justify-center border-none cursor-pointer shadow-[0_1px_2px_rgba(0,0,0,0.05)] pointer-events-auto transition-[scale,background-color,box-shadow] duration-200 ease-in-out hover:scale-[1.05] hover:text-black hover:shadow-[0_4px_12px_rgba(0,0,0,0.1)] ${
                !hasCover
                  ? '!opacity-30 cursor-default bg-[rgba(243,244,246,0.8)] text-[var(--color-text-secondary)] !shadow-none hover:!scale-100'
                  : ''
              }`}
              onClick={e => {
                e.stopPropagation();
                if (hasCover) onCoverChange(event.id);
              }}
              title={hasCover ? 'Change cover image' : 'No cover to edit'}
              disabled={!hasCover}
            >
              <ImageIcon size={16} />
            </button>
          </div>
        </div>

        {/* 2. Info Area (Avatar + Title/Date) */}
        <div className="pt-4 flex flex-col">
          <div className="flex items-center gap-4 mb-4">
            {!hideLogo && (
              <div className="w-[52px] h-[52px] rounded-xl overflow-hidden bg-white border border-black/[0.06] flex-shrink-0">
                <img
                  src={event.logo}
                  alt=""
                  className="w-full h-full object-contain p-0.5"
                />
              </div>
            )}
            <div className="flex flex-col justify-center flex-1">
              <div className="flex items-center gap-1 mb-0.5">
                <span className="text-[0.75rem] leading-none">🇸🇪</span>
                <span className="text-[0.75rem] font-semibold text-[var(--color-text-secondary)] uppercase tracking-[0.02em] leading-[1.5]">
                  {event.city}
                </span>
              </div>
              <h3 className="text-[0.8125rem] font-bold text-[var(--color-text-primary)] my-1 leading-[1.5]">
                {event.title}
              </h3>
              <span className="text-[0.75rem] text-[var(--color-text-secondary)] mt-0.5 leading-[1.5]">
                {event.dateRange}
              </span>
            </div>

            {/* More Action with Separator */}
            {/* <div className="relative flex items-center ml-auto">
              <div className="w-px h-6 bg-[var(--dropdown-divider-color)] mx-3" />
              <button
                className={`w-8 h-8 flex items-center justify-center rounded-full border bg-white cursor-pointer transition-all duration-200 p-0 outline-none
                                    ${
                                      isMenuOpen
                                        ? 'bg-[var(--dropdown-item-hover-bg)] text-[var(--color-text-primary)] border-[var(--color-border)]'
                                        : 'border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-[var(--dropdown-item-hover-bg)] hover:text-[var(--color-text-primary)] hover:border-[var(--color-border)]'
                                    }`}
                onClick={e => {
                  e.stopPropagation();
                  setIsMenuOpen(!isMenuOpen);
                }}
              >
                <MoreHorizontal size={16} />
              </button>

              {isMenuOpen && (
                <div
                  className="dropdown-menu absolute top-[calc(100%+8px)] right-0 w-max min-w-[180px] z-[1000]"
                  onClick={e => e.stopPropagation()}
                >
                  <button
                    className="dropdown-item"
                    onClick={() => {
                      setIsMenuOpen(false);
                      navigate(eventTargetPath, {
                        state: eventTargetState,
                      });
                    }}
                  >
                    <ImageIcon size={14} />
                    Manage photos
                  </button>
                  <button
                    className="dropdown-item"
                    onClick={() => {
                      setIsMenuOpen(false);
                      onEdit?.(event);
                    }}
                  >
                    <Edit2 size={14} />
                    Edit Event
                  </button>
                </div>
              )}
            </div> */}
          </div>

          <div className="h-px bg-[var(--ui-bg-subtle)] w-full mb-4" />

          {/* 3. Footer row (Stats only) */}
          <div className="flex justify-between items-center gap-3">
            {onCancelBooking && (
              <button
                className="px-3.5 py-1.5 rounded-lg border border-[var(--color-danger-border)] bg-[var(--color-danger-tint)] text-[var(--color-danger)] text-[0.75rem] font-semibold cursor-pointer transition-colors hover:bg-white"
                onClick={e => onCancelBooking(event, e)}
              >
                Cancel booking
              </button>
            )}
            <div className="flex items-center gap-2">
              {/* <div className="inline-flex flex-col items-start justify-center gap-0 px-3.5 py-1.5 rounded-lg bg-[var(--ui-bg-subtle)] text-[var(--color-text-secondary)] text-[0.75rem] font-semibold whitespace-nowrap text-left">
                <span className="text-[0.625rem] font-semibold leading-[1.2] opacity-80">
                  Published
                </span>
                <span className="text-[0.8125rem] font-bold leading-[1.2]">
                  {event.publishedCount ?? 0}
                </span>
              </div> */}
              {/* <div className="inline-flex flex-col items-start justify-center gap-0 px-3.5 py-1.5 rounded-lg bg-[var(--color-success-tint)] text-[var(--color-success)] text-[0.75rem] font-semibold whitespace-nowrap text-left">
                <span className="text-[0.625rem] font-semibold leading-[1.2] opacity-80">
                  Sales
                </span>
                <span className="text-[0.8125rem] font-bold leading-[1.2]">
                  {event.soldCount ?? 0}/{event.photosCount ?? 40}
                </span>
              </div> */}
              {/* <div className="inline-flex flex-col items-start justify-center gap-0 px-3.5 py-1.5 rounded-lg bg-[var(--color-revenue-bg)] text-[var(--color-revenue-text)] text-[0.75rem] font-semibold whitespace-nowrap text-left">
                <span className="text-[0.625rem] font-semibold leading-[1.2] opacity-80">
                  Earnngs
                </span>
                <span className="text-[0.8125rem] font-bold leading-[1.2] text-[var(--color-revenue-value)]">
                  SEK{' '}
                  {((event.soldCount ?? 0) * 450)
                    .toLocaleString()
                    .replace(/,/g, ' ')}
                </span>
              </div> */}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
