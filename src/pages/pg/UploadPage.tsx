import React, { useRef, useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { usePhotographer } from '../../context/PhotographerContext';
import {
  UploadCloud,
  CheckCircle,
  X,
  AlertCircle,
  Trash2,
} from 'lucide-react';
import { useWorkspace } from '../../context/WorkspaceContext';

export const UploadPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const {
    events,
    startUpload,
    uploadSessions,
    clearUploadSession,
    removeUploadFile,
    setCurrentUploadEventId,
  } = usePhotographer();
  const { basePath } = useWorkspace();

  // Local State
  const urlEventId = searchParams.get('eventId');
  const urlClassId = searchParams.get('classId');
  const urlClassName = searchParams.get('className');
  const urlArenaName = searchParams.get('arenaName');
  const [selectedEventId, setSelectedEventId] = useState<string>(
    urlEventId || '',
  );
  const [selectedBatch] = useState<string>(urlClassName || 'Random');
  const [isDragActive, setIsDragActive] = useState(false);
  const [confirmClearOpen, setConfirmClearOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initial Event Selection Logic
  useEffect(() => {
    if (!selectedEventId && events.length > 0) {
      const sorted = [...events].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
      );
      const defaultEvent = sorted[0];
      if (defaultEvent) setSelectedEventId(defaultEvent.id);
    }
  }, [events, selectedEventId]);

  // Sync Context whenever selectedEventId changes
  useEffect(() => {
    if (selectedEventId) {
      setSearchParams(
        currentParams => {
          const nextParams = new URLSearchParams(currentParams);
          nextParams.set('eventId', selectedEventId);
          return nextParams;
        },
        { replace: true },
      );
      setCurrentUploadEventId(selectedEventId);
    }
  }, [selectedEventId, setSearchParams, setCurrentUploadEventId]);

  // Derived Data
  const session = selectedEventId ? uploadSessions[selectedEventId] : null;
  const files = session?.files || [];
  const hasFiles = files.length > 0;

  const selectedEventTitle =
    events.find(event => event.id === selectedEventId)?.title ||
    'Selected event';

  // Handlers
  const handleClose = () => {
    const from = searchParams.get('from');
    const urlEventId = searchParams.get('eventId');

    if (from === 'event' && urlEventId) {
      // Explicitly go back to the event we came from
      navigate(`${basePath}/events/${urlEventId}`);
    } else if (from === 'eventProfile' && urlEventId) {
      navigate(`/event/${urlEventId}`, {
        state: { from: '/pg/events', fromTab: 'my' },
      });
    } else if (from === 'sidebar') {
      // Usually means we came from "anywhere", so events list is a safe home
      navigate(`${basePath}/events`);
    } else if (window.history.length > 1) {
      // General fallback: standard back button behavior
      navigate(-1);
    } else {
      // Emergency fallback: events list
      navigate(`${basePath}/events`);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setIsDragActive(true);
    else if (e.type === 'dragleave') setIsDragActive(false);
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

  const handleFiles = (newFiles: File[]) => {
    const validFiles = newFiles.filter(f => f.type.startsWith('image/'));

    if (validFiles.length === 0) {
      alert('Please upload image files only.');
      return;
    }

    const MAX_FILES_PER_UPLOAD = 20;
    let filesToUpload = validFiles;

    if (validFiles.length > MAX_FILES_PER_UPLOAD) {
      filesToUpload = validFiles.slice(0, MAX_FILES_PER_UPLOAD);
      alert(
        `You can upload up to ${MAX_FILES_PER_UPLOAD} photos at a time. We'll use the first ${MAX_FILES_PER_UPLOAD} files from your selection.`,
      );
    }

    // Pass the selected batch as classId metadata
    startUpload(filesToUpload, {
      classId: urlClassId || selectedBatch || undefined,
    });
  };

  const handleClearAll = () => {
    if (selectedEventId && hasFiles) {
      setConfirmClearOpen(true);
    }
  };

  const handleConfirmClear = () => {
    if (selectedEventId) {
      clearUploadSession(selectedEventId);
      setConfirmClearOpen(false);
    }
  };

  const handleViewPhotos = () =>
    selectedEventId && navigate(`${basePath}/events/${selectedEventId}`);

  return (
    <div className="pg-upload-page">
      {/* Header */}
      <header className="pg-upload-header">
        <div className="pg-upload-title">Upload photos</div>
        <button
          className="pg-upload-close"
          onClick={handleClose}
          aria-label="Close upload"
        >
          <X size={20} />
        </button>
      </header>

      <div className="pg-upload-container">
        {/* Sidebar - Configuration & Drop Zone */}
        <aside className="pg-upload-main">
          <div className="pg-upload-card">
            <div className="pg-upload-eyebrow">Event Details</div>

            {urlClassName && (
              <div className="pg-class-upload-context">
                <div className="pg-class-upload-label">Class upload</div>
                <div className="pg-class-upload-name">{urlClassName}</div>
                <div className="pg-class-upload-meta">
                  {selectedEventTitle}
                  {urlArenaName ? ` • ${urlArenaName}` : ''}
                </div>
              </div>
            )}

          </div>

          {/* Sidebar Drop Zone */}
          <div className="pg-upload-card sidebar-dropzone-wrapper">
            <div className="pg-upload-eyebrow">Add Photos</div>
            <div
              className={`pg-drop-zone sidebar-variant ${isDragActive ? 'is-dragging' : ''}`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                type="file"
                multiple
                accept="image/*"
                ref={fileInputRef}
                className="hidden"
                onChange={handleFileSelect}
              />
              <div className="drop-content-wrapper">
                <div className="drop-icon-circle">
                  <UploadCloud size={24} />
                </div>
                <div className="drop-title-sm">Click or Drag photos</div>
                <div className="drop-footer-note">
                  Maximum 20 photos per upload
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Stage - Queue Grid Only */}
        <main className="pg-upload-stage">
          <div className="pg-stage-scroll-area">
            {hasFiles ? (
              <div className="pg-upload-queue-column">
                <div className="queue-list">
                  {files.map(item => (
                    <div key={item.id} className="queue-item">
                      <div className="queue-thumb">
                        <img
                          src={URL.createObjectURL(item.file)}
                          alt={item.file.name}
                        />
                      </div>
                      <div className="queue-info">
                        <div className="queue-filename">{item.file.name}</div>
                        <div className="queue-progress">
                          <div
                            className="queue-bar"
                            style={{ width: `${item.progress}%` }}
                          />
                        </div>
                      </div>
                      {item.status === 'completed' && (
                        <div className="queue-check-wrapper">
                          <CheckCircle size={20} className="queue-check" />
                        </div>
                      )}

                      <button
                        className="queue-delete-btn"
                        onClick={e => {
                          e.stopPropagation();
                          if (selectedEventId)
                            removeUploadFile(selectedEventId, item.id);
                        }}
                        title="Remove photo"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="pg-queue-empty-state">
                <div className="empty-icon-wrapper">
                  <UploadCloud size={48} />
                </div>
                <h3>Your queue is empty</h3>
                <p>
                  Select an event and batch, then drag photos into the sidebar
                  to start uploading.
                </p>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Floating Action Pill */}
      {hasFiles && (
        <div className="pg-upload-bottom-bar-wrapper">
          <div className="pg-upload-bottom-bar">
            <div className="pg-upload-bottom-left">
              <span className="pg-upload-bottom-label">
                {files.length} Item{files.length === 1 ? '' : 's'}
              </span>
            </div>
            <div className="pg-upload-bottom-actions">
              <button className="pg-upload-clear-btn" onClick={handleClearAll}>
                Clear all
              </button>
              <button className="pg-upload-done-btn" onClick={handleViewPhotos}>
                Done
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Clear Confirmation Modal */}
      {confirmClearOpen && (
        <div className="pg-modal-overlay">
          <div className="pg-modal-card">
            <div className="flex gap-4 items-start">
              <div className="pg-alert-icon danger">
                <AlertCircle size={24} />
              </div>
              <div className="flex-1">
                <h3 className="mt-0 text-[1.125rem] font-bold mb-2 text-primary">
                  Clear all items?
                </h3>
                <p className="mb-6 text-[0.875rem] leading-[1.5] text-secondary">
                  This will remove all photos from the current queue. This
                  action cannot be undone.
                </p>
                <div className="modal-footer-actions">
                  <button
                    className="modal-btn-cancel"
                    onClick={() => setConfirmClearOpen(false)}
                  >
                    Cancel
                  </button>
                  <button
                    className="modal-btn-danger"
                    onClick={handleConfirmClear}
                  >
                    Clear All
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
