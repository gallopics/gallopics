import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Photo } from '../types';
import { X, Check, Zap, ShoppingBag } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { ModernDropdown } from './ModernDropdown';
import { QUALITY_TIERS, getPriceByTierId } from '../constants/qualityTiers';

interface PhotoDetailProps {
    photo: Photo;
    onClose: () => void;
}

export const PhotoDetail: React.FC<PhotoDetailProps> = ({ photo, onClose }) => {
    const navigate = useNavigate();
    const { addToCart, removeFromCartByPhotoId, cart } = useCart();
    const [selectedQuality, setSelectedQuality] = useState('web');

    const qualityOptions = useMemo(() => QUALITY_TIERS.map(tier => ({
        label: tier.label,
        value: tier.id,
        subtext: tier.id === 'web' ? 'Landscape: 1080×720' : 'Landscape: 6000×4000',
        description: tier.description
    })), []);

    const currentPrice = getPriceByTierId(selectedQuality);

    const isInCart = cart.some(item => item.photoId === photo.id && item.quality === selectedQuality);

    const handleAddToCart = () => {
        const selected = qualityOptions.find(o => o.value === selectedQuality);
        if (selected) addToCart(photo, selectedQuality, selected.label, currentPrice);
    };

    const handleRemoveFromCart = () => {
        removeFromCartByPhotoId(photo.id);
    };

    // Prevent click bubbling to backdrop
    const handleContentClick = (e: React.MouseEvent) => {
        e.stopPropagation();
    };

    return (
        <div
            className="fixed top-0 left-0 w-full h-full bg-black/60 flex justify-center items-center z-[1000] backdrop-blur-[5px] p-5"
            onClick={onClose}
        >
            <div
                className="bg-[var(--color-surface)] rounded-[32px] w-full max-w-[1200px] h-[90vh] flex overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.2)] relative max-[900px]:flex-col max-[900px]:rounded-none max-[900px]:h-full max-[900px]:max-w-full"
                onClick={handleContentClick}
            >
                {/* Mobile close button */}
                <button
                    className="absolute top-5 left-5 z-10 bg-white/90 text-[var(--color-text-primary)] w-10 h-10 rounded-full hidden max-[900px]:flex items-center justify-center border-none shadow-[0_4px_12px_rgba(0,0,0,0.1)]"
                    onClick={onClose}
                >
                    <X size={24} />
                </button>

                {/* Media Section (Left) */}
                <div className="flex-1 bg-[var(--ui-bg-subtle)] flex items-center justify-center p-6 relative max-[900px]:flex-[0_0_50vh] max-[900px]:p-0 max-[900px]:bg-black">
                    <img
                        src={photo.src}
                        alt={`${photo.rider} - ${photo.horse}`}
                        className="max-w-full max-h-full object-contain rounded-lg shadow-[0_4px_20px_rgba(0,0,0,0.05)] max-[900px]:rounded-none"
                    />
                </div>

                {/* Sidebar Section (Right) */}
                <div className="w-[440px] bg-[var(--color-surface)] flex flex-col flex-shrink-0 border-l border-[var(--color-border)] max-[900px]:w-full max-[900px]:h-auto max-[900px]:border-l-0 max-[900px]:rounded-[24px_24px_0_0] max-[900px]:-mt-6 max-[900px]:overflow-visible max-[900px]:pb-10 max-[900px]:shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
                    {/* Header Actions */}
                    <div className="flex justify-end pt-5 px-6 max-[900px]:hidden">
                        <button
                            className="bg-none border-none text-[var(--color-text-secondary)] cursor-pointer p-2 rounded-full transition-all duration-200 hover:bg-[var(--ui-bg-subtle)] hover:text-[var(--color-text-primary)]"
                            onClick={onClose}
                        >
                            <X size={24} />
                        </button>
                    </div>

                    {/* Scrollable Content */}
                    <div className="flex-1 overflow-y-auto py-4 px-8 pb-8 flex flex-col gap-8">
                        {/* Product Card */}
                        <div className="border border-[var(--color-border)] rounded-[24px] p-6 bg-white">
                            <span className="block text-[0.75rem] font-semibold text-[var(--color-text-secondary)] tracking-[0.05em] mb-2">
                                #{photo.id.toUpperCase()}CAN5E
                            </span>
                            <h2 className="text-[2.25rem] font-extrabold text-[var(--color-text-primary)] m-0 mb-6 tracking-[-0.02em]">
                                {currentPrice} SEK
                            </h2>

                            <div className="mb-6">
                                <label className="block text-[0.875rem] font-semibold mb-2 text-[var(--color-text-primary)]">Select quality</label>
                                <ModernDropdown
                                    value={selectedQuality}
                                    options={qualityOptions}
                                    onChange={setSelectedQuality}
                                    label="Quality"
                                />
                            </div>

                            <div className="flex flex-col gap-3 mb-6">
                                <button className="btn-buy-now" onClick={() => {
                                    const selected = qualityOptions.find(o => o.value === selectedQuality);
                                    if (selected) addToCart(photo, selectedQuality, selected.label, currentPrice);
                                    navigate('/cart');
                                }}>
                                    Buy now
                                </button>
                                <button
                                    className={`btn-add-cart${isInCart ? ' added' : ''}`}
                                    onClick={isInCart ? handleRemoveFromCart : handleAddToCart}
                                >
                                    <Check size={18} className={isInCart ? '' : 'hidden'} />
                                    <ShoppingBag size={18} className={isInCart ? 'hidden' : ''} />
                                    {isInCart ? 'Added' : 'Add to cart'}
                                </button>
                            </div>

                            <div className="trust-line">
                                <div className="trust-item trust-payment">
                                    <Check size={14} />
                                    <span>Secure payment</span>
                                </div>
                                <div className="trust-item trust-download">
                                    <Zap size={14} />
                                    <span>Instant download</span>
                                </div>
                            </div>

                            <p className="purchase-footnote">
                                We'll send you a download link after payment (valid for 24 hours). Images are delivered as JPEG.
                            </p>

                            <button className="support-link">
                                Questions? Contact support
                            </button>
                        </div>

                        {/* Meta Section */}
                        <div className="pt-2">
                            <h3 className="text-[1.25rem] font-bold mb-4 text-[var(--color-text-primary)]">{photo.rider} on {photo.horse}</h3>
                            <div className="grid gap-4">
                                <div className="flex flex-col gap-0.5">
                                    <span className="text-[0.75rem] text-[var(--color-text-secondary)] uppercase tracking-[0.05em] font-semibold">Event</span>
                                    <span className="text-[1rem] font-medium text-[var(--color-text-primary)]">{photo.event}</span>
                                </div>
                                <div className="flex flex-col gap-0.5">
                                    <span className="text-[0.75rem] text-[var(--color-text-secondary)] uppercase tracking-[0.05em] font-semibold">Date</span>
                                    <span className="text-[1rem] font-medium text-[var(--color-text-primary)]">{photo.date}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
