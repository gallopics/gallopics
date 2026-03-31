import React, { useState, useMemo, useEffect } from 'react';
import { X, Check } from 'lucide-react';
import { usePhotographer } from '../context/PhotographerContext';
import { ModernDropdown } from './ModernDropdown';

interface ManageHighlightsModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialIds: string[];
  onSave: (ids: string[]) => void;
}

export const ManageHighlightsModal: React.FC<ManageHighlightsModalProps> = ({
  isOpen,
  onClose,
  initialIds,
  onSave,
}) => {
  const { events, getPhotosByEvent } = usePhotographer();

  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    new Set(initialIds),
  );
  const [activeEventId, setActiveEventId] = useState<string>(
    events.filter(e => e.isRegistered)[0]?.id || '',
  );
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setSelectedIds(new Set(initialIds.slice(0, 10)));
      const firstMyEvent = events.find(e => e.isRegistered);
      if (firstMyEvent) setActiveEventId(firstMyEvent.id);
    }
  }, [isOpen, initialIds, events]);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const myEvents = useMemo(() => events.filter(e => e.isRegistered), [events]);
  const currentPhotos = useMemo(
    () => (activeEventId ? getPhotosByEvent(activeEventId) : []),
    [activeEventId, getPhotosByEvent],
  );

  const eventOptions = myEvents.map(e => ({
    label: `${e.title} (${e.date})`,
    value: e.id,
  }));

  const handleToggle = (photoId: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(photoId)) {
      newSet.delete(photoId);
    } else {
      if (newSet.size >= 10) {
        setToast('Maximum 10 highlights allowed.');
        return;
      }
      newSet.add(photoId);
    }
    setSelectedIds(newSet);
  };

  const handleSave = () => {
    onSave(Array.from(selectedIds));
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="auth-modal-overlay" onClick={onClose}>
      <div
        className="edit-profile-modal-container modal-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="modal-header-standard">
          <h3 className="modal-title">Manage highlights</h3>
          <button className="modal-close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-body-standard">
          {/* Event Selector */}
          <div className="mb-5 flex items-center gap-3">
            <label className="text-[var(--modal-label-size)] font-[var(--modal-label-weight)] text-[var(--color-text-secondary)] whitespace-nowrap">
              Select from event:
            </label>
            <div className="min-w-[260px]">
              <ModernDropdown
                value={activeEventId}
                options={eventOptions}
                onChange={setActiveEventId}
                placeholder="Select event..."
                showSearch
                searchPlaceholder="Search events..."
              />
            </div>
          </div>

          {/* Stats */}
          <div className="text-[var(--modal-label-size)] text-[var(--color-text-secondary)] mb-4 flex justify-between items-center">
            <div>
              Selected:{' '}
              <span
                className={
                  selectedIds.size >= 10
                    ? 'text-[var(--color-danger)] font-semibold'
                    : 'font-medium'
                }
              >
                {selectedIds.size} / 10
              </span>
            </div>
            {selectedIds.size > 0 && (
              <button
                onClick={() => setSelectedIds(new Set())}
                className="bg-none border-none text-[var(--color-danger)] text-[var(--modal-label-size)] font-medium cursor-pointer px-2 py-1 rounded-[4px] transition-[background] duration-200 hover:bg-[var(--color-danger-tint)]"
              >
                Clear all
              </button>
            )}
          </div>

          {/* Grid */}
          <div className="grid [grid-template-columns:repeat(auto-fill,minmax(140px,1fr))] gap-3">
            {currentPhotos.length === 0 ? (
              <div className="[grid-column:1/-1] text-center py-10 text-[var(--color-text-secondary)]">
                No photos in this event.
              </div>
            ) : (
              currentPhotos.map(photo => {
                const isSelected = selectedIds.has(photo.id);
                return (
                  <div
                    key={photo.id}
                    className="group aspect-square rounded-xl overflow-hidden relative cursor-pointer bg-[var(--ui-bg-subtle)] select-none"
                    style={
                      isSelected
                        ? {
                            boxShadow: '0 0 0 2.5px var(--color-brand-primary)',
                          }
                        : undefined
                    }
                    onClick={() => handleToggle(photo.id)}
                  >
                    <img
                      src={photo.url}
                      alt=""
                      loading="lazy"
                      className={`w-full h-full object-cover transition-[transform,filter] duration-200 ${isSelected ? 'scale-100 brightness-90' : 'group-hover:scale-105'}`}
                    />

                    {/* Selected tint */}
                    {isSelected && (
                      <div className="absolute inset-0 bg-[var(--color-brand-tint)] pointer-events-none" />
                    )}

                    {/* Checkbox top-left */}
                    <div
                      className={`absolute top-2 left-2 z-10 transition-opacity duration-150 ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
                    >
                      <div
                        className={`w-[22px] h-[22px] rounded-[5px] border-2 flex items-center justify-center backdrop-blur-sm transition-all duration-150 ${isSelected ? 'bg-[var(--color-brand-primary)] border-[var(--color-brand-primary)]' : 'bg-white/90 border-white/60'}`}
                      >
                        {isSelected && (
                          <Check size={13} color="white" strokeWidth={3} />
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="modal-footer-actions">
          <button className="edit-profile-btn-cancel" onClick={onClose}>
            Cancel
          </button>
          <button className="edit-profile-btn-save" onClick={handleSave}>
            Save changes
          </button>
        </div>

        {/* Toast */}
        {toast && (
          <div className="absolute bottom-20 left-0 right-0 flex justify-center pointer-events-none z-[100]">
            <div className="bg-[var(--color-text-primary)] text-white px-5 py-2.5 rounded-[var(--radius-full)] text-[var(--modal-label-size)] font-medium shadow-[var(--modal-shadow)]">
              {toast}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
