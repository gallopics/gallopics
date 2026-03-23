import { useMemo, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Header } from '../components/Header';
import { Breadcrumbs } from '../components/Breadcrumbs';
import type { BreadcrumbItem } from '../components/Breadcrumbs';
import { Footer } from '../components/Footer';
import { ModernDropdown } from '../components/ModernDropdown';
import { InfoChip } from '../components/InfoChip';
import { photos as mockPhotos, COMPETITIONS, PHOTOGRAPHERS, RIDERS, HORSES } from '../data/mockData';
import { Share2, ChevronLeft, ChevronRight, ShoppingBag, Check, Zap, X } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { CheckoutPanel } from '../components/CheckoutPanel';
import { WatermarkedPhotoPreview } from '../components/WatermarkedPhotoPreview';
import { ContactSupportModal } from '../components/ContactSupportModal';

import { QUALITY_TIERS, getPriceByTierId } from '../constants/qualityTiers';

const getPrice = (quality: string) => getPriceByTierId(quality);

export function ImageProfile() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [selectedQuality, setSelectedQuality] = useState('web');
    const { cart, addToCart, removeFromCartByPhotoId } = useCart();
    const [showCheckout, setShowCheckout] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [isFullScreen, setIsFullScreen] = useState(false);
    const [isSupportModalOpen, setIsSupportModalOpen] = useState(false);
    const [toast, setToast] = useState<{ message: string; action?: { label: string; onClick: () => void } } | null>(null);

    const from = searchParams.get('from');
    const eventIdParam = searchParams.get('eventId');

    const photo = useMemo(() => mockPhotos.find(p => p.id === id) || mockPhotos[0], [id, mockPhotos]);
    const event = useMemo(() => COMPETITIONS.find(c => c.id === photo.eventId), [photo.eventId]);
    const photographer = useMemo(() => {
        const p = PHOTOGRAPHERS.find(pg => pg.primaryEventId === photo.eventId) || PHOTOGRAPHERS[0];
        return p;
    }, [photo.eventId]);

    // Prevent body scroll when full screen is active
    useEffect(() => {
        if (isFullScreen) {
            document.body.style.overflow = 'hidden';
            document.body.style.touchAction = 'none';
        } else {
            document.body.style.overflow = '';
            document.body.style.touchAction = '';
        }
        return () => {
            document.body.style.overflow = '';
            document.body.style.touchAction = '';
        };
    }, [isFullScreen]);

    // Handle Escape key
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isFullScreen) {
                setIsFullScreen(false);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isFullScreen]);

    const [detectedPortrait, setDetectedPortrait] = useState<boolean>(photo.height > photo.width);

    // Sync orientation when photo changes
    useEffect(() => {
        setDetectedPortrait(photo.height > photo.width);
    }, [photo.id, photo.height, photo.width]);

    // Check if current selection is in cart
    const isInCart = useMemo(() => {
        return cart.some(item => item.photoId === photo.id && item.quality === selectedQuality);
    }, [cart, photo.id, selectedQuality]);

    // Track recently viewed
    useEffect(() => {
        if (!photo.id) return;
        const saved = localStorage.getItem('gallopics_recent');
        let recent: string[] = saved ? JSON.parse(saved) : [];

        // Move current to front, limit to 8
        recent = [photo.id, ...recent.filter(i => i !== photo.id)].slice(0, 8);
        localStorage.setItem('gallopics_recent', JSON.stringify(recent));
    }, [photo.id]);

    // Auto-hide toast
    useEffect(() => {
        if (toast) {
            const timer = setTimeout(() => setToast(null), 3000);
            return () => clearTimeout(timer);
        }
    }, [toast]);

    const breadcrumbs = useMemo<BreadcrumbItem[]>(() => {
        const items: BreadcrumbItem[] = [];

        if (from === 'epro' && eventIdParam) {
            items.push({ label: photo.event, onClick: () => navigate(`/event/${eventIdParam}`) });
        } else if (from === 'ppro') {
            items.push({ label: 'Back to photos', onClick: () => navigate(-1) });
        } else if (from === 'cart') {
            items.push({ label: 'Cart', onClick: () => navigate(-1) });
        } else {
            items.push({ label: 'Events', onClick: () => navigate('/') });
        }

        if (showCheckout) {
            items.push({ label: 'Photo detail', onClick: () => setShowCheckout(false) });
            items.push({ label: isSuccess ? 'Confirmation' : 'Checkout', active: true });
        } else {
            items.push({ label: 'Photo detail', active: true });
        }

        return items;
    }, [from, eventIdParam, photo, navigate, showCheckout, isSuccess]);

    // Quality Selector Options
    const qualityOptions = useMemo(() => {
        return QUALITY_TIERS.map(tier => ({
            label: tier.label,
            value: tier.id,
            subtext: tier.id === 'web'
                ? (detectedPortrait ? 'Portrait: 720×1080' : 'Landscape: 1080×720')
                : (tier.id === 'high' || tier.id === 'commercial'
                    ? (detectedPortrait ? 'Portrait: 4000×6000' : 'Landscape: 6000×4000')
                    : ''),
            description: tier.description
        }));
    }, [detectedPortrait]);

    return (
        <div className="page-wrapper overflow-x-hidden max-md:relative max-md:w-full max-md:max-w-[100vw]">
            <Header />

            <Breadcrumbs items={breadcrumbs} />

            <main className="pt-[var(--spacing-lg)] pb-[60px] max-md:pt-3 max-md:pb-10">
                <div className="container">
                    <div className="flex gap-6 items-start max-lg:flex-col">
                        {/* Left: Photo Viewer Card */}
                        <div className="flex-1 min-w-0">
                            <div className="bg-white rounded-[var(--radius-lg)] overflow-hidden shadow-[var(--shadow-sm)] border border-[var(--color-border)] max-md:rounded-[12px] max-md:w-full max-md:max-w-full max-md:box-border">
                                <div
                                    className="w-full bg-[var(--ui-bg-subtle)] min-h-[400px] max-md:min-h-0 max-md:p-4 max-md:box-border max-md:w-full max-md:flex max-md:justify-center flex items-center justify-center aspect-[3/2] cursor-zoom-in"
                                    onClick={() => setIsFullScreen(true)}
                                >
                                    <WatermarkedPhotoPreview
                                        src={photo.src}
                                        alt={photo.rider}
                                        onLoad={(e) => {
                                            const img = e.currentTarget;
                                            setDetectedPortrait(img.naturalHeight > img.naturalWidth);
                                        }}
                                        photographer={`${photographer.firstName} ${photographer.lastName}`}
                                    />
                                </div>

                                <div className="px-6 py-4 max-md:px-4 max-md:py-4 flex flex-row items-start justify-between gap-3 border-t border-black/[0.05] box-border w-full max-md:flex-row">
                                    <div className="flex items-start gap-2 flex-1 min-w-0 flex-wrap max-md:flex-1 max-md:flex max-md:flex-wrap max-md:items-start max-md:gap-2 max-md:p-0 max-md:m-0 max-md:min-w-0">
                                        <InfoChip
                                            label="Rider"
                                            name={photo.rider}
                                            variant="rider"
                                            onClick={() => {
                                                const riderData = RIDERS.find(r => `${r.firstName} ${r.lastName}` === photo.rider);
                                                const rId = riderData ? riderData.id : 'r1';
                                                navigate(`/rider/${rId}?from=photo&photoId=${photo.id}`);
                                            }}
                                        />

                                        <InfoChip
                                            label="Horse"
                                            name={photo.horse}
                                            variant="horse"
                                            onClick={() => {
                                                const horseData = HORSES.find(h => h.name === photo.horse);
                                                const hId = horseData ? horseData.id : 'h1';
                                                navigate(`/horse/${hId}?from=photo&photoId=${photo.id}`);
                                            }}
                                        />

                                        <InfoChip
                                            label="Photographer"
                                            name={`${photographer.firstName} ${photographer.lastName}`}
                                            variant="photographer"
                                            avatarUrl={`/images/${photographer.firstName} ${photographer.lastName}.jpg`}
                                            onClick={() => navigate(`/photographer/${photographer.id}?from=ipro&eventId=${photo.eventId}`)}
                                        />
                                    </div>

                                    <div className="flex items-center gap-3 max-md:flex-shrink-0 max-md:flex max-md:items-center max-md:mt-1">
                                        <div className="flex gap-1 max-md:hidden">
                                            <button className="w-9 h-9 rounded-full flex items-center justify-center text-[var(--color-text-secondary)] transition-[background] duration-200 hover:bg-[var(--ui-bg-subtle)] hover:text-[var(--color-text-primary)]" aria-label="Previous photo">
                                                <ChevronLeft size={20} />
                                            </button>
                                            <button className="w-9 h-9 rounded-full flex items-center justify-center text-[var(--color-text-secondary)] transition-[background] duration-200 hover:bg-[var(--ui-bg-subtle)] hover:text-[var(--color-text-primary)]" aria-label="Next photo">
                                                <ChevronRight size={20} />
                                            </button>
                                        </div>
                                        <div className="w-px h-6 bg-[var(--color-border)] max-md:hidden"></div>
                                        <button
                                            className="w-10 h-10 max-md:w-11 max-md:h-11 max-md:border max-md:border-[var(--color-border)] max-md:bg-white rounded-full flex items-center justify-center text-[var(--color-text-secondary)] transition-[background] duration-200 hover:bg-[var(--ui-bg-subtle)] hover:text-[var(--color-text-primary)]"
                                            onClick={() => alert('Coiped link!')}
                                        >
                                            <Share2 size={20} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Right: Purchase and Details Panel */}
                        <div className="w-[360px] flex-shrink-0 flex flex-col gap-4 sticky top-[100px] max-lg:w-full max-lg:static">
                            <div className="bg-white rounded-[var(--radius-md)] border border-[var(--color-border)] p-6 max-md:p-5 max-md:box-border max-md:w-full shadow-[var(--shadow-sm)] purchase-card">
                                {!showCheckout ? (
                                    <>
                                        <div className="flex justify-between mb-2">
                                            <span className="text-[0.75rem] text-[var(--color-text-secondary)] font-medium">#{photo.id.toUpperCase()}</span>
                                        </div>
                                        <div className="text-[2rem] font-bold text-[var(--color-text-primary)] mb-6">{getPrice(selectedQuality)} SEK</div>

                                        <div className="ipro-form">
                                            <div className="w-full">
                                                <label className="block text-[0.8125rem] text-[var(--color-text-secondary)] mb-2 font-medium">Select quality</label>
                                                <div className="w-full">
                                                    <ModernDropdown
                                                        value={selectedQuality}
                                                        options={qualityOptions}
                                                        onChange={setSelectedQuality}
                                                        label="Quality"
                                                    />
                                                </div>
                                            </div>

                                            <div className="mt-6 flex flex-col gap-3">
                                                <button
                                                    className="btn-buy-now"
                                                    onClick={() => setShowCheckout(true)}
                                                >
                                                    Buy now
                                                </button>
                                                <button
                                                    className={`btn-add-cart${isInCart ? ' added' : ''}`}
                                                    onClick={() => {
                                                        if (isInCart) {
                                                            removeFromCartByPhotoId(photo.id);
                                                            return;
                                                        }
                                                        const selected = qualityOptions.find(o => o.value === selectedQuality);
                                                        if (selected) {
                                                            addToCart(photo, selectedQuality, selected.label, getPrice(selectedQuality));
                                                        }
                                                    }}
                                                >
                                                    {isInCart ? (
                                                        <>
                                                            <Check size={18} />
                                                            Added
                                                        </>
                                                    ) : (
                                                        <>
                                                            <ShoppingBag size={20} />
                                                            Add to cart
                                                        </>
                                                    )}
                                                </button>
                                            </div>

                                            <div className="mt-5 pt-5 border-t border-[var(--ui-bg-subtle)] flex items-center justify-center gap-6">
                                                <div className="flex items-center gap-[6px] text-[0.75rem] text-[var(--color-success)] font-medium">
                                                    <Check size={14} className="trust-icon" />
                                                    <span>Secure payment</span>
                                                </div>
                                                <div className="flex items-center gap-[6px] text-[0.75rem] text-[#6366F1] font-medium">
                                                    <Zap size={14} className="trust-icon" />
                                                    <span>Instant download</span>
                                                </div>
                                            </div>

                                            <div className="mt-4 text-[0.75rem] text-[var(--color-text-secondary)] leading-[1.4]">
                                                We'll send you a download link after payment (valid for 24 hours). Images are delivered as JPEG.
                                            </div>

                                            <button
                                                className="support-link"
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    setIsSupportModalOpen(true);
                                                }}
                                            >
                                                Questions? Contact support
                                            </button>
                                        </div>
                                    </>
                                ) : (
                                    <div className="checkout-mode">
                                        <button className="flex items-center gap-[6px] text-[var(--color-text-secondary)] mb-4 text-[0.875rem] hover:text-[var(--color-text-primary)]" onClick={() => setShowCheckout(false)}>
                                            <ChevronLeft size={16} />
                                            Back to selection
                                        </button>
                                        {isSuccess ? (
                                            <div className="text-center py-6">
                                                <div className="w-20 h-20 bg-[var(--color-success-tint)] text-[var(--color-success)] rounded-full flex items-center justify-center mx-auto mb-4">
                                                    <Check size={48} />
                                                </div>
                                                <h2 className="mt-4">Payment successful!</h2>
                                                <p>We've sent a download link to your email. You can also download your photo directly below.</p>
                                                <button className="btn-primary full-width w-full mt-3" onClick={() => alert('Download started...')}>
                                                    <Zap size={18} />
                                                    Download Original
                                                </button>
                                                <button className="btn-secondary full-width w-full mt-3" onClick={() => navigate('/')}>
                                                    Continue browsing
                                                </button>
                                            </div>
                                        ) : (
                                            <CheckoutPanel
                                                total={getPrice(selectedQuality)}
                                                onPay={() => setIsSuccess(true)}
                                            />
                                        )}
                                    </div>
                                )}
                            </div>

                            <div className="bg-white rounded-[var(--radius-md)] border border-[var(--color-border)] p-6 max-md:p-5 max-md:box-border max-md:w-full shadow-[var(--shadow-sm)] details-card">
                                <h3 className="text-[1rem] font-semibold mb-4">Details</h3>
                                <div className="flex flex-col gap-3">
                                    <div className="flex justify-between text-[0.875rem]">
                                        <span className="text-[var(--color-text-secondary)]">Event</span>
                                        <div className="text-[var(--color-text-primary)] font-medium text-[var(--brand)] underline cursor-pointer" onClick={() => navigate(`/event/${photo.eventId}`)}>
                                            {photo.event}
                                        </div>
                                    </div>
                                    <div className="flex justify-between text-[0.875rem]">
                                        <span className="text-[var(--color-text-secondary)]">Club</span>
                                        <span className="text-[var(--color-text-primary)] font-medium">Stockholms Ryttarförening</span>
                                    </div>
                                    <div className="flex justify-between text-[0.875rem]">
                                        <span className="text-[var(--color-text-secondary)]">Orientation</span>
                                        <span className="text-[var(--color-text-primary)] font-medium">{detectedPortrait ? 'Portrait' : 'Landscape'}</span>
                                    </div>
                                    <div className="flex justify-between text-[0.875rem]">
                                        <span className="text-[var(--color-text-secondary)]">Class</span>
                                        <span className="text-[var(--color-text-primary)] font-medium">1.20m</span>
                                    </div>
                                    <div className="flex justify-between text-[0.875rem]">
                                        <span className="text-[var(--color-text-secondary)]">Time</span>
                                        <span className="text-[var(--color-text-primary)] font-medium">12 Jun 2026 • 14:24</span>
                                    </div>
                                    <div className="flex justify-between text-[0.875rem]">
                                        <span className="text-[var(--color-text-secondary)]">City</span>
                                        <span className="text-[var(--color-text-primary)] font-medium">🇸🇪 {event?.city}</span>
                                    </div>
                                    <div className="flex justify-between text-[0.875rem]">
                                        <span className="text-[var(--color-text-secondary)]">Venue</span>
                                        <span className="text-[var(--color-text-primary)] font-medium">Main Arena</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* Toast Notification */}
            {toast && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-[var(--color-text-primary)] text-white px-6 py-3 rounded-[99px] flex items-center gap-4 shadow-[0_4px_12px_rgba(0,0,0,0.15)] z-[1000] animate-[fadeUp_0.3s_ease-out]">
                    <span>{toast.message}</span>
                    {toast.action && (
                        <button className="text-[var(--color-success)] font-semibold bg-none border-none cursor-pointer text-[0.875rem]" onClick={toast.action.onClick}>
                            {toast.action.label}
                        </button>
                    )}
                </div>
            )}

            <Footer minimal={true} />
            {/* Full Screen Mobile Preview Portal */}
            {isFullScreen && createPortal(
                <div
                    className="fixed inset-0 bg-black/[0.95] z-[10000] flex flex-col animate-[iproFadeIn_0.2s_ease-out] touch-none"
                    onClick={() => setIsFullScreen(false)}
                >
                    <button
                        className="absolute top-[max(20px,env(safe-area-inset-top))] md:top-6 right-5 md:right-6 w-11 h-11 bg-white/[0.15] md:bg-white/10 backdrop-blur-[10px] [-webkit-backdrop-filter:blur(10px)] rounded-full border-none text-white flex items-center justify-center cursor-pointer z-[10001] transition-[background] duration-200 active:bg-white/30 md:hover:bg-white/20"
                        onClick={(e) => {
                            e.stopPropagation();
                            setIsFullScreen(false);
                        }}
                    >
                        <X size={28} />
                    </button>
                    <div
                        className="flex-1 w-full h-full overflow-auto flex items-center justify-center [-webkit-overflow-scrolling:touch]"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <WatermarkedPhotoPreview
                            src={photo.src}
                            alt={photo.rider}
                            photographer={`${photographer.firstName} ${photographer.lastName}`}
                            className="!bg-transparent max-w-[95vw] max-h-[95vh]"
                        />
                    </div>
                </div>,
                document.body
            )}
            {/* Contact Support Modal */}
            <ContactSupportModal
                isOpen={isSupportModalOpen}
                onClose={() => setIsSupportModalOpen(false)}
            />
        </div>
    );
}
