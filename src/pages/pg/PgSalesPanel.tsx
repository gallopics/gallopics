import React from 'react';
import { X, Clock, DollarSign, Calendar, MapPin, User, Hash } from 'lucide-react';
import { type Photo } from '../../context/PhotographerContext';

interface PgSalesPanelProps {
    isOpen: boolean;
    selectedIds: Set<string>;
    allPhotos: Photo[];
    onClose: () => void;
}

export const PgSalesPanel: React.FC<PgSalesPanelProps> = ({
    isOpen,
    selectedIds,
    allPhotos,
    onClose
}) => {
    const selectedPhotos = allPhotos.filter(p => selectedIds.has(p.id));
    const isSingle = selectedPhotos.length === 1;
    const count = selectedPhotos.length;
    const firstPhoto = selectedPhotos[0];

    if (!isOpen) return null;

    return (
        <div className={`pg-selection-panel ${isOpen ? 'is-open' : ''}`}>
            <div className="pg-panel-header">
                <span className="pg-panel-title">Sale details</span>
                <button className="pg-panel-close" onClick={onClose} title="Close">
                    <X size={20} />
                </button>
            </div>

            <div className="pg-panel-scroll-area">
                {!isSingle && count > 0 && (
                    <div className="pg-panel-section">
                        <div className="pg-panel-label mb-4">Multiple selection ({count})</div>
                        <div className="text-center p-6 bg-[var(--color-bg)] rounded-[var(--radius-md)] border border-dashed border-[var(--color-border)]">
                            <p className="text-secondary text-sm">Details for multiple items will appear here.</p>
                        </div>
                    </div>
                )}

                {isSingle && firstPhoto && (
                    <>
                        <div className="pg-panel-meta-block">
                            <img src={firstPhoto.url} alt="" className="pg-panel-thumb" />
                            <div className="pg-meta-info">
                                <div className="pg-meta-filename" title={firstPhoto.fileName}>{firstPhoto.fileName}</div>
                                <div className="pg-meta-id">{firstPhoto.photoCode || firstPhoto.id}</div>
                                <div className="pg-meta-date">
                                    <Clock size={14} />
                                    <span>{firstPhoto.uploadDate} • {firstPhoto.timestamp}</span>
                                </div>
                            </div>
                        </div>

                        <div className="pg-panel-section">
                            <div className="pg-panel-label">Sale Info</div>
                            <div className="pg-sale-info-box">
                                <div className="flex items-center gap-2">
                                    <div className="flex-center flex-shrink-0 pg-sale-info-icon">
                                        <DollarSign size={20} />
                                    </div>
                                    <div>
                                        <div className="text-sm font-semibold text-success">Sold {firstPhoto.soldCount} time{firstPhoto.soldCount > 1 ? 's' : ''}</div>
                                        <div className="text-xs pg-sale-info-sub">Last purchased: Yesterday</div>
                                    </div>
                                </div>
                            </div>

                            <div className="pg-panel-label">Details</div>
                            <div className="flex-col-gap-sm">
                                <div className="info-row">
                                    <User size={16} />
                                    <span>Rider: <b>{firstPhoto.rider || 'None'}</b></span>
                                </div>
                                <div className="info-row">
                                    <Hash size={16} />
                                    <span>Horse: <b>{firstPhoto.horse || 'None'}</b></span>
                                </div>
                                <div className="info-row">
                                    <Calendar size={16} />
                                    <span>Event: <b>{firstPhoto.eventId}</b></span>
                                </div>
                                <div className="info-row">
                                    <MapPin size={16} />
                                    <span>Location: <b>{firstPhoto.storedLocation || 'Main Arena'}</b></span>
                                </div>
                            </div>
                        </div>
                    </>
                )}

                {count === 0 && (
                    <div className="text-center text-tertiary py-[80px] px-[var(--spacing-lg)]">
                        <p>Select a photo to view details</p>
                    </div>
                )}
            </div>
        </div>
    );
};
