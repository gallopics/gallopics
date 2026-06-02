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
  const shouldShowPhotoBackedEvents =
    !isAuthenticated || user?.role === 'pg';

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
            error instanceof Error ? error.message : 'Failed to load events',
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

  const filteredEvents = events;

  useEffect(() => {
    const eventsMissingCovers = filteredEvents.filter(
      event =>
        !event.coverImage &&
        event.photoCount !== 0 &&
        !Object.prototype.hasOwnProperty.call(latestPhotoCoverUrls, event.id),
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
              error,
            );
            return [event.id, null] as const;
          }
        }),
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
    [filteredEvents, latestPhotoCoverUrls],
  );

  return (
    <div className="page-wrapper ehome-page guestHome">
      <Header />

      <div className="ehome-intro-inner">
        <TitleHeader
          title="Your best moments, captured"
          description="We capture horse competitions across Sweden. Search your event, spot your photos, and purchase your favorites."
          variant="ehome"
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
                No events available – yet
              </h3>
            </div>
          )}
        </div>
      </section>
      <Footer minimal={false} />
    </div>
  );
}
