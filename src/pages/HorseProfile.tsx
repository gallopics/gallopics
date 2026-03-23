import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import type { Photo } from '../types';
import { RotateCcw } from 'lucide-react';
import { Header } from '../components/Header';
import { TitleHeader } from '../components/TitleHeader';
import { Breadcrumbs } from '../components/Breadcrumbs';
import type { BreadcrumbItem } from '../components/Breadcrumbs';
import { Footer } from '../components/Footer';
import { MasonryGrid } from '../components/MasonryGrid';
import { PhotoCard } from '../components/PhotoCard';
import { ModernDropdown } from '../components/ModernDropdown';
import { InfoChip } from '../components/InfoChip';
import { photos as mockPhotos, HORSES, RIDERS, COMPETITIONS } from '../data/mockData';
import { RiderIcon } from '../components/icons/RiderIcon';

import { ShareIconButton, ActionSeparator, ActionCluster } from '../components/HeaderActions';
import { useCart } from '../context/CartContext';

export function HorseProfile() {
    const { horseId = 'h1' } = useParams();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const from = searchParams.get('from');
    const photoId = searchParams.get('photoId');
    const { cart, addToCart } = useCart();
    const [toast, setToast] = useState<{ message: string } | null>(null);

    // Auto-hide toast
    useEffect(() => {
        if (toast) {
            const timer = setTimeout(() => setToast(null), 3000);
            return () => clearTimeout(timer);
        }
    }, [toast]);

    // Data Loading
    const [photos, setPhotos] = useState<Photo[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const activeHorse = useMemo(() => {
        return HORSES.find(h => h.id === horseId) || HORSES[0];
    }, [horseId]);

    // Breadcrumb path construction
    const breadcrumbs = useMemo<BreadcrumbItem[]>(() => {
        const items: BreadcrumbItem[] = [];

        if (from === 'photo' && photoId) {
            items.push({ label: 'Back to photo', onClick: () => navigate(`/photo/${photoId}`) });
        } else {
            items.push({ label: 'Events', onClick: () => navigate('/') });
        }

        items.push({ label: activeHorse.name, active: true });
        return items;
    }, [navigate, activeHorse, from, photoId]);

    // Filter states - Order: Events, Class, Riders, Photographer
    const [selectedEventId, setSelectedEventId] = useState<string>('');
    const [eventClass, setEventClass] = useState('All');
    const [rider, setRider] = useState('All');
    const [photographer, setPhotographer] = useState('All');

    useEffect(() => {
        const timer = setTimeout(() => {
            // Filter global mock photos by this horse name
            const horsePhotos = mockPhotos.filter(p => p.horse === activeHorse.name);
            setPhotos(horsePhotos);
            setIsLoading(false);
        }, 1000);

        return () => clearTimeout(timer);
    }, [activeHorse]);

    // Compute latest event once photos are loaded
    useEffect(() => {
        if (photos.length > 0 && !selectedEventId) {
            const uniqueIds = Array.from(new Set(photos.map(p => p.eventId)));
            const relevantEvents = COMPETITIONS.filter(c => uniqueIds.includes(c.id));
            if (relevantEvents.length > 0) {
                relevantEvents.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
                setSelectedEventId(relevantEvents[0].id);
            }
        }
    }, [photos, selectedEventId]);

    const isResetDisabled = !selectedEventId && eventClass === 'All' && rider === 'All' && photographer === 'All';

    // Filters Inter-dependency
    const filteredPhotos = useMemo(() => {
        return photos.filter(photo => {
            const matchEvent = !selectedEventId || photo.eventId === selectedEventId;
            const matchRider = rider === 'All' || photo.rider === rider;
            const matchClass = eventClass === 'All' || ((photo as any).class || '1.30m') === eventClass;
            const matchPhotographer = photographer === 'All' || ((photo as any).photographer || 'Unknown') === photographer;

            return matchEvent && matchRider && matchClass && matchPhotographer;
        });
    }, [photos, selectedEventId, rider, eventClass, photographer]);

    // Helpers for dynamic options
    const getAvailable = (scopingFilter: (p: Photo) => boolean) => photos.filter(scopingFilter);

    // 1. Events
    const eventOptions = useMemo(() => {
        const available = getAvailable(p =>
            (rider === 'All' || p.rider === rider) &&
            (eventClass === 'All' || ((p as any).class || '1.30m') === eventClass) &&
            (photographer === 'All' || ((p as any).photographer || 'Unknown') === photographer)
        );
        const uniqueIds = Array.from(new Set(available.map(p => p.eventId)));
        const relevantEvents = COMPETITIONS.filter(c => uniqueIds.includes(c.id));
        // Remove All Events option
        return relevantEvents.map(e => ({ label: e.name, value: e.id }));
    }, [photos, rider, eventClass, photographer]);

    // 3. Class
    const classOptions = [
        { label: 'All Classes', value: 'All' },
        { label: '1.20m', value: '1.20m' },
        { label: '1.30m', value: '1.30m' }
    ];

    // 4. Riders
    const riderOptions = useMemo(() => {
        const available = getAvailable(p =>
            (!selectedEventId || p.eventId === selectedEventId)
        );
        const unique = Array.from(new Set(available.map(p => p.rider))).sort();
        return [{ label: 'All Riders', value: 'All' }, ...unique.map(r => ({ label: r, value: r }))];
    }, [photos, selectedEventId]);

    // 5. Photographer
    const photographerOptions = useMemo(() => {
        const available = getAvailable(p =>
            (!selectedEventId || p.eventId === selectedEventId)
        );
        const unique = Array.from(new Set(available.map(p => p.photographer).filter(Boolean))).sort();
        return [{ label: 'All Photographers', value: 'All' }, ...unique.map(ph => ({ label: ph as string, value: ph as string }))];
    }, [photos, selectedEventId]);

    // Header Stats
    const totalEvents = new Set(photos.map(p => p.eventId)).size;
    const totalPhotosCount = photos.length;

    return (
        <div className="page-wrapper">
            <Header />

            <Breadcrumbs items={breadcrumbs} />

            <TitleHeader
                title={activeHorse.name}
                avatarVariant="horse"
                subtitle="Horse"
                stats={
                    <div className="event-stats-row">
                        <span className="meta-item">{totalEvents} events</span>
                        <span className="meta-item">{totalPhotosCount} photos</span>
                    </div>
                }
                rightContent={
                    <ActionCluster>
                        {(() => {
                            // Find primary rider
                            if (photos.length === 0) return null;
                            const riderCounts: { [key: string]: number } = {};
                            photos.forEach(p => {
                                riderCounts[p.rider] = (riderCounts[p.rider] || 0) + 1;
                            });
                            const topRiderName = Object.keys(riderCounts).reduce((a, b) => riderCounts[a] > riderCounts[b] ? a : b);
                            const topRider = RIDERS.find(r => `${r.firstName} ${r.lastName}` === topRiderName);

                            if (!topRider) return null;

                            return (
                                <>
                                    <InfoChip
                                        label="Rider"
                                        name={`${topRider.firstName} ${topRider.lastName}`}
                                        variant="rider"
                                        icon={<RiderIcon size={20} />}
                                        onClick={() => navigate(`/rider/${topRider.id}?from=horse&horseId=${horseId}`)}
                                    />
                                    <ActionSeparator />
                                </>
                            );
                        })()}
                        <ShareIconButton />
                    </ActionCluster>
                }
            />

            <section className="grid-section">
                <div className="container">
                    <div className="filters-wrapper">
                        {/* New Shared Filter Structure */}
                        <div className="filter-container">
                            <div className="filter-group">
                                <ModernDropdown
                                    value={selectedEventId}
                                    options={eventOptions}
                                    onChange={setSelectedEventId}
                                    label="Events"
                                    placeholder="Events"
                                    showSearch={true}
                                    variant="pill"
                                />
                                <ModernDropdown
                                    value={eventClass}
                                    options={classOptions}
                                    onChange={setEventClass}
                                    label="Class"
                                    placeholder="Class"
                                    variant="pill"
                                />
                                <ModernDropdown
                                    value={rider}
                                    options={riderOptions}
                                    onChange={setRider}
                                    label="Riders"
                                    placeholder="Riders"
                                    showSearch={true}
                                    variant="pill"
                                />
                                <ModernDropdown
                                    value={photographer}
                                    options={photographerOptions}
                                    onChange={setPhotographer}
                                    label="Photographer"
                                    placeholder="Photographer"
                                    variant="pill"
                                />
                                <button
                                    className="filter-reset-btn"
                                    onClick={() => {
                                        // Auto-reset to latest
                                        const uniqueIds = Array.from(new Set(photos.map(p => p.eventId)));
                                        const relevantEvents = COMPETITIONS.filter(c => uniqueIds.includes(c.id));
                                        if (relevantEvents.length > 0) {
                                            relevantEvents.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
                                            setSelectedEventId(relevantEvents[0].id);
                                        }
                                        setEventClass('All');
                                        setRider('All');
                                        setPhotographer('All');
                                    }}
                                    title="Reset filters"
                                    disabled={isResetDisabled}
                                >
                                    <RotateCcw size={18} />
                                </button>
                            </div>

                            <div className="filter-results-count">
                                Showing {filteredPhotos.length} photos
                            </div>
                        </div>
                    </div>

                    <MasonryGrid
                        isLoading={isLoading}
                        renderSkeleton={() => (
                            <div className="photo-card skeleton-card">
                                <div className="card-image-wrapper aspect-[3/4] bg-[var(--ui-bg-subtle)]"></div>
                                <div className="card-content">
                                    <div className="h-4 w-[70%] bg-[var(--color-border)] mb-1.5 rounded-[4px]"></div>
                                    <div className="h-3 w-[40%] bg-[var(--color-border)] rounded-[4px]"></div>
                                </div>
                            </div>
                        )}
                    >
                        {filteredPhotos.map((photo) => (
                            <PhotoCard
                                key={photo.id}
                                photo={photo}
                                onClick={(p) => navigate(`/photo/${p.id}?from=horse&horseId=${activeHorse.id}`)}
                                onAddToCart={(p) => {
                                    // Check if in cart
                                    const isInCart = cart.some(item => item.photoId === p.id && item.quality === 'high');
                                    if (isInCart) {
                                        setToast({ message: 'Already in cart' });
                                        return;
                                    }
                                    addToCart(p, 'high', 'High Quality', 999);
                                    setToast({ message: 'Added to cart' });
                                }}
                            />
                        ))}
                    </MasonryGrid>
                </div>
            </section>

            {/* Toast Notification */}
            {toast && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-[var(--color-text-primary)] text-white px-6 py-3 rounded-[99px] flex items-center gap-4 shadow-[0_4px_12px_rgba(0,0,0,0.15)] z-[1000]">
                    <span>{toast.message}</span>
                </div>
            )}

            <Footer minimal={true} />
        </div>
    );
}
