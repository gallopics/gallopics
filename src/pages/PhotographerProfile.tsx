import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import type { Photo } from '../types';
import { RotateCcw, Pencil, Instagram, Music2, Search } from 'lucide-react';
import { Header } from '../components/Header';
import { TitleHeader } from '../components/TitleHeader';
import { Breadcrumbs } from '../components/Breadcrumbs';
import type { BreadcrumbItem } from '../components/Breadcrumbs';
import { Footer } from '../components/Footer';
import { MasonryGrid } from '../components/MasonryGrid';
import { PhotoCard } from '../components/PhotoCard';
import { ModernDropdown } from '../components/ModernDropdown';
import {
  photos as mockPhotos,
  getActivePhotographerProfile,
} from '../data/mockData';
import { mockEvents, SHOW_EVENTS } from '../data/mockEvents';

import { ScopedSearchBar } from '../components/ScopedSearchBar';
import { Highlights } from '../components/Highlights';
import {
  ShareIconButton,
  ActionSeparator,
  ActionCluster,
} from '../components/HeaderActions';

// Owner / Manage Logic
import { usePhotographer } from '../context/PhotographerContext';
import { ManageHighlightsModal } from '../components/ManageHighlightsModal';
import { assetUrl } from '../lib/utils';
import { useAuth } from '../context/AuthContext';
import {
  api,
  ApiError,
  resolveApiAssetUrl,
  type ApiPhotographer,
} from '../data/apiClient';

