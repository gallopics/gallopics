import { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  CalendarDays,
  Clock,
  MapPin,
  RotateCcw,
  UploadCloud,
  AlertCircle,
  Trash2,
} from 'lucide-react';
import { Header } from '../components/Header';
import { TitleHeader } from '../components/TitleHeader';
import { Breadcrumbs } from '../components/Breadcrumbs';
import { Footer } from '../components/Footer';
import { PhotoCard } from '../components/PhotoCard';
import { ModernDropdown } from '../components/ModernDropdown';
import { InfoChip } from '../components/InfoChip';
import { eventDetails } from '../data/mockEventDetails';
import {
  buildApiEventDetail,
  fetchEventFromApi,
  fetchPublicEventPhotosFromApi,
  fetchEventScheduleFromApi,
  mapApiScheduleToDailySchedule,
} from '../data/eventsApi';
import type { EventData } from '../data/mockEvents';
import { PHOTOGRAPHERS } from '../data/mockData';
import {
  // ShareIconButton,
  ActionSeparator,
  ActionCluster,
} from '../components/HeaderActions';
import { ScopedSearchBar } from '../components/ScopedSearchBar';
import { PageTabs } from '../components/PageTabs';
import type { Photo as EventPhoto, ClassSection, EventDetail } from '../types';
import { usePhotographer } from '../context/PhotographerContext';
import { useAuth } from '../context/AuthContext';

