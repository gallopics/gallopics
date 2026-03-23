import React, { useState } from 'react';
import type { Photo } from '../types';
import { Share2, Plus, MoreVertical, Check, Pencil, Trash2, RotateCcw } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { WatermarkedThumbnail } from './WatermarkedThumbnail';
import { QUALITY_TIERS } from '../constants/qualityTiers';

interface PhotoCardProps {
    photo: Photo;
    onClick: (photo: Photo) => void;
    onAddToCart?: (photo: Photo) => void;
    variant?: 'default' | 'pgUpload' | 'pgDuplicate' | 'pgPublished' | 'pgArchived';
    // Extended props for pgUpload variant
    pgMeta?: {
        fileName?: string;
        photoCode?: string;
        uploadDate?: string;
        timestamp?: string;
        priceStandard?: number;
        priceHigh?: number;
        priceCommercial?: number;
        soldCount?: number;
        totalBucketSales?: number;
        // For pgDuplicate variant
        alsoIn?: string[]; // e.g. ["Uncategorised", "Day 1"]
        storedLocation?: string; // e.g. "Random"
    };
    // Duplicate actions
    onKeep?: () => void;
    onRemove?: () => void;
    // Group-level actions
    onManageDuplicate?: () => void;
    // New Actions
    onEdit?: (photo: Photo) => void;
    onPreview?: (photo: Photo) => void;
    onEditPrice?: (photo?: Photo) => void;
    // Sales-only control flags
    selectable?: boolean;
    showEdit?: boolean;
}

