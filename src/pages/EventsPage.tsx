import { useEffect, useMemo, useState } from 'react';
import { Header } from '../components/Header';
import { TitleHeader } from '../components/TitleHeader';
import { Footer } from '../components/Footer';
import { FolderEventCard } from '../components/FolderEventCard';
import type { EventData } from '../data/mockEvents';
import {
  fetchEventsFromApi,
  fetchEventsWithPhotosFromApi,
  fetchLatestPublicEventPhotoUrl,
} from '../data/eventsApi';
import { api, type ApiPhoto } from '../data/apiClient';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

import './guestHome.mobile.css';
import './mobileSearchFix.css';

export function EventsPage() {
  const navigate = useNavigate();
  const { isLoaded, isAuthenticated, user } = useAuth();

  const [events, setEvents] = useState<EventData[]>([]);
  const [latestPhotoCoverUrls, setLatestPhotoCoverUrls] = useState<
    Record<string, string | null>
  >({});
  const [isLoadingEvents, setIsLoadingEvents] = useState(true);
  const [eventsError, setEventsError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [eventSearchIndex, setEventSearchIndex] = useState<
    Record<string, string>
  >({});
  const [photoMatchedEventIds, setPhotoMatchedEventIds] = useState<
    Record<string, true>
  >({});
  const [eventMatchLabels, setEventMatchLabels] = useState<
    Record<string, string>
  >({});
  const [isSearchingPhotoMetadata, setIsSearchingPhotoMetadata] =
    useState(false);
  const shouldShowPhotoBackedEvents = !isAuthenticated || user?.role === 'pg';

  useEffect(() => {
    if (!isLoaded) return;

    let isMounted = true;

    async function loadEvents() {
      try {
        setIsLoadingEvents(true);
        setEventsError(null);
        const nextEvents = shouldShowPhotoBackedEvents
          ? await fetchEventsWithPhotosFromApi()
          : await fetchEventsFromApi();

        if (isMounted) setEvents(nextEvents);
      } catch (error) {
        if (isMounted) {
          setEventsError(
            error instanceof Error ? error.message : 'Failed to load events'
          );
        }
      } finally {
        if (isMounted) setIsLoadingEvents(false);
      }
    }

    void loadEvents();

    return () => {
      isMounted = false;
    };
  }, [isLoaded, shouldShowPhotoBackedEvents]);

  useEffect(() => {
    const query = searchQuery.trim();
    if (query.length < 2) {
      setPhotoMatchedEventIds({});
      setEventMatchLabels({});
      setIsSearchingPhotoMetadata(false);
      return;
    }

    const searchableEvents = events.filter(event => event.photoCount !== 0);
    if (searchableEvents.length === 0) {
      setPhotoMatchedEventIds({});
      setEventMatchLabels({});
      setIsSearchingPhotoMetadata(false);
      return;
    }

    let isMounted = true;
    setIsSearchingPhotoMetadata(true);

    const searchTimer = window.setTimeout(() => {
      async function searchEventPhotos() {
        const results = await Promise.all(
          searchableEvents.map(async event => {
            try {
              const [searchedPhotos, galleryPage] = await Promise.all([
                api.searchGallery(event.id, query),
                api.getEventGallery(event.id, 1, 25),
              ]);
              const photographerMatches = galleryPage.items.filter(photo =>
                (photo.photographer_display_name || '')
                  .toLowerCase()
                  .includes(query.toLowerCase())
              );
              const photosById = new Map(
                [...searchedPhotos, ...photographerMatches].map(photo => [
                  photo.id,
                  photo,
                ])
              );

              return [event.id, Array.from(photosById.values())] as const;
            } catch (error) {
              console.warn(
                `Failed to search photo metadata for event ${event.id}`,
                error
              );
              return [event.id, [] as ApiPhoto[]] as const;
            }
          })
        );

        if (!isMounted) return;

        const nextMatchedIds: Record<string, true> = {};
        const nextMatchLabels: Record<string, string> = {};
        const lowerQuery = query.toLowerCase();
        const getBestMatchLabel = (photos: ApiPhoto[]) => {
          const candidates = photos.flatMap(photo => [
            ...((photo.tags ?? []).map(tag => ({
              label:
                tag.type === 'rider'
                  ? 'Rider'
                  : tag.type === 'horse'
                    ? 'Horse'
                    : tag.type === 'class'
                      ? 'Class'
                      : tag.type,
              value: tag.value,
            })) || []),
            {
              label: 'Photographer',
              value: photo.photographer_display_name || '',
            },
          ]);

          const getMatchScore = (value: string) => {
            const normalizedValue = value.trim().toLowerCase();
            if (!normalizedValue) return 0;
            if (normalizedValue === lowerQuery) return 5;
            if (normalizedValue.startsWith(lowerQuery)) return 4;
            if (
              normalizedValue
                .split(/\s+/)
                .some(word => word.startsWith(lowerQuery))
            ) {
              return 3;
            }
            if (normalizedValue.includes(lowerQuery)) return 2;
            return 1;
          };

          const bestCandidate = candidates
            .filter(candidate => candidate.value)
            .sort(
              (a, b) =>
                getMatchScore(b.value) - getMatchScore(a.value) ||
                a.value.length - b.value.length
            )[0];

          return bestCandidate
            ? `${bestCandidate.label}: ${bestCandidate.value}`
            : '';
        };

        setEventSearchIndex(prev => {
          const next = { ...prev };

          results.forEach(([eventId, photos]) => {
            if (photos.length === 0) return;

            nextMatchedIds[eventId] = true;
            const matchLabel = getBestMatchLabel(photos);
            if (matchLabel) nextMatchLabels[eventId] = matchLabel;
            const photoText = photos
              .flatMap(photo => [
                photo.photographer_display_name,
                photo.class_name,
                photo.event_class_name,
                ...(photo.tags ?? []).map(tag => tag.value),
              ])
              .filter(Boolean)
              .join(' ');

            next[eventId] = [next[eventId], query, photoText]
              .filter(Boolean)
              .join(' ');
          });

          return next;
        });
        setPhotoMatchedEventIds(nextMatchedIds);
        setEventMatchLabels(nextMatchLabels);
        setIsSearchingPhotoMetadata(false);
      }

      void searchEventPhotos();
    }, 250);

    return () => {
      isMounted = false;
      window.clearTimeout(searchTimer);
    };
  }, [events, searchQuery]);

  const filteredEvents = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return events;

    return events.filter(event => {
      const searchableText = [
        event.name,
        event.city,
        event.country,
        event.discipline,
        event.photographer?.name,
        eventSearchIndex[event.id],
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return (
        searchableText.includes(query) ||
        Boolean(photoMatchedEventIds[event.id])
      );
    });
  }, [events, eventSearchIndex, photoMatchedEventIds, searchQuery]);

  useEffect(() => {
    const eventsMissingCovers = filteredEvents.filter(
      event =>
        !event.coverImage &&
        event.photoCount !== 0 &&
        !Object.prototype.hasOwnProperty.call(latestPhotoCoverUrls, event.id)
    );

    if (eventsMissingCovers.length === 0) return;

    let isMounted = true;

    async function loadLatestPhotoCovers() {
      const coverEntries = await Promise.all(
        eventsMissingCovers.map(async event => {
          try {
            const url = await fetchLatestPublicEventPhotoUrl(event.id);
            return [event.id, url] as const;
          } catch (error) {
            console.warn(
              `Failed to load fallback cover for event ${event.id}`,
              error
            );
            return [event.id, null] as const;
          }
        })
      );

      if (!isMounted) return;

      setLatestPhotoCoverUrls(prev => {
        const next = { ...prev };
        coverEntries.forEach(([eventId, url]) => {
          next[eventId] = url;
        });
        return next;
      });
    }

    void loadLatestPhotoCovers();

    return () => {
      isMounted = false;
    };
  }, [filteredEvents, latestPhotoCoverUrls]);

  const displayEvents = useMemo(
    () =>
      filteredEvents.map(event => {
        const latestPhotoCoverUrl = latestPhotoCoverUrls[event.id];

        if (event.coverImage || !latestPhotoCoverUrl) {
          return event;
        }

        return {
          ...event,
          coverImage: latestPhotoCoverUrl,
        };
      }),
    [filteredEvents, latestPhotoCoverUrls]
  );

  return (
    <div className="page-wrapper ehome-page guestHome">
      <Header
        searchEvents={displayEvents}
        eventSearchIndex={eventSearchIndex}
        eventMatchLabels={eventMatchLabels}
        onSearchChange={setSearchQuery}
      />

      <div className="ehome-intro-inner">
        <TitleHeader
          title="Your best moments, captured"
          description="We capture horse competitions across Sweden. Search your event, spot your photos, and purchase your favorites."
          variant="ehome"
          searchEvents={displayEvents}
          eventSearchIndex={eventSearchIndex}
          eventMatchLabels={eventMatchLabels}
          onSearchChange={setSearchQuery}
        />
      </div>

      <section className="grid-section">
        <div className="container">
          <h2 className="section-title">Browse events</h2>

          {isLoadingEvents ? (
            <div className="pg-empty-state">
              <h3>Loading events...</h3>
            </div>
          ) : eventsError ? (
            <div className="pg-empty-state">
              <h3>Events could not be loaded</h3>
              <p>{eventsError}</p>
            </div>
          ) : displayEvents.length > 0 ? (
            <div className="events-folders-grid">
              {displayEvents.map(event => (
                <FolderEventCard
                  key={event.id}
                  event={event}
                  onClick={id => navigate(`/event/${id}`)}
                />
              ))}
            </div>
          ) : (
            <div className="pg-empty-state">
              <h3>
                {isSearchingPhotoMetadata
                  ? 'Searching photos...'
                  : searchQuery.trim()
                  ? `No events match "${searchQuery.trim()}"`
                  : 'No events available – yet'}
              </h3>
            </div>
          )}
        </div>
      </section>
      <Footer minimal={false} />
    </div>
  );
}