export function PhotographerProfile() {
  const { id = 'hanna-bjork' } = useParams();
  const navigate = useNavigate();
  const { user: authUser } = useAuth();

  // Params
  const [searchParams] = useSearchParams();
  const from = searchParams.get('from');
  const eventId = searchParams.get('eventId');
  const sourceEvent = eventId ? mockEvents.find(e => e.id === eventId) : null;

  const [photos, setPhotos] = useState<Photo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [apiPhotographer, setApiPhotographer] =
    useState<ApiPhotographer | null>(null);
  const [activeTab, setActiveTab] = useState<'highlights' | 'photos'>(
    'highlights'
  );

  // Breadcrumbs
  const {
    photographerId: loggedInId,
    updateHighlights,
    highlights: contextHighlights,
    allPhotos: contextPhotos,
    events: contextEvents,
    availableToHire,
  } = usePhotographer();
  const isOwner = id === loggedInId;
  const [isHighlightsModalOpen, setIsHighlightsModalOpen] = useState(false);

  useEffect(() => {
    let isMounted = true;

    api
      .getPublicPhotographer(id)
      .then(profile => {
        if (isMounted) {
          setApiPhotographer(profile);
        }
      })
      .catch(error => {
        if (!(error instanceof ApiError && error.status === 404)) {
          console.error('Failed to load photographer profile', error);
        }
        if (isMounted) {
          setApiPhotographer(null);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [id]);

  const activeProfile = useMemo(() => {
    const baseProfile = getActivePhotographerProfile(id);
    if (apiPhotographer) {
      const [firstName = apiPhotographer.display_name, ...lastNameParts] =
        apiPhotographer.display_name.split(' ');

      return {
        ...baseProfile,
        photographer: {
          ...baseProfile.photographer,
          id: apiPhotographer.slug,
          firstName,
          lastName: lastNameParts.join(' '),
          city: apiPhotographer.city || '',
          countryCode:
            apiPhotographer.country || baseProfile.photographer.countryCode,
          avatarUrl: apiPhotographer.avatar_url,
          highlights: [],
          isAvailableToHire: apiPhotographer.is_available_to_hire,
        },
        dummyEvents: [],
      };
    }

    const isKnownPhotographer = baseProfile.photographer.id === id;

    if (isKnownPhotographer || !isOwner || !authUser) {
      return baseProfile;
    }

    const [firstName = authUser.displayName, ...lastNameParts] =
      authUser.displayName.split(' ');

    return {
      ...baseProfile,
      photographer: {
        ...baseProfile.photographer,
        id,
        firstName,
        lastName: lastNameParts.join(' '),
        city: authUser.city,
        countryCode: authUser.country || baseProfile.photographer.countryCode,
        avatarUrl: authUser.avatarUrl || null,
        highlights: [],
        isAvailableToHire: availableToHire,
      },
      dummyEvents: [],
    };
  }, [id, apiPhotographer, isOwner, authUser, availableToHire]);
  const photographer = activeProfile?.photographer;

  const breadcrumbs = useMemo<BreadcrumbItem[]>(() => {
    const items: BreadcrumbItem[] = [
      { label: 'Events', onClick: () => navigate('/') },
    ];
    if ((from === 'event' || from === 'ipro') && sourceEvent) {
      items.push({
        label: sourceEvent.name,
        onClick: () => navigate(`/event/${eventId}`),
      });
    }
    if (photographer) {
      items.push({
        label: `${photographer.firstName} ${photographer.lastName}`,
        active: true,
      });
    }
    return items;
  }, [from, sourceEvent, eventId, photographer, navigate]);

  // Filter States
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [eventClass, setEventClass] = useState('All');

  useEffect(() => {
    const timer = setTimeout(() => {
      setPhotos(
        SHOW_EVENTS ? mockPhotos.filter(p => p.photographerId === id) : []
      );
      setIsLoading(false);
    }, 1500);

    return () => clearTimeout(timer);
  }, [id]);

  // Compute latest event once photos are loaded
  useEffect(() => {
    if (photos.length > 0 && !selectedEventId && activeProfile) {
      const allEvents = [
        activeProfile.primaryEvent,
        ...activeProfile.dummyEvents,
      ];
      // Since we don't have explicit dates on these dummy events in the profile object easily,
      // but we want "Latest", let's assume they are sorted or we can find them in COMPETITIONS if IDs match.
      // For now, let's use the first one as "Latest" if no other info.
      if (allEvents.length > 0) {
        setSelectedEventId(allEvents[0].id);
      }
    }
  }, [photos, selectedEventId, activeProfile]);

  const isResetDisabled =
    !selectedEventId && eventClass === 'All' && searchQuery === '';

  // Options
  const eventOptions = activeProfile
    ? [
        {
          label: activeProfile.primaryEvent.name,
          value: activeProfile.primaryEvent.id,
        },
        ...activeProfile.dummyEvents.map(e => ({ label: e.name, value: e.id })),
      ]
    : [];

  const combinedOptions = useMemo(() => {
    const available = photos.filter(
      p => selectedEventId === '' || p.eventId === selectedEventId
    );
    const uniqueRiders = Array.from(
      new Set(available.map(p => p.rider))
    ).sort();
    const uniqueHorses = Array.from(
      new Set(available.map(p => p.horse))
    ).sort();

    const riderOptions = uniqueRiders.map(r => {
      const photo = available.find(p => p.rider === r);
      return {
        label: r,
        value: r,
        type: 'rider' as const,
        subtitle: photo?.horse,
      };
    });

    const horseOptions = uniqueHorses.map(h => {
      const photo = available.find(p => p.horse === h);
      return {
        label: h,
        value: h,
        type: 'horse' as const,
        subtitle: photo?.rider,
      };
    });

    return [...riderOptions, ...horseOptions];
  }, [photos, selectedEventId]);

  const filteredPhotos = useMemo(() => {
    return photos.filter(photo => {
      const matchEvent = !selectedEventId || photo.eventId === selectedEventId;
      const matchClass =
        eventClass === 'All' ||
        (photo.className && photo.className.includes(eventClass)); // Approximate class match

      // Search Query Logic: Matches either Rider OR Horse
      let matchSearch = true;
      if (searchQuery && searchQuery.trim().length > 0) {
        const q = searchQuery.toLowerCase();
        matchSearch =
          photo.rider.toLowerCase().includes(q) ||
          photo.horse.toLowerCase().includes(q);
      }

      return matchEvent && matchClass && matchSearch;
    });
  }, [photos, selectedEventId, eventClass, searchQuery]);

  const classOptions = [
    { label: 'All Classes', value: 'All' },
    { label: '1.20m', value: '120' },
    { label: '1.30m', value: '130' },
  ];

  const totalEvents = activeProfile.dummyEvents.length + 1;
  const totalPhotosCount = photos.length;

  // Resolve Highlights Data
  const displayHighlights: Photo[] = useMemo(() => {
    if (isOwner) {
      // Map context IDs to context photos (source of truth for owner)
      const raw = contextPhotos.filter(p => contextHighlights.includes(p.id));
      // Map to App 'Photo' type
      return raw.map(p => {
        const ev = contextEvents.find(e => e.id === p.eventId);
        return {
          id: p.id,
          src: p.url,
          rider: p.rider || 'Unknown',
          horse: p.horse || 'Unknown',
          event: ev?.title || 'Event',
          eventId: p.eventId,
          date: ev?.date || 'Today',
          width: p.width,
          height: p.height,
          // Mock helpers
          className: 'Class A',
          time: p.timestamp || '12:00',
          city: ev?.city || 'Stockholm',
          arena: ev?.venueName || 'Main Arena',
          countryCode: 'SE',
          discipline: ev?.disciplines?.[0] || 'Showjumping',
        };
      });
    }
    // Public view: Map IDs to mockData photos
    return (photographer?.highlights || [])
      .map(id => mockPhotos.find(p => p.id === id))
      .filter((p): p is Photo => !!p);
  }, [
    isOwner,
    contextHighlights,
    contextPhotos,
    photographer?.highlights,
    contextEvents,
  ]);

  // Guard after all hooks
  if (!activeProfile || !photographer) {
    return <div>Photographer not found</div>;
  }

  const photographerAvatar =
    resolveApiAssetUrl(
      'avatarUrl' in photographer ? photographer.avatarUrl : null,
    ) ??
    assetUrl(`images/${photographer.firstName} ${photographer.lastName}.jpg`);

  return (
    <div className="page-wrapper">
      <Header />

      <Breadcrumbs items={breadcrumbs} />

      <TitleHeader
        className="no-border"
        title={`${photographer.firstName} ${photographer.lastName}`}
        avatar={photographerAvatar}
        avatarVariant="photographer"
        subtitle={
          <div className="event-meta-row">
            <span className="meta-item">Photographer</span>
            <span className="meta-item">{photographer.city || 'Sweden'}</span>
          </div>
        }
        stats={
          <div className="event-stats-row">
            <span className="meta-item">{totalEvents} events</span>
            <span className="meta-item">{totalPhotosCount} photos</span>
          </div>
        }
        rightContent={
          <ActionCluster>
            {/* {isOwner && (
              <>
                <div className="flex items-center mr-[var(--spacing-sm)]">
                  <label className="toggle-switch-label">
                    <input
                      type="checkbox"
                      checked={availableToHire}
                      onChange={e => toggleAvailableToHire(e.target.checked)}
                      className="toggle-switch-input"
                    />
                    <span
                      className="toggle-switch-track"
                      style={{
                        backgroundColor: availableToHire
                          ? 'var(--color-brand-primary)'
                          : 'var(--color-border)',
                      }}
                    ></span>
                    <span
                      className="toggle-switch-thumb"
                      style={{ left: availableToHire ? '22px' : '2px' }}
                    ></span>
                  </label>
                </div>
              </>
            )} */}

            {/* Hire Button logic: Show if Owner (driven by context) or if Guest & Available */}
            {/* {(isOwner ? availableToHire : photographer.isAvailableToHire) ? (
              <Button variant="primary" size="medium">
                Hire me
              </Button>
            ) : (
              <Button variant="secondary" size="medium" disabled>
                Not available atm
              </Button>
            )} */}

            <ActionSeparator />

            <button
              type="button"
              className="share-icon-btn"
              aria-label="Instagram"
              title="Instagram"
              onClick={e => e.preventDefault()}
            >
              <Instagram size={20} />
            </button>

            <button
              type="button"
              className="share-icon-btn"
              aria-label="TikTok"
              title="TikTok"
              onClick={e => e.preventDefault()}
            >
              <Music2 size={20} />
            </button>

            <ActionSeparator />

            <ShareIconButton />
          </ActionCluster>
        }
      />

      <ManageHighlightsModal
        isOpen={isHighlightsModalOpen}
        onClose={() => setIsHighlightsModalOpen(false)}
        initialIds={contextHighlights}
        onSave={updateHighlights}
      />

      {/* Profile Tabs - Only show if Owner OR there are highlights to show */}
      {(isOwner || displayHighlights.length > 0) && (
        <div className="tab-row">
          <div className="container flex gap-0">
            <button
              className={`tab-btn ${
                activeTab === 'highlights' ? 'active' : ''
              }`}
              onClick={() => setActiveTab('highlights')}
            >
              Highlights
            </button>
            <button
              className={`tab-btn ${activeTab === 'photos' ? 'active' : ''}`}
              onClick={() => setActiveTab('photos')}
            >
              Photos
            </button>
          </div>
        </div>
      )}

      {/* Content Section - Gradient Grey Background */}
      <div className="min-h-[60vh] pt-[var(--spacing-lg)]">
        {(isOwner || displayHighlights.length > 0 ? activeTab : 'photos') ===
        'highlights' ? (
          <div className="container pb-[80px]">
            {displayHighlights.length > 0 && isOwner && (
              <div className="flex justify-end mb-[var(--spacing-md)]">
                <button
                  className="btn-outline edit-highlights-btn"
                  onClick={() => setIsHighlightsModalOpen(true)}
                >
                  <Pencil size={14} />
                  Edit highlights
                </button>
              </div>
            )}

            {/* Empty State for Owner */}
            {isOwner && displayHighlights.length === 0 ? (
              <div className="empty-state highlights-empty-state">
                <div className="empty-state-title">Showcase your best work</div>
                <p className="empty-state-desc">
                  Select your best photos to display them at the top of your
                  profile.
                </p>
                <button
                  className="btn-primary"
                  onClick={() => setIsHighlightsModalOpen(true)}
                >
                  Add photos
                </button>
              </div>
            ) : (
              <Highlights items={displayHighlights} />
            )}
          </div>
        ) : (
          <section className="grid-section !pt-0 !pb-0">
            <div className="container">
              <div className="filters-wrapper">
                {/* New Shared Filter Structure */}
                <div className="filter-container">
                  <div className="filter-group">
                    <ModernDropdown
                      value={selectedEventId}
                      options={eventOptions}
                      onChange={setSelectedEventId}
                      label="Event"
                      placeholder="Event"
                      showSearch={true}
                      searchPlaceholder="Search events..."
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
                    <button
                      className="filter-reset-btn"
                      onClick={() => {
                        const allEvents = [
                          activeProfile.primaryEvent,
                          ...activeProfile.dummyEvents,
                        ];
                        if (allEvents.length > 0)
                          setSelectedEventId(allEvents[0].id);
                        setEventClass('All');
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
                      placeholder="Search by riders or horses..."
                      options={combinedOptions}
                      currentValue={searchQuery}
                      onSelect={val => setSearchQuery(val)}
                      onSearchChange={val => setSearchQuery(val)}
                      variant="v2"
                    />
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
                    <div className="card-image-wrapper aspect-[3/4] skeleton-block"></div>
                    <div className="card-content">
                      <div className="skeleton-line w-[70%] mb-[6px]"></div>
                      <div className="skeleton-line w-[40%] h-[12px] mb-0"></div>
                    </div>
                  </div>
                )}
              >
                {filteredPhotos.map(photo => (
                  <PhotoCard
                    key={photo.id}
                    photo={photo}
                    onClick={p => navigate(`/photo/${p.id}?from=ppro`)}
                  />
                ))}
              </MasonryGrid>

              {!isLoading && filteredPhotos.length === 0 && (
                <div className="pg-empty-state">
                  <div className="pg-empty-icon">
                    <Search size={24} />
                  </div>
                  <h3>No events available – yet</h3>
                  <p>Try adjusting your filters or search terms.</p>
                  <button
                    onClick={() => {
                      const allEvents = [
                        activeProfile.primaryEvent,
                        ...activeProfile.dummyEvents,
                      ];
                      if (allEvents.length > 0)
                        setSelectedEventId(allEvents[0].id);
                      setEventClass('All');
                      setSearchQuery('');
                    }}
                    className="pg-btn pg-btn-secondary mt-2"
                  >
                    Clear filters
                  </button>
                </div>
              )}
            </div>
          </section>
        )}
      </div>

      <Footer minimal={true} />
    </div>
  );
}
