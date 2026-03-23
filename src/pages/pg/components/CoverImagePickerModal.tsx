import React, { useState, useMemo } from 'react';
import { X, Check, Upload } from 'lucide-react';
import { usePhotographer } from '../../../context/PhotographerContext';
import { Button } from '../../../components/Button';

interface CoverImagePickerModalProps {
    isOpen: boolean;
    onClose: () => void;
    eventId: string;
    onSelect: (photoUrl: string) => void;
}

export const CoverImagePickerModal: React.FC<CoverImagePickerModalProps> = ({
    isOpen,
    onClose,
    eventId,
    onSelect
}) => {
    const { getPhotosByEvent } = usePhotographer();
    const [selectedUrl, setSelectedUrl] = useState<string | null>(null);

    const photos = useMemo(() => eventId ? getPhotosByEvent(eventId).filter(p => p.status === 'published') : [], [eventId, getPhotosByEvent]);

    const handleSave = () => {
        if (selectedUrl) {
            onSelect(selectedUrl);
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[2000]">
            <div className="bg-white w-[90%] max-w-[800px] max-h-[85vh] rounded-2xl flex flex-col shadow-[0_20px_60px_rgba(0,0,0,0.2)] animate-[modalFadeIn_0.2s_ease-out]">
                <div className="px-6 py-5 border-b border-[var(--color-border)] flex justify-between items-center">
                    <h3 className="m-0 text-[1.1rem] font-semibold">Select event cover</h3>
                    <button className="bg-none border-none cursor-pointer text-[var(--color-text-secondary)] p-1 rounded-full hover:bg-[var(--ui-bg-subtle)] hover:text-[var(--color-text-primary)]" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto flex-1">
                    <div className="mb-6">
                        <Button
                            variant="secondary"
                            className="w-full h-20 border-dashed flex-col gap-2"
                            onClick={() => {
                                // Mock file picker
                                alert('Browsing computer for image...');
                            }}
                        >
                            <Upload size={20} />
                            <span>Upload from computer</span>
                        </Button>
                    </div>

                    <div className="text-[0.8125rem] text-[var(--color-text-secondary)] mb-3">
                        <span>Choose from published photos</span>
                    </div>

                    <div className="grid [grid-template-columns:repeat(auto-fill,minmax(140px,1fr))] gap-3">
                        {photos.length === 0 ? (
                            <div className="[grid-column:1/-1] text-center py-10 text-[var(--color-text-secondary)]">No published photos found for this event.</div>
                        ) : (
                            photos.map(photo => {
                                const isSelected = selectedUrl === photo.url;
                                return (
                                    <div
                                        key={photo.id}
                                        className={`aspect-square rounded-lg overflow-hidden relative cursor-pointer bg-[var(--ui-bg-subtle)] ${isSelected ? 'shadow-[inset_0_0_0_3px_var(--color-brand-primary)]' : ''}`}
                                        onClick={() => setSelectedUrl(photo.url)}
                                    >
                                        <div className="w-full h-full">
                                            <img
                                                src={photo.url}
                                                alt=""
                                                loading="lazy"
                                                className={`w-full h-full object-cover transition-[scale] duration-200 ${isSelected ? 'scale-100 opacity-90' : 'hover:scale-105'}`}
                                            />
                                        </div>
                                        {isSelected && (
                                            <div className="absolute top-2 right-2 z-[2]">
                                                <div className="w-6 h-6 bg-[var(--color-brand-primary)] rounded-full flex items-center justify-center shadow-[0_2px_4px_rgba(0,0,0,0.2)]">
                                                    <Check size={14} color="#fff" strokeWidth={3} />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

                <div className="px-6 py-4 border-t border-[var(--color-border)] flex justify-end gap-3">
                    <Button variant="secondary" onClick={onClose}>Cancel</Button>
                    <Button variant="primary" onClick={handleSave} disabled={!selectedUrl}>Set as cover</Button>
                </div>
            </div>
        </div>
    );
};
