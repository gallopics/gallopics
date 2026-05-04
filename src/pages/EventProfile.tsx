import { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { CalendarDays, Clock, MapPin, RotateCcw } from 'lucide-react';
import { Header } from '../components/Header';
import { TitleHeader } from '../components/TitleHeader';
import { Breadcrumbs } from '../components/Breadcrumbs';
import { Footer } from '../components/Footer';
import { MasonryGrid } from '../components/MasonryGrid';
import { PhotoCard } from '../components/PhotoCard';
import { ModernDropdown } from '../components/ModernDropdown';
import { InfoChip } from '../components/InfoChip';
import { eventDetails } from '../data/mockEventDetails';
import {
  buildApiEventDetail,
  fetchEventFromApi,
  fetchEventScheduleFromApi,
  mapApiScheduleToDailySchedule,
} from '../data/eventsApi';
import {
  photos as basePhotos,
  RIDERS,
  HORSES,
  RIDER_PRIMARY_HORSE,
  PHOTOGRAPHERS,
} from '../data/mockData';
import {
  ShareIconButton,
  ActionSeparator,
  ActionCluster,
} from '../components/HeaderActions';
import { ScopedSearchBar } from '../components/ScopedSearchBar';
import type { Photo, ClassSection, EventDetail, Meeting } from '../types';
import { assetUrl } from '../lib/utils';

// Helpers for randomization
function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

const randomInt = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min) + min);

const generateEventPhotos = (
  eventId: string,
  count: number,
  discipline?: string,
  meetingOverride?: Meeting,
  eventClasses: ClassSection[] = [],
): Photo[] => {
  const srcPool = Array.from(new Set(basePhotos.map(p => p.src)));
  const comp =
    meetingOverride || eventDetails.find(e => e.meetingId === eventId)?.meeting;
  const eventName = comp?.name || 'Gallopics Event';
  const eventDate = comp?.period.startDate || '2026-01-01';

  return Array.from({ length: count }).map((_, i) => {
    const src = pick(srcPool);
    const rider = pick(RIDERS);
    const competition = eventClasses.length > 0 ? pick(eventClasses) : null;
    const horseMapping = RIDER_PRIMARY_HORSE.find(m => m.riderId === rider.id);
    const horse =
      HORSES.find(h => h.id === horseMapping?.primaryHorseId) || HORSES[0];

    const ratioType = Math.random();
    let width = 600;
    let height = 800;

    if (ratioType > 0.66) {
      width = 800;
      height = 600;
    } else if (ratioType > 0.33) {
      width = 800;
      height = 800;
    }

    if (ratioType < 0.33) {
      height += randomInt(-50, 50);
    }

    return {
      id: `${eventId}-p-${i}-${Math.random().toString(36).substr(2, 5)}`,
      src,
      rider: `${rider.firstName} ${rider.lastName}`,
      horse: horse.name,
      event: eventName,
      eventId: eventId,
      date: eventDate,
      width,
      height,
      className: 'photo-grid-item',
      time: `${9 + (i % 8)}:00`,
      city: comp?.city || 'Sweden',
      arena: competition?.name || 'Main Arena',
      countryCode: comp?.country.code.toLowerCase() || 'se',
      discipline: competition?.discipline || discipline || 'Show Jumping',
      photographer: comp?.photographer?.name || 'Gallopics',
      photographerId: comp?.photographer?.id,
    };
  });
};

