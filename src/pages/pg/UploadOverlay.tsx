import React, { useRef, useState, useEffect } from 'react';
import { usePhotographer } from '../../context/PhotographerContext';
import { X, UploadCloud, Image as ImageIcon, CheckCircle, AlertCircle, Plus, ArrowRight } from 'lucide-react';
import { Button } from '../../components/Button';

// Safe Thumbnail Component
const FileThumbnail: React.FC<{ file: File }> = ({ file }) => {
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    useEffect(() => {
        if (!file) return;

        let objectUrl: string | null = null;
        try {
            objectUrl = URL.createObjectURL(file);
            setPreviewUrl(objectUrl);
        } catch (e) {
            console.error("Failed to create object URL", e);
        }

        return () => {
            if (objectUrl) URL.revokeObjectURL(objectUrl);
        };
    }, [file]);

    if (!previewUrl) return <ImageIcon size={20} color="var(--color-border)" />;

    return (
        <img
            src={previewUrl}
            alt="preview"
            className="w-full h-full object-cover"
        />
    );
};

export const UploadOverlay: React.FC = () => {
    const {
        isUploadOverlayOpen,
        currentUploadEventId,
        closeUploadOverlay,
        startUpload,
        uploadSessions,
        getEvent,
        clearUploadSession
    } = usePhotographer();

    const [isDragActive, setIsDragActive] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const event = currentUploadEventId ? getEvent(currentUploadEventId) : null;
    const session = currentUploadEventId ? uploadSessions[currentUploadEventId] : null;

    if (!isUploadOverlayOpen) return null;

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setIsDragActive(true);
        } else if (e.type === 'dragleave') {
            setIsDragActive(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragActive(false);

        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            handleFiles(Array.from(e.dataTransfer.files));
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            handleFiles(Array.from(e.target.files));
        }
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleFiles = (files: File[]) => {
        const validFiles = files.filter(f => f.type.startsWith('image/'));
        if (validFiles.length > 0) {
            // Start upload (appends to session)
            startUpload(validFiles);
        } else {
            alert('Please upload image files only.');
        }
    };

    // Derived State
    const files = session?.files || [];
    const completedUploads = files.filter(q => q.status === 'completed').length;
    const isBatchComplete = session?.status === 'completed' && files.length > 0;

    const handleClose = () => {
        // Just hide, state persists
        closeUploadOverlay();
    };

    const handleStartNewBatch = () => {
        // Clear session logic?
        // Or just let them drag more?
        // "Batch finishes: Keep overlay open and show... CTA: Upload another batch"
        // Usually implies clearing the success state or just waiting for new files.
        // If we just verify files, we append.
        // We can just explicitly reset if user wants "fresh start".
        // But "Upload another batch" usually means "Add more".
        if (currentUploadEventId) {
            // To "reset" UI visually but keep photos, we might want to clear session *files* from view?
            // Prompt: "Batch-by-batch UX (no page reset)... Batch 1 -> Batch 2".
            // If we keep appending, the list grows.
            // Maybe "Upload another batch" clears the *session list* (since photos are already in main list)?
            // Yes, clearUploadSession does that.
            if (confirm("Start new batch? This clears the upload history list (photos remain saved).")) {
                clearUploadSession(currentUploadEventId);
            }
        }
    };

    const handleViewPhotos = () => {
        closeUploadOverlay();
        // Route is already correct (/pg/events/:id).
        // Maybe trigger a refresh or filter change?
        // Context photos are updated, so List automatically shows new photos.
    };

    return (
        <div className="fixed top-0 left-0 w-screen h-screen z-[2000] bg-white flex flex-col animate-[slideUpFade_0.3s_cubic-bezier(0.16,1,0.3,1)]">
            <style>{`@keyframes slideUpFade { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }`}</style>
            {/* Header */}
            <div className="h-16 border-b border-[var(--color-border)] flex items-center justify-between px-6 flex-shrink-0">
                <div className="text-[1.1rem] font-semibold text-[var(--color-text-primary)] flex items-center gap-2">
                    Upload Photos
                    {event && <span className="font-normal text-[var(--color-text-secondary)] text-[0.875rem]"> to {event.title}</span>}
                </div>
                <Button variant="icon" onClick={handleClose} icon={<X size={24} />} />
            </div>

            {/* Body */}
            <div className="flex-1 flex overflow-hidden">

                {/* View: Batch Complete Success */}
                {isBatchComplete ? (
                    <div className="flex-1 flex flex-col items-center justify-center p-10 text-center animate-[fadeIn_0.3s_ease]">
                        <style>{`@keyframes fadeIn { from { opacity: 0; transform: scale(0.98); } to { opacity: 1; transform: scale(1); } }`}</style>
                        <div className="w-24 h-24 rounded-full bg-[rgba(16,185,129,0.1)] flex items-center justify-center mb-6">
                            <CheckCircle size={64} color="var(--color-success)" />
                        </div>
                        <h3 className="text-2xl font-bold text-[var(--color-text-primary)] mb-2">Batch Upload Complete!</h3>
                        <p className="text-[var(--color-text-secondary)] mb-8 text-base">{files.length} photos have been added to the event.</p>

                        <div className="flex gap-4">
                            <Button variant="secondary" onClick={handleStartNewBatch} icon={<Plus size={18} />}>
                                Upload another batch
                            </Button>
                            <Button
                                variant="primary"
                                className="!bg-[var(--color-text-primary)] !border-[var(--color-text-primary)] !text-white hover:!bg-[#000] hover:-translate-y-px hover:shadow-[0_4px_12px_rgba(0,0,0,0.15)]"
                                onClick={handleViewPhotos}
                            >
                                View Photos
                                <ArrowRight size={18} className="ml-2" />
                            </Button>
                        </div>
                    </div>
                ) : (
                    /* View: Drag & Drop + Queue */
                    <>
                        <div
                            className={`flex-1 border-r border-[var(--color-border)] flex items-center justify-center relative transition-colors duration-200 ${isDragActive ? 'bg-[rgba(27,58,236,0.05)]' : 'bg-[var(--color-bg)]'}`}
                            onDragEnter={handleDrag}
                            onDragLeave={handleDrag}
                            onDragOver={handleDrag}
                            onDrop={handleDrop}
                        >
                            <input
                                type="file"
                                multiple
                                accept="image/*"
                                ref={fileInputRef}
                                className="hidden"
                                onChange={handleFileSelect}
                            />

                            <div className={`text-center max-w-[400px] p-10 border-2 border-dashed rounded-2xl transition-all duration-200 ${isDragActive ? 'border-[var(--color-brand-primary)]' : 'border-[var(--color-border)]'}`}>
                                <UploadCloud size={48} className="text-[var(--color-text-secondary)] mb-4" />
                                <h3 className="text-xl font-semibold mb-2">Drag & drop photos here</h3>
                                <p className="text-[var(--color-text-secondary)] mb-6 text-[0.875rem] leading-relaxed">
                                    or <button className="pg-btn-links" onClick={() => fileInputRef.current?.click()}>browse files</button> from your computer
                                </p>
                            </div>
                        </div>

                        {/* Sidebar Queue */}
                        <div className="w-[360px] bg-white flex flex-col">
                            <div className="p-4 border-b border-[var(--color-border)] font-semibold text-[0.875rem] text-[var(--color-text-primary)]">
                                Queue ({completedUploads}/{files.length})
                            </div>
                            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
                                {files.length === 0 ? (
                                    <div className="text-center p-8 text-[var(--color-text-secondary)] text-[0.8125rem]">No active uploads</div>
                                ) : (
                                    files.map((item) => (
                                        <div key={item.id} className="flex gap-3 items-center bg-white border border-[var(--color-border)] p-2 rounded-[6px]">
                                            <div className="w-12 h-12 bg-[var(--ui-bg-subtle)] rounded-[4px] flex-shrink-0 flex items-center justify-center">
                                                <FileThumbnail file={item.file} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="text-[0.8125rem] font-medium truncate mb-1" title={item.file.name}>{item.file.name}</div>
                                                <div className="h-1 bg-[var(--color-border)] rounded-sm overflow-hidden">
                                                    <div
                                                        className={`h-full transition-[width] duration-300 ${item.status === 'completed' ? 'bg-[var(--color-success)]' : 'bg-[var(--color-brand-primary)]'}`}
                                                        style={{ width: `${item.progress}%` }}
                                                    />
                                                </div>
                                            </div>
                                            <div className="flex items-center justify-center w-8">
                                                {item.status === 'completed' ? (
                                                    <CheckCircle size={18} color="var(--color-success)" />
                                                ) : item.status === 'failed' ? (
                                                    <AlertCircle size={18} color="var(--color-danger)" />
                                                ) : (
                                                    <span className="text-[0.75rem] text-[var(--color-text-secondary)]">{item.progress}%</span>
                                                )}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* Footer (Hidden if Batch Complete, or just secondary actions) */}
            {!isBatchComplete && (
                <div className="h-16 border-t border-[var(--color-border)] flex items-center justify-end px-6 gap-3 bg-white">
                    <Button variant="secondary" onClick={handleClose}>
                        Minimize
                    </Button>
                </div>
            )}
        </div>
    );
};