export const PhotoCard: React.FC<PhotoCardProps> = ({
    photo,
    onClick,
    onAddToCart,
    variant = 'default',
    pgMeta,
    onKeep,
    onRemove,
    onManageDuplicate,
    onEdit,
    onPreview,
    onEditPrice,
    selectable = true,
    showEdit = true
}) => {
    const [isLoaded, setIsLoaded] = useState(false);
    const [showMobileMenu, setShowMobileMenu] = useState(false);
    const [dupHover, setDupHover] = useState(false);
    const { addToCart, removeFromCartByPhotoId, isInCart } = useCart();

    const isAdded = isInCart(photo.id);

    // 1. Variant Configuration (Tokenizing variants)
    const config = {
        isPG: ['pgUpload', 'pgDuplicate', 'pgPublished', 'pgArchived'].includes(variant),
        showDots: ['pgUpload', 'pgPublished', 'pgArchived'].includes(variant),
        showDuplicateMeta: variant === 'pgDuplicate',
        actionIcon: variant === 'pgPublished' ? <RotateCcw size={18} /> : <Trash2 size={18} />,
        actionTitle: variant === 'pgPublished' ? "Unpublish photo" : "Delete photo",
        containerClass: [
            ['pgUpload', 'pgDuplicate', 'pgPublished', 'pgArchived'].includes(variant) ? 'variant-pg-upload' : '',
            variant === 'pgDuplicate' ? 'variant-pg-duplicate' : '',
            variant === 'pgPublished' ? 'variant-pg-published' : '',
            variant === 'pgArchived' ? 'variant-pg-published variant-pg-archived' : ''
        ].filter(Boolean).join(' ')
    };

    const toggleMobileMenu = (e: React.MouseEvent) => {
        e.stopPropagation();
        setShowMobileMenu(!showMobileMenu);
    };

    const handleToggleCart = (e: React.MouseEvent) => {
        e.stopPropagation();

        if (isAdded) {
            removeFromCartByPhotoId(photo.id);
        } else {
            // Default to high quality tier
            const tier = QUALITY_TIERS.find(t => t.id === 'high') || QUALITY_TIERS[1];
            addToCart(photo, tier.id, tier.label, tier.price);
        }

        if (!isAdded && onAddToCart) {
            onAddToCart(photo);
        }
        setShowMobileMenu(false);
    };

    // 2. Bottom Content Renderer
    const renderBottomContent = () => {
        if (!config.isPG) {
            return (
                <div className="card-content">
                    <div className="card-main-info">
                        <h3 className="rider-horse-title">{photo.rider}</h3>
                        <span className="horse-subtitle">{photo.horse}</span>
                    </div>

                    <div className="card-mobile-actions">
                        <button className="mobile-action-btn" onClick={toggleMobileMenu}>
                            <MoreVertical size={20} />
                        </button>

                        {showMobileMenu && (
                            <div className="mobile-menu-popup">
                                <button onClick={handleToggleCart} style={isAdded ? { color: 'var(--color-success)' } : {}}>
                                    {isAdded ? <><Check size={16} /> Added</> : <><Plus size={16} /> Add to Cart</>}
                                </button>
                                <button onClick={(e) => { e.stopPropagation(); setShowMobileMenu(false); }}>
                                    <Share2 size={16} /> Share
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            );
        }

        if (!pgMeta) return null;

        // Duplicates variant - shows "Stored in:"
        if (config.showDuplicateMeta) {
            return (
                <div className="card-content pg-upload-meta pg-duplicate-meta">
                    <div className="pg-meta-row pg-meta-filename flex justify-between items-center w-full gap-2">
                        <span className="flex-1 overflow-hidden text-ellipsis whitespace-nowrap">
                            {pgMeta.fileName || 'Untitled'}
                        </span>
                        {pgMeta.storedLocation && (
                            <span className="pg-meta-location-tag text-[0.625rem] text-[var(--color-text-secondary)] font-bold uppercase tracking-[0.02em] bg-[var(--ui-bg-subtle)] px-1.5 py-0.5 rounded shrink-0">
                                {pgMeta.storedLocation}
                            </span>
                        )}
                    </div>
                </div>
            );
        }

        // Uploads & Published show FileName + Bundle Dots + Sold Badge
        const web = pgMeta.priceStandard || 0;
        const high = pgMeta.priceHigh || 0;
        const commercial = (pgMeta as any).priceCommercial || 0;
        const soldCount = pgMeta.soldCount || 0;
        const totalBucketSales = pgMeta.totalBucketSales || 0;

        let activeBundle = 'custom';
        let bundleColor = 'var(--color-text-secondary)'; // default grey

        // Harmonized check: If prices match the canonical tiers (499/999/1500)
        if (web === 499 && high === 999 && commercial === 1500) {
            activeBundle = 'canonical';
            bundleColor = '#a855f7'; // purple — no token yet, intentional
        } else if (web > 0 || high > 0) {
            activeBundle = 'custom';
            bundleColor = 'var(--color-brand-primary)';
        }

        return (
            <div className="card-content pg-upload-meta">
                <div className="pg-meta-row flex justify-between items-center w-full">
                    <div className="pg-card-filename flex-1 overflow-hidden text-ellipsis whitespace-nowrap">
                        {pgMeta.fileName || 'Untitled'}
                    </div>

                    <div className="pg-meta-right-actions flex items-center gap-1.5 pl-2">
                        {/* Sold Count Badge (Prototype variant) */}
                        {soldCount > 0 && (
                            <div
                                className="pg-sold-badge"
                                title={`Sold: ${soldCount} · Total sales: ${totalBucketSales}`}
                            >
                                {soldCount}
                            </div>
                        )}

                        {/* Single Bundle Dot */}
                        {config.showDots && (
                            <div
                                className="bundle-dot-single w-2 h-2 rounded-full cursor-pointer"
                                onClick={(e) => { e.stopPropagation(); onEditPrice?.(photo); }}
                                title={`${activeBundle.charAt(0).toUpperCase() + activeBundle.slice(1)}: Web ${web} / High ${high} / Commercial ${commercial}`}
                                style={{ background: bundleColor }}
                            />
                        )}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className={`photo-card ${config.containerClass} ${selectable ? 'selectable' : ''}`} onClick={() => onClick(photo)} tabIndex={0}>
            <div className="card-image-wrapper" style={{ aspectRatio: `${photo.width}/${photo.height}` }} onClick={(e) => {
                if (onPreview) {
                    e.stopPropagation();
                    onPreview(photo);
                }
            }}>
                <WatermarkedThumbnail
                    src={photo.src}
                    alt={`${photo.rider} on ${photo.horse}`}
                    className={`card-image ${isLoaded ? 'loaded' : 'loading'}`}
                    onLoad={() => setIsLoaded(true)}
                    photographer={photo.photographer}
                />

                {/* Duplicate Badge / Manage */}
                {['default', 'pgUpload', 'pgPublished', 'pgArchived'].includes(variant) && photo.isDuplicate && (
                    <div
                        className="duplicate-badge cursor-pointer pointer-events-auto min-w-[60px] text-center transition-all z-30"
                        onMouseEnter={() => setDupHover(true)}
                        onMouseLeave={() => setDupHover(false)}
                        onClick={(e) => { e.stopPropagation(); onManageDuplicate?.(); }}
                    >
                        {dupHover ? "Manage" : "Duplicate"}
                    </div>
                )}

                {/* Hover Actions Overlay - Desktop (Public view only) */}
                {variant === 'default' && (
                    <div className="card-hover-overlay">
                        <div className="hover-actions-top"></div>

                        <div className="event-info-patch">
                            <div className="patch-row event-name">{photo.event}</div>
                            <div className="patch-row detail-text">
                                <span className="flag">🇸🇪</span> {photo.city} <span className="sep">•</span> {new Date(photo.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} {photo.time}
                            </div>
                        </div>
                        <div className="hover-actions-bottom">
                            <button className="icon-btn-glass" onClick={(e) => { e.stopPropagation(); }} title="Share">
                                <Share2 size={18} />
                            </button>
                            <button
                                className={`icon-btn-glass primary ${isAdded ? 'added' : ''}`}
                                onClick={handleToggleCart}
                                title={isAdded ? "Remove from cart" : "Add to cart"}
                            >
                                {isAdded ? <Check size={18} /> : <Plus size={18} />}
                            </button>
                        </div>
                    </div>
                )}

                {/* Edit & Delete/Unpublish Actions (Stacked Top-Right for PG) */}
                {(variant === 'pgUpload' || variant === 'pgPublished' || variant === 'pgArchived') && (
                    <div className="pg-card-actions">
                        {showEdit && (
                            <button className="icon-btn-glass" onClick={(e) => { e.stopPropagation(); onEdit?.(photo); }} title="Edit details">
                                <Pencil size={18} />
                            </button>
                        )}
                        <button
                            className="icon-btn-glass delete-action"
                            onClick={(e) => { e.stopPropagation(); onRemove?.(); }}
                            title={config.actionTitle}
                        >
                            {config.actionIcon}
                        </button>
                    </div>
                )}

                {/* Duplicate specific actions */}
                {variant === 'pgDuplicate' && (
                    <div className="pg-duplicate-actions">
                        <button
                            className="pg-dup-action-btn keep"
                            onClick={(e) => { e.stopPropagation(); onKeep?.(); }}
                        >
                            Keep
                        </button>
                        <button
                            className="pg-dup-action-btn remove"
                            onClick={(e) => { e.stopPropagation(); onRemove?.(); }}
                        >
                            Remove
                        </button>
                    </div>
                )}
            </div>

            {renderBottomContent()}
        </div>
    );
};
