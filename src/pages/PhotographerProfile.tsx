import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import type { Photo } from '../types';
import {
  CalendarDays,
  ChevronLeft,
  Images,
  Pencil,
  Instagram,
  Music2,
  Search,
} from 'lucide-react';
import { Header } from '../components/Header';
import { TitleHeader } from '../components/TitleHeader';
import { Breadcrumbs } from '../components/Breadcrumbs';
import type { BreadcrumbItem } from '../components/Breadcrumbs';
import { Footer } from '../components/Footer';
import { MasonryGrid } from '../components/MasonryGrid';
import { PhotoCard } from '../components/PhotoCard';
import {
  photos as mockPhotos,
  getActivePhotographerProfile,
  PHOTOGRAPHERS,
} from '../data/mockData';
import { mockEvents, SHOW_EVENTS } from '../data/mockEvents';

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
  type ApiPhoto,
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
  const [apiPhotographer, setApiPhotographer] =
    useState<ApiPhotographer | null>(null);
  const [isLoadingApiPhotographer, setIsLoadingApiPhotographer] =
    useState(true);
  const [apiHighlightPhotos, setApiHighlightPhotos] = useState<Photo[]>([]);
  const [activeTab, setActiveTab] = useState<'highlights' | 'photos'>(
    'highlights'
  );
  const [galleryEventId, setGalleryEventId] = useState('');
  const [galleryClassKey, setGalleryClassKey] = useState('');

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
    setIsLoadingApiPhotographer(true);

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
      })
      .finally(() => {
        if (isMounted) {
          setIsLoadingApiPhotographer(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [id]);

  const activeProfile = useMemo(() => {
    const isKnownMockPhotographer = PHOTOGRAPHERS.some(p => p.id === id);
    if (
      !apiPhotographer &&
      isLoadingApiPhotographer &&
      !isKnownMockPhotographer
    ) {
      return null;
    }

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
          highlights: apiPhotographer.highlights || [],
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

  useEffect(() => {
    let isMounted = true;

    const fetchHighlightPhotos = async () => {
      if (isOwner || !apiPhotographer?.highlights?.length) {
        if (isMounted) setApiHighlightPhotos([]);
        return;
      }

      const responses = await Promise.allSettled(
        apiPhotographer.highlights
          .slice(0, 10)
          .map(photoId => api.getPhoto(photoId))
      );

      if (!isMounted) return;

      const mappedPhotos = responses
        .map(result => (result.status === 'fulfilled' ? result.value : null))
        .filter((photo): photo is ApiPhoto => Boolean(photo))
        .map(photo => {
          const ev = contextEvents.find(e => e.id === photo.event_id);
          return {
            id: photo.id,
            src:
              resolveApiAssetUrl(
                `/api/v1/photographer/photos/${photo.id}/preview`
              ) || '',
            rider:
              photo.tags.find(tag => tag.type === 'rider')?.value || 'Unknown',
            horse:
              photo.tags.find(tag => tag.type === 'horse')?.value || 'Unknown',
            event: ev?.title || 'Event',
            eventId: photo.event_id,
            date:
              ev?.date ||
              new Date(photo.created_at).toLocaleDateString(undefined, {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              }),
            width: 600,
            height: 800,
            className: photo.class_name || 'Class A',
            time: new Date(photo.created_at).toLocaleTimeString().slice(0, 5),
            city: ev?.city || 'Sweden',
            arena: ev?.venueName || 'Main Arena',
            countryCode: 'SE',
            discipline: ev?.disciplines?.[0] || 'Showjumping',
          };
        });

      setApiHighlightPhotos(mappedPhotos);
    };

    fetchHighlightPhotos().catch(error => {
      if (isMounted) {
        setApiHighlightPhotos([]);
      }
      console.error('Failed to load photographer highlights', error);
    });

    return () => {
      isMounted = false;
    };
  }, [apiPhotographer, contextEvents, isOwner]);

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

  useEffect(() => {
    const timer = setTimeout(() => {
      setPhotos(
        SHOW_EVENTS ? mockPhotos.filter(p => p.photographerId === id) : []
      );
    }, 1500);

    return () => clearTimeout(timer);
  }, [id]);

  useEffect(() => {
    setGalleryEventId('');
    setGalleryClassKey('');
  }, [id, activeTab]);

  const profilePhotos: Photo[] = useMemo(() => {
    if (isOwner) {
      return contextPhotos.map(p => {
        const ev = contextEvents.find(e => e.id === p.eventId);
        return {
          id: p.id,
          src: p.url,
          rider: p.rider || 'Unassigned',
          horse: p.horse || p.fileName || 'Unassigned',
          event: ev?.title || 'Event',
          eventId: p.eventId,
          date: ev?.date || p.uploadDate || 'Today',
          width: p.width,
          height: p.height,
          className: p.className || 'Unassigned class',
          time: p.timestamp || '12:00',
          city: ev?.city || 'Sweden',
          arena: ev?.venueName || 'Main Arena',
          countryCode: 'SE',
          discipline: ev?.disciplines?.[0] || 'Showjumping',
          photographer: photographer
            ? `${photographer.firstName} ${photographer.lastName}`.trim()
            : undefined,
          photographerId: loggedInId,
        };
      });
    }

    return photos;
  }, [contextEvents, contextPhotos, isOwner, loggedInId, photographer, photos]);

  const galleryEvents = useMemo(() => {
    const groups = new Map<
      string,
      {
        id: string;
        title: string;
        date: string;
        city: string;
        cover: string;
        photos: Photo[];
      }
    >();

    profilePhotos.forEach(photo => {
      const event = contextEvents.find(e => e.id === photo.eventId);
      const fallbackEvent = mockEvents.find(e => e.id === photo.eventId);
      const existing = groups.get(photo.eventId);

      if (existing) {
        existing.photos.push(photo);
        return;
      }

      groups.set(photo.eventId, {
        id: photo.eventId,
        title: event?.title || fallbackEvent?.name || photo.event || 'Event',
        date: event?.dateRange || event?.date || fallbackEvent?.period || photo.date,
        city: event?.city || fallbackEvent?.city || photo.city,
        cover: photo.src,
        photos: [photo],
      });
    });

    return Array.from(groups.values()).sort(
      (a, b) => b.photos.length - a.photos.length
    );
  }, [contextEvents, profilePhotos]);

  const selectedGalleryEvent = galleryEvents.find(
    event => event.id === galleryEventId
  );

  const galleryClasses = useMemo(() => {
    if (!selectedGalleryEvent) return [];

    const groups = new Map<
      string,
      { key: string; name: string; cover: string; photos: Photo[] }
    >();

    selectedGalleryEvent.photos.forEach(photo => {
      const name = photo.className || 'Unassigned class';
      const key = name.toLowerCase();
      const existing = groups.get(key);

      if (existing) {
        existing.photos.push(photo);
        return;
      }

      groups.set(key, {
        key,
        name,
        cover: photo.src,
        photos: [photo],
      });
    });

    return Array.from(groups.values()).sort(
      (a, b) => b.photos.length - a.photos.length
    );
  }, [selectedGalleryEvent]);

  const selectedGalleryClass = galleryClasses.find(
    classGroup => classGroup.key === galleryClassKey
  );

  const totalEvents = galleryEvents.length;
  const totalPhotosCount = profilePhotos.length;

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
    if (apiPhotographer) {
      return apiHighlightPhotos;
    }

    // Public mock view: Map IDs to mockData photos
    return (photographer?.highlights || [])
      .map(id => mockPhotos.find(p => p.id === id))
      .filter((p): p is Photo => !!p);
  }, [
    apiHighlightPhotos,
    apiPhotographer,
    isOwner,
    contextHighlights,
    contextPhotos,
    photographer?.highlights,
    contextEvents,
  ]);

  // Guard after all hooks
  if (isLoadingApiPhotographer) {
    return (
      <div className="page-wrapper">
        <Header />
        <div className="container flex justify-center items-center py-20">
          <div className="loading-spinner">Loading...</div>
        </div>
      </div>
    );
  }

  if (!activeProfile || !photographer) {
    return <div>Photographer not found</div>;
  }

  const photographerAvatar =
    resolveApiAssetUrl(
      'avatarUrl' in photographer ? photographer.avatarUrl : null
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
          <section className="photographer-gallery-section">
            <div className="container">
              {galleryEventId && (
                <div className="photographer-gallery-toolbar">
                  <button
                    type="button"
                    className="gallery-back-btn"
                    onClick={() => {
                      if (galleryClassKey) {
                        setGalleryClassKey('');
                        return;
                      }
                      setGalleryEventId('');
                    }}
                  >
                    <ChevronLeft size={18} />
                    {galleryClassKey ? 'Classes' : 'Events'}
                  </button>
                  <div className="gallery-path">
                    <span>{selectedGalleryEvent?.title}</span>
                    {selectedGalleryClass && (
                      <>
                        <span>/</span>
                        <span>{selectedGalleryClass.name}</span>
                      </>
                    )}
                  </div>
                </div>
              )}

              {!galleryEventId && galleryEvents.length > 0 && (
                <div className="photographer-gallery-grid">
                  {galleryEvents.map(event => {
                    const classCount = new Set(
                      event.photos.map(
                        photo => photo.className || 'Unassigned class'
                      )
                    ).size;

                    return (
                      <button
                        type="button"
                        key={event.id}
                        className="photographer-gallery-card"
                        onClick={() => setGalleryEventId(event.id)}
                      >
                        <img src={event.cover} alt="" />
                        <div className="photographer-gallery-card-body">
                          <h3>{event.title}</h3>
                          <p>
                            <CalendarDays size={14} />
                            {event.date}
                          </p>
                          <div className="photographer-gallery-meta">
                            <span>{event.photos.length} photos</span>
                            <span>{classCount} classes</span>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {galleryEventId && !galleryClassKey && galleryClasses.length > 0 && (
                <div className="photographer-gallery-grid">
                  {galleryClasses.map(classGroup => (
                    <button
                      type="button"
                      key={classGroup.key}
                      className="photographer-gallery-card"
                      onClick={() => setGalleryClassKey(classGroup.key)}
                    >
                      <img src={classGroup.cover} alt="" />
                      <div className="photographer-gallery-card-body">
                        <h3>{classGroup.name}</h3>
                        <p>
                          <Images size={14} />
                          {selectedGalleryEvent?.title}
                        </p>
                        <div className="photographer-gallery-meta">
                          <span>{classGroup.photos.length} photos</span>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {selectedGalleryClass && (
                <MasonryGrid>
                  {selectedGalleryClass.photos.map(photo => (
                    <PhotoCard
                      key={photo.id}
                      photo={photo}
                      onClick={p =>
                        navigate(
                          `/photo/${p.id}?from=ppro${
                            isOwner ? '&owner=1' : ''
                          }`,
                          {
                            state: { photo: p, isOwnerProfile: isOwner },
                          }
                        )
                      }
                      showCartActions={!isOwner}
                    />
                  ))}
                </MasonryGrid>
              )}

              {profilePhotos.length === 0 && (
                <div className="pg-empty-state">
                  <div className="pg-empty-icon">
                    <Search size={24} />
                  </div>
                  <h3>No uploaded photos yet</h3>
                  <p>
                    Upload photos to an event and they will appear here grouped
                    by event and class.
                  </p>
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