export function EventProfile() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { getEvent, getPhotosByEvent, deletePhotos } = usePhotographer();
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
  const initialEventTab =
    typeof location.state === 'object' &&
    location.state !== null &&
    'eventTab' in location.state &&
    location.state.eventTab === 'classes'
      ? 'classes'
      : 'uploads';
  const workspaceEvent = eventId ? getEvent(eventId) : undefined;
  const isPhotographerMyEventView =
    (fromPath === '/pg/events' && fromTab === 'my') ||
    ((user?.role === 'pg' || user?.role === 'admin') &&
      Boolean(workspaceEvent?.isRegistered));
  const navigateBackToEvents = () => {
    navigate(fromPath, fromTab ? { state: { tab: fromTab } } : undefined);
  };

  const localEventDetail = eventDetails.find(e => e.meetingId === eventId);
  const [apiEventDetail, setApiEventDetail] = useState<EventDetail | null>(
    null
  );
  const [isLoadingEvent, setIsLoadingEvent] = useState(!localEventDetail);
  const [eventLoadError, setEventLoadError] = useState<string | null>(null);
  const eventDetail = localEventDetail || apiEventDetail;
  const eventPhotographer = useMemo(
    () => PHOTOGRAPHERS.find(p => p.primaryEventId === eventId),
    [eventId]
  );

  const [photos, setPhotos] = useState<EventPhoto[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState('');
  const [eventClass, setEventClass] = useState('All');
  const [activeEventTab, setActiveEventTab] = useState<'uploads' | 'classes'>(
    initialEventTab
  );
  const [photoToDelete, setPhotoToDelete] = useState<EventPhoto | null>(null);
  const [isDeletingPhoto, setIsDeletingPhoto] = useState(false);
  const eventReturnState = useMemo(
    () => ({
      from: fromPath,
      fromTab,
      eventTab: activeEventTab,
    }),
    [activeEventTab, fromPath, fromTab]
  );

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
            error instanceof Error ? error.message : 'Failed to load event'
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
      let isMounted = true;

      setLoading(true);
      const loadPhotos = async () => {
        if (!isPhotographerMyEventView && !localEventDetail) {
          const eventForPhotos: EventData = {
            id: eventDetail.meetingId,
            name: eventDetail.meeting.name,
            coverImage: eventDetail.meeting.coverImage,
            period: `${eventDetail.meeting.period.startDate} – ${eventDetail.meeting.period.endDate}`,
            startDate: eventDetail.meeting.period.startDate,
            endDate: eventDetail.meeting.period.endDate,
            flag: eventDetail.meeting.country.code === 'SE' ? '🇸🇪' : '',
            city: eventDetail.meeting.city,
            discipline: eventDetail.meeting.disciplines[0] || 'Equestrian',
            country: eventDetail.meeting.country.name,
            photoCount: eventDetail.meeting.photoCount,
            logo: eventDetail.meeting.logo,
            photographer: eventDetail.meeting.photographer || null,
            status: 'active',
          };

          const apiPhotos = await fetchPublicEventPhotosFromApi(eventForPhotos);
          if (isMounted) {
            setPhotos(apiPhotos);
            setLoading(false);
          }
          return;
        }

        if (isMounted) {
          setPhotos([]);
          setLoading(false);
        }
      };

      void loadPhotos();

      return () => {
        isMounted = false;
      };
    }
  }, [eventDetail, isPhotographerMyEventView, localEventDetail]);

  const isResetDisabled = eventClass === 'All' && searchQuery === '';

  // 1. Get List of all available Competitions for the event
  const allEventClasses = useMemo(() => {
    if (!eventDetail) return [];
    const classes: ClassSection[] = [];
    eventDetail.schedule.forEach(day =>
      day.arenas.forEach(arena =>
        arena.competitions.forEach(comp => classes.push(comp))
      )
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
        }))
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

  const uploadedPhotos = useMemo<EventPhoto[]>(() => {
    if (!isPhotographerMyEventView || !eventId || !eventDetail) return [];

    return getPhotosByEvent(eventId).map(photo => ({
      id: photo.id,
      src: photo.url,
      rider: photo.rider || 'Unassigned',
      horse:
        photo.horse || photo.className || photo.fileName || 'Uploaded photo',
      event: eventDetail.meeting.name,
      eventId,
      date: photo.uploadDate || eventDetail.meeting.period.startDate,
      width: photo.width,
      height: photo.height,
      className: photo.className || 'Uploaded',
      time: photo.timestamp || '',
      city: eventDetail.meeting.city,
      arena: photo.className || 'Uploaded',
      countryCode: eventDetail.meeting.country.code.toLowerCase(),
      photographer: eventDetail.meeting.photographer?.name || 'Gallopics',
      photographerId: eventDetail.meeting.photographer?.id,
    }));
  }, [eventDetail, eventId, getPhotosByEvent, isPhotographerMyEventView]);

  const uploadPhotos = isPhotographerMyEventView ? uploadedPhotos : photos;

  const combinedOptions = useMemo(() => {
    const uniqueRiders = Array.from(
      new Set(uploadPhotos.map(p => p.rider).filter(Boolean))
    ).sort();
    const uniqueHorses = Array.from(
      new Set(uploadPhotos.map(p => p.horse).filter(Boolean))
    ).sort();

    const riderOptions = uniqueRiders.map(r => {
      const photo = uploadPhotos.find(p => p.rider === r);
      return {
        label: r,
        value: r,
        type: 'rider' as const,
        subtitle: photo?.horse,
      };
    });

    const horseOptions = uniqueHorses.map(h => {
      const photo = uploadPhotos.find(p => p.horse === h);
      return {
        label: h,
        value: h,
        type: 'horse' as const,
        subtitle: photo?.rider,
      };
    });

    return [...riderOptions, ...horseOptions];
  }, [uploadPhotos]);

  // 3. Absolute Totals for Header (Stable)
  const totalRiders = useMemo(
    () => new Set(uploadPhotos.map(p => p.rider).filter(Boolean)).size,
    [uploadPhotos]
  );
  const totalHorses = useMemo(
    () => new Set(uploadPhotos.map(p => p.horse).filter(Boolean)).size,
    [uploadPhotos]
  );
  const displayedPhotoCount = uploadPhotos.length;

  // 4. Final Photo Filtering
  const activePhotos = useMemo(() => {
    if (!uploadPhotos.length) return [];
    return uploadPhotos.filter(p => {
      const matchClass =
        eventClass === 'All' ||
        p.arena === eventClass ||
        p.className === eventClass;

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
  }, [uploadPhotos, searchQuery, eventClass]);

  const handleConfirmDeletePhoto = async () => {
    if (!photoToDelete) return;

    try {
      setIsDeletingPhoto(true);
      await deletePhotos([photoToDelete.id]);
      setPhotoToDelete(null);
    } finally {
      setIsDeletingPhoto(false);
    }
  };

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
            {meeting.venueName && (
              <span className="meta-item">{meeting.venueName}</span>
            )}
            <span className="meta-item">{meeting.disciplines.join(', ')}</span>
          </div>
        }
        stats={
          <div className="event-stats-row">
            <span className="meta-item">{totalRiders} riders</span>
            <span className="meta-item">{totalHorses} horses</span>
            <span className="meta-item">{displayedPhotoCount} photos</span>
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
                  avatarUrl={undefined}
                  onClick={() =>
                    navigate(
                      `/photographer/${eventPhotographer.id}?from=event&eventId=${eventId}`
                    )
                  }
                />
                <ActionSeparator />
              </>
            )}
            {/* <ShareIconButton /> */}
          </ActionCluster>
        }
      />

      <section className="grid-section">
        <div className="container">
          <PageTabs
            tabs={[
              { id: 'uploads', label: 'Uploads' },
              { id: 'classes', label: 'Classes' },
            ]}
            activeTab={activeEventTab}
            onChange={tabId =>
              setActiveEventTab(tabId === 'classes' ? 'classes' : 'uploads')
            }
          />

          {activeEventTab === 'uploads' ? (
            <>
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

              <div className="event-photo-grid">
                {loading
                  ? Array.from({ length: 12 }).map((_, index) => (
                      <div
                        className="photo-card skeleton-card"
                        key={`event-skeleton-${index}`}
                      >
                        <div className="card-image-wrapper aspect-[3/4] bg-[var(--ui-bg-subtle)]"></div>
                        <div className="card-content">
                          <div className="h-4 w-[70%] bg-[var(--color-border)] mb-1.5 rounded-[4px]"></div>
                          <div className="h-3 w-[40%] bg-[var(--color-border)] rounded-[4px]"></div>
                        </div>
                      </div>
                    ))
                  : activePhotos.map(photo => (
                      <div
                        key={photo.id}
                        className={`relative group ${
                          isPhotographerMyEventView
                            ? 'event-photo-manage-card'
                            : ''
                        }`}
                      >
                        <PhotoCard
                          photo={photo}
                          showCartActions={true}
                          showShareActions={false}
                          onClick={p =>
                            navigate(
                              `/photo/${p.id}?from=epro&eventId=${meeting.id}`,
                              { state: { photo: p, eventReturnState } }
                            )
                          }
                        />
                        {isPhotographerMyEventView && (
                          <button
                            className="icon-btn-glass delete-action absolute top-3 right-3 z-40 opacity-100"
                            onClick={e => {
                              e.stopPropagation();
                              setPhotoToDelete(photo);
                            }}
                            title="Delete photo"
                            aria-label="Delete photo"
                          >
                            <Trash2 size={18} />
                          </button>
                        )}
                      </div>
                    ))}
              </div>
            </>
          ) : (
            <div className="event-classes-section">
              <div className="event-classes-header">
                <div>
                  <h2>Classes</h2>
                  <p>
                    {allEventClasses.length} classes scheduled for this event
                  </p>
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
                          }
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
                          onClick={() => {
                            if (isPhotographerMyEventView) {
                              const params = new URLSearchParams({
                                classSectionId: competition.classSectionId,
                                className: competition.name,
                              });
                              if (competition.equipeClassSectionId) {
                                params.set(
                                  'equipeClassSectionId',
                                  competition.equipeClassSectionId
                                );
                              }
                              if (competition.arenaName) {
                                params.set('arenaName', competition.arenaName);
                              }

                              navigate(
                                `/pg/events/${meeting.id}?${params.toString()}`,
                                {
                                  state: {
                                    selectedClassId: competition.classSectionId,
                                    selectedEquipeClassSectionId:
                                      competition.equipeClassSectionId,
                                    selectedClassName: competition.name,
                                    selectedArenaName: competition.arenaName,
                                    fromTab,
                                    fromUpload: true,
                                  },
                                }
                              );
                              return;
                            }

                            setEventClass(competition.name);
                            setActiveEventTab('uploads');
                          }}
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
                          {isPhotographerMyEventView && (
                            <span className="event-class-upload">
                              <UploadCloud size={14} />
                              Upload
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {photoToDelete && (
        <div className="pg-modal-overlay" style={{ zIndex: 3000 }}>
          <div className="pg-modal-card">
            <div className="flex gap-4 items-start">
              <div className="pg-alert-icon danger">
                <AlertCircle size={24} />
              </div>
              <div className="flex-1">
                <h3 className="mt-0 text-[1.125rem] font-bold text-primary mb-2">
                  Delete photo?
                </h3>
                <p className="m-0 text-secondary text-[0.875rem] leading-[1.5]">
                  This will remove the photo from this event.
                </p>
                <div className="modal-footer-actions">
                  <button
                    className="modal-btn-cancel"
                    onClick={() => setPhotoToDelete(null)}
                    disabled={isDeletingPhoto}
                  >
                    Cancel
                  </button>
                  <button
                    className="modal-btn-danger"
                    onClick={handleConfirmDeletePhoto}
                    disabled={isDeletingPhoto}
                  >
                    {isDeletingPhoto ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <Footer minimal={true} />
    </div>
  );
}