export function EventProfile() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const fromPath =
    typeof location.state === 'object' &&
    location.state !== null &&
    'from' in location.state &&
    typeof location.state.from === 'string'
      ? location.state.from
      : '/';
  const fromTab =
    typeof location.state === 'object' &&
    location.state !== null &&
    'fromTab' in location.state &&
    typeof location.state.fromTab === 'string'
      ? location.state.fromTab
      : undefined;
  const navigateBackToEvents = () => {
    navigate(fromPath, fromTab ? { state: { tab: fromTab } } : undefined);
  };

  const localEventDetail = eventDetails.find(e => e.meetingId === eventId);
  const [apiEventDetail, setApiEventDetail] = useState<EventDetail | null>(
    null,
  );
  const [isLoadingEvent, setIsLoadingEvent] = useState(!localEventDetail);
  const [eventLoadError, setEventLoadError] = useState<string | null>(null);
  const eventDetail = localEventDetail || apiEventDetail;
  const eventPhotographer = useMemo(
    () => PHOTOGRAPHERS.find(p => p.primaryEventId === eventId),
    [eventId],
  );

  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState('');
  const [eventClass, setEventClass] = useState('All');

  useEffect(() => {
    if (localEventDetail || !eventId) {
      setIsLoadingEvent(false);
      return;
    }

    const apiEventId = eventId;
    let isMounted = true;

    async function loadEvent() {
      try {
        setIsLoadingEvent(true);
        setEventLoadError(null);
        const apiEvent = await fetchEventFromApi(apiEventId);
        let schedule;

        try {
          const apiSchedule = await fetchEventScheduleFromApi(apiEvent.id);
          schedule = mapApiScheduleToDailySchedule(apiSchedule);
        } catch (scheduleError) {
          console.warn('Failed to load event schedule', scheduleError);
        }

        if (isMounted) {
          setApiEventDetail(buildApiEventDetail(apiEvent, schedule));
        }
      } catch (error) {
        if (isMounted) {
          setEventLoadError(
            error instanceof Error ? error.message : 'Failed to load event',
          );
        }
      } finally {
        if (isMounted) setIsLoadingEvent(false);
      }
    }

    void loadEvent();

    return () => {
      isMounted = false;
    };
  }, [eventId, localEventDetail]);

  useEffect(() => {
    if (eventDetail) {
      setLoading(true);
      setTimeout(() => {
        const eventClasses = eventDetail.schedule.flatMap(day =>
          day.arenas.flatMap(arena => arena.competitions),
        );
        const generated = generateEventPhotos(
          eventDetail.meetingId,
          eventDetail.meeting.photoCount,
          eventDetail.meeting.disciplines[0],
          eventDetail.meeting,
          eventClasses,
        );
        setPhotos(generated);
        setLoading(false);
      }, 600);
    }
  }, [eventDetail]);

  const isResetDisabled = eventClass === 'All' && searchQuery === '';

  // 1. Get List of all available Competitions for the event
  const allEventClasses = useMemo(() => {
    if (!eventDetail) return [];
    const classes: ClassSection[] = [];
    eventDetail.schedule.forEach(day =>
      day.arenas.forEach(arena =>
        arena.competitions.forEach(comp => classes.push(comp)),
      ),
    );
    return classes;
  }, [eventDetail]);

  const classesByDay = useMemo(() => {
    if (!eventDetail) return [];

    return eventDetail.schedule.map(day => ({
      date: day.date,
      classes: day.arenas.flatMap(arena =>
        arena.competitions.map(competition => ({
          ...competition,
          arenaName: arena.name,
        })),
      ),
    }));
  }, [eventDetail]);

  const classOptions = useMemo(() => {
    const unique = Array.from(new Set(allEventClasses.map(c => c.name))).sort();
    return [
      { label: 'All Classes', value: 'All' },
      ...unique.map(c => ({ label: c, value: c })),
    ];
  }, [allEventClasses]);

  const combinedOptions = useMemo(() => {
    const uniqueRiders = Array.from(new Set(photos.map(p => p.rider))).sort();
    const uniqueHorses = Array.from(new Set(photos.map(p => p.horse))).sort();

    const riderOptions = uniqueRiders.map(r => {
      const photo = photos.find(p => p.rider === r);
      return {
        label: r,
        value: r,
        type: 'rider' as const,
        subtitle: photo?.horse,
      };
    });

    const horseOptions = uniqueHorses.map(h => {
      const photo = photos.find(p => p.horse === h);
      return {
        label: h,
        value: h,
        type: 'horse' as const,
        subtitle: photo?.rider,
      };
    });

    return [...riderOptions, ...horseOptions];
  }, [photos]);

  // 3. Absolute Totals for Header (Stable)
  const totalRiders = useMemo(
    () => new Set(photos.map(p => p.rider)).size,
    [photos],
  );
  const totalHorses = useMemo(
    () => new Set(photos.map(p => p.horse)).size,
    [photos],
  );

  // 4. Final Photo Filtering
  const activePhotos = useMemo(() => {
    if (!photos.length) return [];
    return photos.filter(p => {
      const matchClass = eventClass === 'All' || p.arena === eventClass;

      // Search Query Logic: Matches either Rider OR Horse
      let matchSearch = true;
      if (searchQuery && searchQuery.trim().length > 0) {
        const q = searchQuery.toLowerCase();
        matchSearch =
          p.rider.toLowerCase().includes(q) ||
          p.horse.toLowerCase().includes(q);
      }

      return matchClass && matchSearch;
    });
  }, [photos, searchQuery, eventClass]);

  if (isLoadingEvent)
    return <div className="container pt-[120px]">Loading event...</div>;

  if (!eventDetail)
    return (
      <div className="container pt-[120px]">
        {eventLoadError || 'Event not found'}
      </div>
    );

  const { meeting } = eventDetail;

  const TODAY = new Date();
  TODAY.setHours(0, 0, 0, 0);
  const eventStart = new Date(meeting.period.startDate);
  const eventEnd = new Date(meeting.period.endDate);
  eventEnd.setHours(23, 59, 59, 999);
  const isLive = TODAY >= eventStart && TODAY <= eventEnd;

  return (
    <div className="page-wrapper">
      <Header />

      <Breadcrumbs
        items={[
          { label: 'Events', onClick: navigateBackToEvents },
          { label: meeting.name, active: true },
        ]}
      />

      <TitleHeader
        className="event-page-header"
        title={meeting.name}
        avatar={meeting.logo || undefined}
        avatarShape="square"
        avatarMobileRow={true}
        topSubtitle={
          <span className="meta-item">
            {new Date(meeting.period.startDate).toLocaleDateString('en-GB', {
              day: 'numeric',
              month: 'short',
            })}
            {' - '}
            {new Date(meeting.period.endDate).toLocaleDateString('en-GB', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            })}
          </span>
        }
        subtitle={
          <div className="event-meta-row no-underline">
            {isLive && (
              <span className="meta-item">
                <span className="bg-[#FF0000] text-white px-2 py-0.5 rounded-[4px] text-[10px] font-bold uppercase tracking-wide leading-none inline-flex items-center">
                  LIVE
                </span>
              </span>
            )}
            <span className="meta-item">
              {meeting.country.code === 'SE' && <span>🇸🇪</span>}
              <span>{meeting.city}</span>
            </span>
            <span className="meta-item">{meeting.venueName}</span>
            <span className="meta-item">{meeting.disciplines.join(', ')}</span>
          </div>
        }
        stats={
          <div className="event-stats-row">
            <span className="meta-item">{totalRiders} riders</span>
            <span className="meta-item">{totalHorses} horses</span>
            <span className="meta-item">{meeting.photoCount} photos</span>
          </div>
        }
        rightContent={
          <ActionCluster>
            {eventPhotographer && (
              <>
                <InfoChip
                  label="Photographer"
                  name={`${eventPhotographer.firstName} ${eventPhotographer.lastName}`}
                  variant="photographer"
                  avatarUrl={assetUrl(
                    `images/${eventPhotographer.firstName} ${eventPhotographer.lastName}.jpg`,
                  )}
                  onClick={() =>
                    navigate(
                      `/photographer/${eventPhotographer.id}?from=event&eventId=${eventId}`,
                    )
                  }
                />
                <ActionSeparator />
              </>
            )}
            <ShareIconButton />
          </ActionCluster>
        }
      />

      <section className="grid-section">
        <div className="container">
          <div className="filters-wrapper">
            <div className="filter-container">
              <div className="filter-group">
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

            </div>
          </div>

          <div className="event-classes-section">
            <div className="event-classes-header">
              <div>
                <h2>Classes</h2>
                <p>{allEventClasses.length} classes scheduled for this event</p>
              </div>
            </div>

            <div className="event-classes-days">
              {classesByDay.map(day => (
                <div className="event-classes-day" key={day.date}>
                  <div className="event-classes-date">
                    <CalendarDays size={16} />
                    <span>
                      {new Date(`${day.date}T00:00:00`).toLocaleDateString(
                        'en-GB',
                        {
                          weekday: 'short',
                          day: 'numeric',
                          month: 'short',
                        },
                      )}
                    </span>
                  </div>

                  <div className="event-classes-list">
                    {day.classes.map(competition => (
                      <button
                        key={competition.classSectionId}
                        className={`event-class-row ${
                          eventClass === competition.name ? 'active' : ''
                        }`}
                        onClick={() => setEventClass(competition.name)}
                      >
                        <span className="event-class-time">
                          <Clock size={14} />
                          {competition.startTime}
                        </span>
                        <span className="event-class-name">
                          {competition.name}
                        </span>
                        <span className="event-class-arena">
                          <MapPin size={14} />
                          {competition.arenaName}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <MasonryGrid
            isLoading={loading}
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
            {activePhotos.map(photo => (
              <PhotoCard
                key={photo.id}
                photo={photo}
                onClick={p =>
                  navigate(`/photo/${p.id}?from=epro&eventId=${meeting.id}`)
                }
              />
            ))}
          </MasonryGrid>

        </div>
      </section>

      <Footer minimal={true} />
    </div>
  );
}
