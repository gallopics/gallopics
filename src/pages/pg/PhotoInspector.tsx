import React, { useState, useEffect } from 'react';
import type { Photo } from '../../context/PhotographerContext';
import { usePhotographer } from '../../context/PhotographerContext';
import { X, Tag, Trash2, Clock } from 'lucide-react';

interface PhotoInspectorProps {
    selectedPhotos: Photo[];
    onClose: () => void;
}

export const PhotoInspector: React.FC<PhotoInspectorProps> = ({ selectedPhotos, onClose }) => {
    const { updatePhotoMetadata, deletePhotos } = usePhotographer();

    const [rider, setRider] = useState('');
    const [horse, setHorse] = useState('');

    // Update local state when selection changes
    useEffect(() => {
        if (selectedPhotos.length === 1) {
            setRider(selectedPhotos[0].rider || '');
            setHorse(selectedPhotos[0].horse || '');
        } else {
            // Bulk edit: leave empty or show 'Mixed' placeholder logic?
            // For MVP, leave empty to mean "enter new value to overwrite all",
            // or if we want to preserve, we might need a placeholder.
            // Let's use empty string as "no change yet".
            setRider('');
            setHorse('');
        }
    }, [selectedPhotos]);

    // Removed unused handleSave function

    const handleBlur = (field: 'rider' | 'horse', value: string) => {
        if (!value.trim()) return; // Don't clear if just focusing out empty?
        // Actually, clearing might be intended.
        // For MVP bulk edit: Only update if value is not empty?
        // Or if user explicitly cleared it?
        // Let's say: if value is non-empty, apply it to all.

        if (value.trim()) {
            const ids = selectedPhotos.map(p => p.id);
            updatePhotoMetadata(ids, { [field]: value });
        }
    };

    if (selectedPhotos.length === 0) return null;

    const count = selectedPhotos.length;
    const isSingle = count === 1;
    const firstPhoto = selectedPhotos[0];

    const inputClass = "w-full py-2 px-3 border border-[var(--color-border)] rounded-[6px] text-[0.875rem] transition-all duration-200 focus:outline-none focus:border-[var(--color-brand-primary)] focus:shadow-[0_0_0_3px_rgba(27,58,236,0.1)]";

    return (
        <div className="w-[320px] bg-[var(--color-surface)] border-l border-[var(--color-border)] flex flex-col sticky top-0 h-[calc(100vh-64px)] overflow-y-auto flex-shrink-0 animate-[slideLeft_0.2s_ease-out]">
            <style>{`@keyframes slideLeft { from { width: 0; opacity: 0; } to { width: 320px; opacity: 1; } }`}</style>
            <div className="p-4 border-b border-[var(--color-border)] flex justify-between items-center">
                <span className="text-[0.875rem] font-semibold text-[var(--color-text-primary)]">
                    {isSingle ? 'Photo Details' : `${count} photos selected`}
                </span>
                <button
                    className="bg-transparent border-none cursor-pointer text-[var(--color-text-secondary)] p-1 rounded-[4px] hover:bg-[var(--color-bg)] hover:text-[var(--color-text-primary)] transition-colors duration-200"
                    onClick={onClose}
                >
                    <X size={18} />
                </button>
            </div>

            {/* Thumbs Preview */}
            <div className="py-5 px-4 border-b border-[var(--color-bg)]">
                <div className="flex gap-2 overflow-x-auto pb-2 mb-4">
                    {selectedPhotos.slice(0, 4).map(p => (
                        <img key={p.id} src={p.url} className="w-12 h-12 rounded-[4px] object-cover border border-[var(--color-border)] flex-shrink-0" alt="" />
                    ))}
                    {count > 4 && (
                        <div className="w-12 h-12 rounded-[4px] border border-[var(--color-border)] flex-shrink-0 bg-[var(--ui-bg-subtle)] flex items-center justify-center text-xs text-[var(--color-text-secondary)] font-semibold">+{count - 4}</div>
                    )}
                </div>

                {isSingle && (
                    <div className="flex items-center gap-1.5 text-[0.75rem] text-[var(--color-text-secondary)] py-1">
                        <Clock size={14} /> {firstPhoto.timestamp || 'Unknown time'}
                        <span className="mx-1">•</span>
                        {firstPhoto.width} x {firstPhoto.height}px
                    </div>
                )}
            </div>

            {/* Metadata Fields */}
            <div className="py-5 px-4 border-b border-[var(--color-bg)]">
                <label className="text-[0.75rem] font-semibold text-[var(--color-text-secondary)] uppercase tracking-[0.02em] mb-2 block">Rider</label>
                <input
                    className={inputClass}
                    placeholder={isSingle ? "Enter rider name" : "Edit rider for all..."}
                    value={rider}
                    onChange={(e) => setRider(e.target.value)}
                    onBlur={(e) => handleBlur('rider', e.target.value)}
                />
            </div>

            <div className="py-5 px-4 border-b border-[var(--color-bg)]">
                <label className="text-[0.75rem] font-semibold text-[var(--color-text-secondary)] uppercase tracking-[0.02em] mb-2 block">Horse</label>
                <input
                    className={inputClass}
                    placeholder={isSingle ? "Enter horse name" : "Edit horse for all..."}
                    value={horse}
                    onChange={(e) => setHorse(e.target.value)}
                    onBlur={(e) => handleBlur('horse', e.target.value)}
                />
            </div>

            {/* Actions */}
            <div className="py-5 px-4 border-b border-[var(--color-bg)]">
                <label className="text-[0.75rem] font-semibold text-[var(--color-text-secondary)] uppercase tracking-[0.02em] mb-2 block">Actions</label>
                <div className="flex flex-col gap-2 mt-3">
                    <button className="w-full p-2 rounded-[6px] text-[0.875rem] font-medium cursor-pointer border border-[var(--color-border)] bg-white text-[var(--color-text-primary)] transition-all duration-200 text-left flex items-center gap-2 hover:bg-[var(--ui-bg-subtle)] hover:border-[var(--color-border)]">
                        <Tag size={16} />
                        Manage Tags
                    </button>
                    {/*
                    <button className="...">
                        <Calendar size={16} />
                        Edit Date/Time
                    </button>
                    */}
                    <button
                        className="w-full p-2 rounded-[6px] text-[0.875rem] font-medium cursor-pointer border border-[var(--color-danger-border)] bg-[var(--color-danger-tint)] text-[var(--color-danger)] transition-all duration-200 text-left flex items-center gap-2 hover:bg-[var(--color-danger-tint)]"
                        onClick={() => deletePhotos(selectedPhotos.map(p => p.id))}
                    >
                        <Trash2 size={16} />
                        Delete {count > 1 ? `(${count})` : 'Photo'}
                    </button>
                </div>
            </div>
        </div>
    );
};
