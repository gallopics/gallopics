import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePhotographer, type Photo } from '../../context/PhotographerContext';
import { MasonryGrid } from '../../components/MasonryGrid';
import { PhotoCard } from '../../components/PhotoCard';
import { TitleHeader } from '../../components/TitleHeader';
import { DollarSign, RotateCcw, X, LayoutGrid, List, AlertCircle } from 'lucide-react';
import { ModernDropdown } from '../../components/ModernDropdown';
import { ScopedSearchBar, type ScopedSearchOption } from '../../components/ScopedSearchBar';

import '../../styles/shared-filters.css';

import { useWorkspace } from '../../context/WorkspaceContext';

export const SoldPhotos: React.FC = () => {
    const { basePath, isAdmin } = useWorkspace();
    const navigate = useNavigate();
    const { events, getPhotosByEvent } = usePhotographer();

    // States
    const [selectedEventId, setSelectedEventId] = useState<string>('all');
    const [selectedBundleId, setSelectedBundleId] = useState<string>('all');
    const [selectedPeriod, setSelectedPeriod] = useState<string>('this_year');
    const [searchQuery, setSearchQuery] = useState('');
    const [viewMode, setViewMode] = useState<'card' | 'grid'>('card');
    const [previewPhoto, setPreviewPhoto] = useState<any | null>(null);
    const [hoveredBarIndex, setHoveredBarIndex] = useState<number | null>(null);
    const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean; photoId: string; photoCode: string } | null>(null);


    // Mock Data Constants
    const REVENUE = 24700;

    // Bundle Colors Token
    const BUNDLE_COLORS = {
        basic: 'var(--color-text-secondary)',
        standard: '#f97316',
        premium: '#a855f7',
        custom: '#facc15' // Yellow-400
    };

    // Helper Functions for Bundles
    const getBundleId = (photoId: string) => {
        const bundles = ['web', 'high', 'commercial', 'custom'] as const;
        const bundleHash = photoId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        return bundles[bundleHash % 4];
    };

    const getBundleLabel = (photoId: string) => {
        const bundleId = getBundleId(photoId);
        return {
            web: 'Web',
            high: 'High',
            commercial: 'Commercial',
            custom: 'Custom'
        }[bundleId];
    };

    // Deterministic mock purchase date spread across 2025–2026
    const getMockPurchaseDate = (photoId: string): Date => {
        const hash = photoId.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
        const slot = hash % 18; // 18 buckets: 6 months 2025 + 12 months 2026
        const year = slot < 6 ? 2025 : 2026;
        const month = slot < 6 ? slot + 6 : slot - 6; // Jul–Dec 2025, Jan–Dec 2026
        const day = (hash % 28) + 1;
        const hour = hash % 24;
        const minute = (hash * 7) % 60;
        return new Date(year, month, day, hour, minute);
    };

    const getBundleColor = (photoId: string) => {
        const bundleId = getBundleId(photoId);
        return {
            web: BUNDLE_COLORS.basic,
            high: BUNDLE_COLORS.standard,
            commercial: BUNDLE_COLORS.premium,
            custom: BUNDLE_COLORS.custom
        }[bundleId];
    };

    const bundleOptions = [
        { label: 'All bundles', value: 'all' },
        {
            label: 'Web',
            value: 'web',
            icon: <div className="w-2 h-2 rounded-full bundle-basic" />
        },
        {
            label: 'High',
            value: 'high',
            icon: <div className="w-2 h-2 rounded-full bundle-standard" />
        },
        {
            label: 'Commercial',
            value: 'commercial',
            icon: <div className="w-2 h-2 rounded-full bundle-premium" />
        },
        {
            label: 'Custom',
            value: 'custom',
            icon: <div className="w-2 h-2 rounded-full bundle-custom" />
        },
    ];

    // Options
    const eventOptions = [
        { label: 'All events', value: 'all' },
        ...events.map(e => ({ label: e.title, value: e.id }))
    ];

    const periodOptions = [
        { label: 'All time', value: 'all' },
        { label: 'This month', value: 'this_month' },
        { label: 'This year', value: 'this_year' },
        { label: 'Last year', value: 'last_year' },
    ];

    const allSoldPhotos = useMemo(() => {
        return events
            .flatMap(e => getPhotosByEvent(e.id))
            .filter(p => p.soldCount > 0)
            .map(p => {
                // For demo: some photos should have multiple sales
                const hash = p.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
                const mockSoldCount = (hash % 8 === 0) ? 4 : (hash % 5 === 0 ? 2 : 1);
                return {
                    ...p,
                    soldCount: mockSoldCount,
                    clientEmail: `client_${p.id.slice(0, 4)}@example.com`
                };
            });
    }, [events, getPhotosByEvent]);

    const filteredPhotos = useMemo(() => {
        const now = new Date();
        return allSoldPhotos.filter(p => {
            const matchEvent = selectedEventId === 'all' || p.eventId === selectedEventId;
            const matchSearch = !searchQuery ||
                (p.photoCode || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                (p.clientEmail || '').toLowerCase().includes(searchQuery.toLowerCase());

            const mockBundle = getBundleId(p.id);
            const matchBundle = selectedBundleId === 'all' || mockBundle === selectedBundleId;

            let matchPeriod = true;
            if (selectedPeriod !== 'all') {
                const d = getMockPurchaseDate(p.id);
                if (selectedPeriod === 'this_month') matchPeriod = d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
                else if (selectedPeriod === 'this_year') matchPeriod = d.getFullYear() === now.getFullYear();
                else if (selectedPeriod === 'last_year') matchPeriod = d.getFullYear() === now.getFullYear() - 1;
            }

            return matchEvent && matchSearch && matchBundle && matchPeriod;
        });
    }, [allSoldPhotos, selectedEventId, searchQuery, selectedBundleId, selectedPeriod]);

    const searchOptions = useMemo<ScopedSearchOption[]>(() => {
        const ids = Array.from(new Set(allSoldPhotos.map(p => p.photoCode || `#M-0-${p.id.slice(0, 8).toUpperCase()}`)))
            .map(id => ({ label: id, value: id, type: 'id' as const }));
        const emails = Array.from(new Set(allSoldPhotos.map(p => (p as any).clientEmail || `client_${p.id.slice(0, 4)}@example.com`)))
            .map(e => ({ label: e, value: e, type: 'email' as const }));
        return [...ids, ...emails];
    }, [allSoldPhotos]);

    const isResetDisabled = selectedEventId === 'all' && selectedBundleId === 'all' && selectedPeriod === 'all' && searchQuery === '';

    const mapToUiPhoto = (photo: Photo) => {
        const event = events.find(e => e.id === photo.eventId);
        const purchaseDate = getMockPurchaseDate(photo.id);
        return {
            id: photo.id,
            src: photo.url,
            rider: photo.rider || 'Unknown',
            horse: photo.horse || 'Unknown',
            event: event?.title || 'Event',
            eventId: photo.eventId,
            date: purchaseDate.toISOString(),
            time: purchaseDate.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
            city: event?.city || 'Unknown',
            countryCode: 'SE',
            priceStandard: photo.priceStandard,
            priceHigh: photo.priceHigh,
            priceCommercial: photo.priceCommercial,
            width: photo.width,
            height: photo.height,
            className: 'photo-grid-item',
            arena: 'Arena 1',
            soldCount: photo.soldCount
        };
    };

    // Graph Data — derived from filteredPhotos so chart and grid are always in sync
    const graphData = useMemo(() => {
        const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

        let labels: string[] = [];
        if (selectedPeriod === 'this_month') {
            labels = Array.from({ length: 30 }, (_, i) => (i + 1).toString());
        } else if (selectedPeriod === 'this_year') {
            labels = MONTHS;
        } else if (selectedPeriod === 'last_year') {
            labels = MONTHS;
        } else {
            labels = ['2023', '2024', '2025', '2026'];
        }

        const dataPoints = labels.map(() => ({ basic: 0, standard: 0, premium: 0, custom: 0 }));

        filteredPhotos.forEach(p => {
            const d = getMockPurchaseDate(p.id);
            let key: string;
            if (selectedPeriod === 'this_month') key = d.getDate().toString();
            else if (selectedPeriod === 'this_year' || selectedPeriod === 'last_year') key = MONTHS[d.getMonth()];
            else key = d.getFullYear().toString();

            const idx = labels.indexOf(key);
            if (idx === -1) return;

            const count = p.soldCount || 1;
            const bundle = getBundleId(p.id);
            if (bundle === 'web') dataPoints[idx].basic += count;
            else if (bundle === 'high') dataPoints[idx].standard += count;
            else if (bundle === 'commercial') dataPoints[idx].premium += count;
            else if (bundle === 'custom') dataPoints[idx].custom += count;
        });

        return { labels, dataPoints };
    }, [filteredPhotos, selectedPeriod]);

    return (
        <div className="pg-sold-photos">
            <TitleHeader
                variant="workspace"
                title="Sales"
                subtitle={null}
                rightContent={null}
            />

            <div className="pg-grey-section">
                <div className="pg-grey-section-inner">
                    <div className="container">

                        {/* Sales Trend Card */}
                        <div className="pg-trend-card">
                            <div className="pg-trend-header">
                                <div className="pg-trend-row">
                                    <div className="pg-trend-title">Sales trend</div>
                                    <div className="flex items-center gap-3">
                                        <div className="w-[200px]">
                                            <ModernDropdown
                                                value={selectedEventId}
                                                options={eventOptions}
                                                onChange={setSelectedEventId}
                                                label="Event"
                                                placeholder="All events"
                                                variant="pill"
                                            />
                                        </div>
                                        <div className="w-[160px]">
                                            <ModernDropdown
                                                value={selectedBundleId}
                                                options={bundleOptions}
                                                onChange={setSelectedBundleId}
                                                label="Bundle"
                                                placeholder="All bundles"
                                                variant="pill"
                                                icon={bundleOptions.find(o => o.value === selectedBundleId)?.icon}
                                            />
                                        </div>
                                        <div className="w-[160px]">
                                            <ModernDropdown
                                                value={selectedPeriod}
                                                options={periodOptions}
                                                onChange={setSelectedPeriod}
                                                label="Period"
                                                variant="pill"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="pg-trend-row">
                                    <div className="pg-stats-badges gap-2">
                                        <div className="pg-badge-item published stacked">
                                            <span className="label">Published</span>
                                            <span className="value">596</span>
                                        </div>
                                        <div className="pg-badge-item sales stacked">
                                            <span className="label">Sales</span>
                                            <span className="value">74/745</span>
                                        </div>
                                        {isAdmin ? (
                                            <>
                                                <div className="pg-badge-item earnings stacked">
                                                    <span className="label">PG Earnings</span>
                                                    <span className="value">SEK {REVENUE.toLocaleString().replace(/,/g, ' ')}</span>
                                                </div>
                                                <div className="pg-badge-item earnings stacked pg-badge-gallop">
                                                    <span className="label">Gallop Earnings</span>
                                                    <span className="value">SEK {(REVENUE * 10).toLocaleString().replace(/,/g, ' ')}</span>
                                                </div>
                                            </>
                                        ) : (
                                            <div className="pg-badge-item earnings stacked">
                                                <span className="label">Earnings</span>
                                                <span className="value">SEK {REVENUE.toLocaleString().replace(/,/g, ' ')}</span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="pg-trend-legend">
                                        <div className="pg-legend-item">
                                            <div className="pg-legend-dot bundle-basic" />
                                            <span>Web</span>
                                        </div>
                                        <div className="pg-legend-item">
                                            <div className="pg-legend-dot bundle-standard" />
                                            <span>High</span>
                                        </div>
                                        <div className="pg-legend-item">
                                            <div className="pg-legend-dot bundle-premium" />
                                            <span>Commercial</span>
                                        </div>
                                        <div className="pg-legend-item">
                                            <div className="pg-legend-dot bundle-custom" />
                                            <span>Custom</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="pg-trend-content">
                                <div className="pg-trend-chart">
                                    {graphData.dataPoints.map((point, i) => {
                                        const total = point.basic + point.standard + point.premium + point.custom;
                                        // Show label only for specific indices if too many bars
                                        const showLabel = selectedPeriod === 'this_month' ? (i % 5 === 0) : true;
                                        const label = selectedPeriod === 'this_month' ? (i + 1).toString() : graphData.labels[i];
                                        const isHovered = hoveredBarIndex === i;

                                        return (
                                            <div
                                                key={i}
                                                className="pg-chart-bar-wrapper"
                                                onMouseEnter={() => setHoveredBarIndex(i)}
                                                onMouseLeave={() => setHoveredBarIndex(null)}
                                            >
                                                <div className="pg-chart-bar-total">{Math.round(total)}</div>
                                                <div className="pg-chart-bar" style={{ height: `${total}%` }}>
                                                    <div className="pg-bar-segment bundle-custom" style={{ height: `${(point.custom / total) * 100}%` }} />
                                                    <div className="pg-bar-segment bundle-premium" style={{ height: `${(point.premium / total) * 100}%` }} />
                                                    <div className="pg-bar-segment bundle-standard" style={{ height: `${(point.standard / total) * 100}%` }} />
                                                    <div className="pg-bar-segment bundle-basic" style={{ height: `${(point.basic / total) * 100}%` }} />
                                                </div>
                                                {showLabel && <span className="pg-chart-label">{label}</span>}

                                                {isHovered && (
                                                    <div className="pg-chart-tooltip" style={{
                                                        bottom: '100%',
                                                        left: i > graphData.dataPoints.length / 2 ? 'auto' : '50%',
                                                        right: i > graphData.dataPoints.length / 2 ? '50%' : 'auto',
                                                        marginBottom: 12,
                                                        transform: i > graphData.dataPoints.length / 2 ? 'translateX(20%)' : 'translateX(-20%)'
                                                    }}>
                                                        <div className="tooltip-header">{label} Sales</div>
                                                        <div className="tooltip-row">
                                                            <div className="label"><div className="pg-legend-dot bundle-basic" />Web</div>
                                                            <div className="value">{Math.round(point.basic)}</div>
                                                        </div>
                                                        <div className="tooltip-row">
                                                            <div className="label"><div className="pg-legend-dot bundle-standard" />High</div>
                                                            <div className="value">{Math.round(point.standard)}</div>
                                                        </div>
                                                        <div className="tooltip-row">
                                                            <div className="label"><div className="pg-legend-dot bundle-premium" />Commercial</div>
                                                            <div className="value">{Math.round(point.premium)}</div>
                                                        </div>
                                                        <div className="tooltip-row">
                                                            <div className="label"><div className="pg-legend-dot bundle-custom" />Custom</div>
                                                            <div className="value">{Math.round(point.custom)}</div>
                                                        </div>
                                                        <div className="tooltip-footer">
                                                            <div className="tooltip-row font-bold">
                                                                <div className="label text-primary">Total Sold</div>
                                                                <div className="value">{Math.round(total)}</div>
                                                            </div>
                                                            {isAdmin ? (
                                                                <>
                                                                    <div className="tooltip-row mt-1">
                                                                        <div className="label">PG Earnings</div>
                                                                        <div className="value text-success-dark">SEK {Math.round(total * 450).toLocaleString()}</div>
                                                                    </div>
                                                                    <div className="tooltip-row mt-0.5">
                                                                        <div className="label">Gallop Earnings</div>
                                                                        <div className="value text-gallop">SEK {Math.round(total * 4500).toLocaleString()}</div>
                                                                    </div>
                                                                </>
                                                            ) : (
                                                                <div className="tooltip-row mt-1">
                                                                    <div className="label">Earnings</div>
                                                                    <div className="value text-success-dark">SEK {Math.round(total * 450).toLocaleString()}</div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        <div className="pg-section-separator" />

                        {/* Filters Row */}
                        <div className="filters-wrapper">
                            <div className="filter-container">
                                <div className="filter-group">
                                    <ModernDropdown
                                        value={selectedEventId}
                                        options={eventOptions}
                                        onChange={setSelectedEventId}
                                        label="Event"
                                        placeholder="Event"
                                        variant="pill"
                                    />
                                    <ModernDropdown
                                        value={selectedBundleId}
                                        options={bundleOptions}
                                        onChange={setSelectedBundleId}
                                        label="Bundle"
                                        placeholder="Bundle"
                                        variant="pill"
                                        icon={bundleOptions.find(o => o.value === selectedBundleId)?.icon}
                                    />
                                    <ModernDropdown
                                        value={selectedPeriod}
                                        options={periodOptions}
                                        onChange={setSelectedPeriod}
                                        label="Period"
                                        placeholder="Period"
                                        variant="pill"
                                    />
                                    <button
                                        className="filter-reset-btn"
                                        onClick={() => {
                                            setSelectedEventId('all');
                                            setSelectedBundleId('all');
                                            setSelectedPeriod('all');
                                            setSearchQuery('');
                                        }}
                                        title="Reset filters"
                                        disabled={isResetDisabled}
                                    >
                                        <RotateCcw size={18} />
                                    </button>
                                </div>

                                <div className="search-group">
                                    <ScopedSearchBar
                                        currentValue={searchQuery}
                                        onSearchChange={setSearchQuery}
                                        onSelect={setSearchQuery}
                                        placeholder="Search photo ID or client email..."
                                        options={searchOptions}
                                    />
                                </div>

                                <div className="pg-sales-filter-right">
                                    <div className="filter-results-count">
                                        Showing {filteredPhotos.length}
                                    </div>

                                    <div className="pg-view-actions">
                                        <div className="pg-view-separator" />
                                        <div className="pg-view-switcher">
                                            <button
                                                className={`pg-view-btn ${viewMode === 'card' ? 'active' : ''}`}
                                                onClick={() => setViewMode('card')}
                                                aria-label="Card view"
                                            >
                                                <LayoutGrid size={16} />
                                            </button>
                                            <button
                                                className={`pg-view-btn ${viewMode === 'grid' ? 'active' : ''}`}
                                                onClick={() => setViewMode('grid')}
                                                aria-label="List view"
                                            >
                                                <List size={16} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {filteredPhotos.length > 0 ? (
                            viewMode === 'card' ? (
                                <MasonryGrid isLoading={false}>
                                    {filteredPhotos.map(photo => (
                                        <div key={photo.id} className="pg-photo-card-wrapper">
                                            <PhotoCard
                                                photo={mapToUiPhoto(photo)}
                                                onClick={(p: any) => setPreviewPhoto(p)}
                                                variant="pgPublished"
                                                selectable={false}
                                                showEdit={false}
                                                onRemove={() => {
                                                    setConfirmModal({
                                                        isOpen: true,
                                                        photoId: photo.id,
                                                        photoCode: photo.photoCode || `#M-0-${photo.id.slice(0, 8).toUpperCase()}`
                                                    });
                                                }}
                                                pgMeta={{
                                                    fileName: photo.fileName,
                                                    photoCode: photo.photoCode || `#M-0-${photo.id.slice(0, 8).toUpperCase()}`,
                                                    soldCount: photo.soldCount,
                                                    priceStandard: photo.priceStandard,
                                                    priceHigh: photo.priceHigh,
                                                    priceCommercial: photo.priceCommercial
                                                }}
                                            />
                                        </div>
                                    ))}
                                </MasonryGrid>
                            ) : (
                                <div className="pg-grid-view-card">
                                    <table className="pg-sales-table">
                                        <thead>
                                            <tr>
                                                <th>Photo</th>
                                                <th>Photo ID</th>
                                                <th>Date / Time</th>
                                                <th>Event</th>
                                                <th>Client Info</th>
                                                <th>Bundle</th>
                                                <th className="text-center">Count</th>
                                                <th>Download Link</th>
                                                <th className="text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredPhotos.map(photo => {
                                                const event = events.find(e => e.id === photo.eventId);
                                                const photoIdDisplay = photo.photoCode || `#M-0-${photo.id.slice(0, 8).toUpperCase()}`;
                                                const clientEmail = (photo as any).clientEmail;
                                                const downloadLink = `gallopics.com/dl/${photo.photoCode || photo.id.slice(0, 8)}...`;
                                                const eventTitle = event?.title || 'Unknown Event';

                                                return (
                                                    <tr key={photo.id}>
                                                        <td>
                                                            <img
                                                                src={photo.url}
                                                                className="pg-table-thumb"
                                                                alt=""
                                                                onClick={() => setPreviewPhoto(mapToUiPhoto(photo))}
                                                            />
                                                        </td>
                                                        <td title={photoIdDisplay}>
                                                            <div className="truncate-cell-content font-semibold text-primary">{photoIdDisplay}</div>
                                                            {photo.fileName && <div className="truncate-cell-content text-[var(--fs-xs)] text-secondary">{photo.fileName}</div>}
                                                        </td>
                                                        <td title={`${photo.uploadDate} ${photo.timestamp || '14:20'}`}>
                                                            <div className="truncate-cell-content font-medium">{photo.uploadDate}</div>
                                                            <div className="truncate-cell-content text-[var(--fs-xs)] text-secondary">{photo.timestamp || '14:20'}</div>
                                                        </td>
                                                        <td title={eventTitle}>
                                                            <div className="truncate-cell-content">
                                                                <a
                                                                    href={`${basePath}/events/${photo.eventId}`}
                                                                    className="pg-table-event-link"
                                                                    onClick={(e) => {
                                                                        e.preventDefault();
                                                                        navigate(`${basePath}/events/${photo.eventId}`);
                                                                    }}
                                                                >
                                                                    {eventTitle}
                                                                </a>
                                                            </div>
                                                        </td>
                                                        <td title={clientEmail}>
                                                            <div className="truncate-cell-content text-secondary">{clientEmail}</div>
                                                        </td>
                                                        <td title={getBundleLabel(photo.id)}>
                                                            <div className="pg-bundle-tag">
                                                                <div className="pg-bundle-dot" style={{ background: getBundleColor(photo.id) }} />
                                                                <span className="truncate-cell-content">{getBundleLabel(photo.id)}</span>
                                                            </div>
                                                        </td>
                                                        <td className="text-center">
                                                            <div className="inline-flex justify-center w-full">
                                                                <div className="pg-sold-badge">{photo.soldCount || 1}</div>
                                                            </div>
                                                        </td>
                                                        <td title={`https://gallopics.com/dl/${photo.photoCode || photo.id.slice(0, 8)}`}>
                                                            <a href="#" className="pg-download-link" onClick={(e) => e.preventDefault()}>
                                                                {downloadLink}
                                                            </a>
                                                        </td>
                                                        <td className="text-right">
                                                            <button
                                                                className="pg-table-action-icon delete-action"
                                                                title="Unpublish"
                                                                onClick={() => {
                                                                    setConfirmModal({
                                                                        isOpen: true,
                                                                        photoId: photo.id,
                                                                        photoCode: photoIdDisplay
                                                                    });
                                                                }}
                                                            >
                                                                <RotateCcw size={16} />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            )
                        ) : (
                            <div className="pg-empty-state">
                                <div className="pg-empty-icon"><DollarSign size={24} /></div>
                                <h3>{allSoldPhotos.length === 0 ? "No sales yet" : "No results found"}</h3>
                                <p>
                                    {allSoldPhotos.length === 0
                                        ? "Your sold photos will appear here once customers make a purchase."
                                        : "Try adjusting your filters to find what you're looking for."}
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Preview Modal */}
            {previewPhoto && (
                <div className="fixed inset-0 z-[3000] bg-black/95 flex items-center justify-center [animation:fadeIn_0.2s_ease]" onClick={() => setPreviewPhoto(null)}>
                    <img src={previewPhoto.src} alt="" className="max-w-[95vw] max-h-[95vh] object-contain rounded-[4px] shadow-[0_20px_50px_rgba(0,0,0,0.5)]" onClick={(e) => e.stopPropagation()} />
                    <button className="absolute top-6 right-6 bg-white/10 text-white rounded-full w-11 h-11 border-none cursor-pointer flex items-center justify-center backdrop-blur-[10px] transition-[background] duration-200" onClick={() => setPreviewPhoto(null)}>
                        <X size={24} />
                    </button>
                </div>
            )}
            {/* Unpublish Confirmation Modal */}
            {confirmModal && confirmModal.isOpen && (
                <div className="pg-modal-overlay">
                    <div className="pg-modal-card">
                        <div className="flex gap-4 items-start">
                            <div className="pg-danger-icon">
                                <AlertCircle size={24} />
                            </div>
                            <div className="flex-1">
                                <h3 className="mt-0 text-[var(--fs-lg)] font-bold text-primary mb-2">
                                    Unpublish photo?
                                </h3>
                                <p className="m-0 mb-6 text-secondary text-[0.875rem] leading-[1.5]">
                                    This will move photo <strong>{confirmModal.photoCode}</strong> to the Archive tab. You can undo this action later from the event details page.
                                </p>
                            </div>
                        </div>
                        <div className="modal-footer-actions">
                            <button className="modal-btn-cancel" onClick={() => setConfirmModal(null)}>
                                Cancel
                            </button>
                            <button
                                className="modal-btn-danger"
                                onClick={() => {
                                    console.log('Unpublishing photo:', confirmModal.photoId);
                                    setConfirmModal(null);
                                }}
                            >
                                Unpublish
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
