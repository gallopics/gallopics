import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth as useClerkAuth } from '@clerk/clerk-react';
import {
  X,
  Search,
  RotateCcw,
  MoreHorizontal,
  Edit2,
  Archive,
  Trash2,
  CheckCircle,
  AlertCircle,
  CalendarX2,
  CalendarPlus,
  Loader2,
} from 'lucide-react';
import { useWorkspace } from '../../context/WorkspaceContext';
import { useAuth } from '../../context/AuthContext';

import {
  usePhotographer,
  type PgEvent,
} from '../../context/PhotographerContext';
import { ModernDropdown } from '../../components/ModernDropdown';
import { Button } from '../../components/Button';
import { FilterChip } from '../../components/FilterChip';
import { TitleHeader } from '../../components/TitleHeader';
import { PgEventCard } from './components/PgEventCard';
import { CoverImagePickerModal } from './components/CoverImagePickerModal';
import { AddEventModal } from './components/AddEventModal';
import { PgToast } from './PgToast';
import { fetchEventsFromApi, mapApiEventToEventData } from '../../data/eventsApi';
import { api, ApiError, type ApiEvent } from '../../data/apiClient';
import type { EventData } from '../../data/mockEvents';
import { assetUrl } from '../../lib/utils';
import '../../styles/shared-filters.css';

const mapApiEventToPgEvent = (event: EventData): PgEvent => ({
  id: event.id,
  title: event.name,
  date: event.startDate || event.period,
  dateRange: event.period,
  location: `${event.city}, ${event.country}`,
  coverImage: event.coverImage,
  status: 'upcoming',
  isRegistered: false,
  photosCount: event.photoCount || 0,
  publishedCount: 0,
  soldCount: 0,
  logo: event.logo || event.coverImage || assetUrl('images/events/default.png'),
  venueName: event.name,
  disciplines: [event.discipline],
  city: event.city,
  assignedPhotographers: event.photographer ? [event.photographer] : [],
  applicationsWelcomed: event.status !== 'disabled',
});

const mapBackendEventToPgEvent = (
  event: ApiEvent,
  isRegistered: boolean,
): PgEvent => ({
  ...mapApiEventToPgEvent(mapApiEventToEventData(event)),
  isRegistered,
  status: isRegistered ? 'open' : 'upcoming',
});

export const EventsList: React.FC = () => {
  const { isAdmin } = useWorkspace();
  const { user } = useAuth();
  const { events } = usePhotographer();
  const { getToken } = useClerkAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const initialTab = (location.state as any)?.tab;
  const [view, setView] = useState<
    'my' | 'upcoming' | 'live' | 'past' | 'archived'
  >(initialTab ?? (isAdmin ? 'live' : 'my'));
  const [county, setCounty] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  const [activePickerEventId, setActivePickerEventId] = useState<string | null>(
    null
  );
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [eventToEdit, setEventToEdit] = useState<any>(null);
  const [showApplyToast, setShowApplyToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('Booking updated.');
  const [apiUpcomingEvents, setApiUpcomingEvents] = useState<PgEvent[]>([]);
  const [bookedEvents, setBookedEvents] = useState<PgEvent[]>([]);
  const [bookingEventId, setBookingEventId] = useState<string | null>(null);
  const [isLoadingUpcomingEvents, setIsLoadingUpcomingEvents] = useState(false);
  const [upcomingEventsError, setUpcomingEventsError] = useState<string | null>(
    null,
  );

  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    type: 'archive' | 'delete';
    event: any;
  } | null>(null);

  const syncLocalPhotographerProfile = useCallback(async () => {
    if (!user || user.role === 'admin') {
      return;
    }

    await api.upsertMyPhotographer(getToken, {
      slug: user.id,
      display_name: user.displayName || 'Photographer',
      city: user.city || null,
      country: user.country || null,
      avatar_url: user.avatarUrl ?? null,
      phone: user.phone ?? null,
      is_available_to_hire: true,
    });
  }, [
    getToken,
    user?.avatarUrl,
    user?.city,
    user?.country,
    user?.displayName,
    user?.id,
    user?.phone,
    user?.role,
  ]);

  useEffect(() => {
    if (isAdmin) return;

    let isMounted = true;

    async function loadEvents() {
      try {
        setIsLoadingUpcomingEvents(true);
        setUpcomingEventsError(null);
        const apiEvents = await fetchEventsFromApi();
        let bookings: ApiEvent[] = [];

        try {
          bookings = await api.listMyEventBookings(getToken);
        } catch (bookingsError) {
          if (
            bookingsError instanceof ApiError &&
            bookingsError.status === 403
          ) {
            await syncLocalPhotographerProfile();
            bookings = await api.listMyEventBookings(getToken);
          } else {
            console.warn('Failed to load event bookings', bookingsError);
          }
        }

        if (isMounted) {
          const booked = bookings.map(event =>
            mapBackendEventToPgEvent(event, true),
          );
          const bookedIds = new Set(booked.map(event => event.id));
          setBookedEvents(booked);
          setApiUpcomingEvents(
            apiEvents
              .map(mapApiEventToPgEvent)
              .map(event =>
                bookedIds.has(event.id)
                  ? { ...event, isRegistered: true, status: 'open' }
                  : event,
              ),
          );
        }
      } catch (error) {
        if (isMounted) {
          setUpcomingEventsError(
            error instanceof Error ? error.message : 'Failed to load events',
          );
          setApiUpcomingEvents([]);
          setBookedEvents([]);
        }
      } finally {
        if (isMounted) setIsLoadingUpcomingEvents(false);
      }
    }

    void loadEvents();

    return () => {
      isMounted = false;
    };
  }, [getToken, isAdmin, syncLocalPhotographerProfile]);

  // Filter Logic
  const bookedEventIds = useMemo(
    () => new Set(bookedEvents.map(event => event.id)),
    [bookedEvents],
  );
  const workspaceEvents = useMemo(() => {
    if (isAdmin) return events;
    const localEventsWithoutBookedApiDupes = events.filter(
      event => !bookedEventIds.has(event.id),
    );
    return [...bookedEvents, ...localEventsWithoutBookedApiDupes];
  }, [bookedEventIds, bookedEvents, events, isAdmin]);

  const eventSource =
    !isAdmin && view === 'upcoming' ? apiUpcomingEvents : workspaceEvents;

  const filteredEvents = eventSource.filter(e => {
    const matchesCounty =
      !county || e.city.toLowerCase().includes(county.toLowerCase());
    const matchesSearch =
      !searchTerm ||
      e.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (e.assignedPhotographers &&
        e.assignedPhotographers.some(p =>
          p.name.toLowerCase().includes(searchTerm.toLowerCase())
        ));
    return matchesCounty && matchesSearch;
  });

  const myEvents = filteredEvents.filter(
    e => e.isRegistered || e.status === 'open'
  );
  const liveEvents = filteredEvents.filter(e => e.status === 'open');
  const pastEvents = filteredEvents.slice(2, 4); // Mock: slice some distinct ones for past
  const upcomingEvents = filteredEvents.filter(
    e => e.status === 'upcoming' && !e.isRegistered
  );
  const archivedEvents =
    filteredEvents.filter(e => e.status === 'archived').length > 0
      ? filteredEvents.filter(e => e.status === 'archived')
      : filteredEvents.slice(-2); // Fallback if no status match

  const handleBookEvent = async (event: PgEvent, e?: React.MouseEvent) => {
    e?.stopPropagation();
    try {
      setBookingEventId(event.id);
      let booked: ApiEvent;
      try {
        booked = await api.bookEvent(getToken, event.id);
      } catch (bookingError) {
        if (!(bookingError instanceof ApiError) || bookingError.status !== 403) {
          throw bookingError;
        }

        await syncLocalPhotographerProfile();
        booked = await api.bookEvent(getToken, event.id);
      }
      const bookedPgEvent = mapBackendEventToPgEvent(booked, true);
      setBookedEvents(prev => [
        bookedPgEvent,
        ...prev.filter(item => item.id !== event.id),
      ]);
      setApiUpcomingEvents(prev =>
        prev.map(item =>
          item.id === event.id
            ? { ...item, isRegistered: true, status: 'open' }
            : item,
        ),
      );
      setToastMessage('Event booked.');
      setShowApplyToast(true);
      setTimeout(() => setShowApplyToast(false), 3000);
    } catch (error) {
      setUpcomingEventsError(
        error instanceof Error ? error.message : 'Failed to book event',
      );
    } finally {
      setBookingEventId(null);
    }
  };

  const handleCancelBooking = async (event: PgEvent, e?: React.MouseEvent) => {
    e?.stopPropagation();
    try {
      setBookingEventId(event.id);
      await api.cancelEventBooking(getToken, event.id);
      setBookedEvents(prev => prev.filter(item => item.id !== event.id));
      setApiUpcomingEvents(prev =>
        prev.map(item =>
          item.id === event.id
            ? { ...item, isRegistered: false, status: 'upcoming' }
            : item,
        ),
      );
      setToastMessage('Booking cancelled.');
      setShowApplyToast(true);
      setTimeout(() => setShowApplyToast(false), 3000);
    } catch (error) {
      setUpcomingEventsError(
        error instanceof Error ? error.message : 'Failed to cancel booking',
      );
    } finally {
      setBookingEventId(null);
    }
  };

  const handleCoverChange = (eventId: string) => {
    setActivePickerEventId(eventId);
  };

  const handleNavigateToEvent = (eventId: string) => {
    const basePath = isAdmin ? '/admin' : '/pg';
    navigate(`${basePath}/events/${eventId}`, { state: { fromTab: view } });
  };

  const handleOpenUpcomingEvent = (eventId: string) => {
    if (isPhotographerUpcomingView) {
      navigate(`/event/${eventId}`, {
        state: { from: '/pg/events', fromTab: view },
      });
      return;
    }

    if (isAdmin) {
      handleNavigateToEvent(eventId);
    }
  };

  const activeList = useMemo(() => {
    if (isAdmin) {
      if (view === 'live') return liveEvents;
      if (view === 'past') return pastEvents;
      if (view === 'archived') return archivedEvents;
      if (view === 'upcoming') return upcomingEvents.slice(3);
      return upcomingEvents;
    }
    return view === 'upcoming' ? upcomingEvents : myEvents;
  }, [
    archivedEvents,
    isAdmin,
    liveEvents,
    myEvents,
    pastEvents,
    upcomingEvents,
    view,
  ]);
  const isPhotographerUpcomingView = !isAdmin && view === 'upcoming';
  const isPhotographerMyEventsLoading =
    !isAdmin && view === 'my' && isLoadingUpcomingEvents && myEvents.length === 0;

  return (
    <div className="pg-events-container" onClick={() => setActiveMenuId(null)}>
      <header className="pg-events-page-header">
        <TitleHeader
          variant="workspace"
          title="Events"
          rightContent={
            isAdmin && (
              <Button
                variant="primary"
                size="small"
                onClick={() => {
                  setEventToEdit(null);
                  setIsAddModalOpen(true);
                }}
              >
                Add an event
              </Button>
            )
          }
        />

        {/* Row B: Tabs only */}
        <div className="pg-events-header-controls">
          <div className="container">
            <div className="pg-events-header-row-b">
              <div className="pg-tabs-list">
                {isAdmin ? (
                  <>
                    <button
                      className={`pg-tab-btn ${
                        view === 'live' ? 'active' : ''
                      }`}
                      onClick={() => setView('live')}
                    >
                      Live events
                    </button>
                    <button
                      className={`pg-tab-btn ${
                        view === 'past' ? 'active' : ''
                      }`}
                      onClick={() => setView('past')}
                    >
                      Past events
                    </button>
                    <button
                      className={`pg-tab-btn ${
                        view === 'upcoming' ? 'active' : ''
                      }`}
                      onClick={() => setView('upcoming')}
                    >
                      Upcoming
                    </button>
                    <button
                      className={`pg-tab-btn ${
                        view === 'archived' ? 'active' : ''
                      }`}
                      onClick={() => setView('archived')}
                    >
                      Archived
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      className={`pg-tab-btn ${view === 'my' ? 'active' : ''}`}
                      onClick={() => setView('my')}
                    >
                      My events
                    </button>
                    <button
                      className={`pg-tab-btn ${
                        view === 'upcoming' ? 'active' : ''
                      }`}
                      onClick={() => setView('upcoming')}
                    >
                      Upcoming
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Filter Bar */}
      <div className="filters-wrapper">
        <div className="container">
          <div className="filter-container">
            <div className="filter-group">
              <ModernDropdown
                value="Sweden"
                options={[{ label: 'Sweden', value: 'Sweden', icon: '🇸🇪' }]}
                onChange={() => {}}
                icon="🇸🇪"
                variant="pill"
                label="Country"
              />
              <ModernDropdown
                value={county}
                options={[
                  { label: 'All counties', value: '' },
                  { label: 'Skåne', value: 'Skane' },
                  { label: 'Stockholm', value: 'Stockholm' },
                  { label: 'Västra Götaland', value: 'VastraGotaland' },
                ]}
                onChange={val => setCounty(val)}
                placeholder="Select county"
                variant="pill"
                label="County"
              />
              <button
                className="filter-reset-btn"
                onClick={() => {
                  setCounty('');
                  setSearchTerm('');
                }}
                title="Reset filters"
                disabled={!county && !searchTerm}
              >
                <RotateCcw size={18} />
              </button>
            </div>

            <div className="search-group">
              <div className="admin-search-bar">
                <Search className="search-icon" size={17} />
                <input
                  type="text"
                  placeholder="Search event name, city, organiser..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
                {searchTerm && (
                  <button
                    className="clear-btn"
                    onClick={() => setSearchTerm('')}
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            </div>

            <div className="pg-events-filter-right">
              <div className="filter-results-count">
                Showing {activeList.length} events
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* List Content */}
      {isAdmin || view === 'upcoming' ? (
        <div className="pg-events-list upcoming-list">
          {isPhotographerUpcomingView && isLoadingUpcomingEvents ? (
            <div className="pg-empty-state">
              <div className="pg-empty-icon">
                <CalendarPlus size={24} />
              </div>
              <h3>Loading events...</h3>
              <p>Fetching the latest event list.</p>
            </div>
          ) : isPhotographerUpcomingView && upcomingEventsError ? (
            <div className="pg-empty-state">
              <div className="pg-empty-icon">
                <AlertCircle size={24} />
              </div>
              <h3>Could not load events</h3>
              <p>{upcomingEventsError}</p>
            </div>
          ) : activeList.length === 0 ? (
            <div className="pg-empty-state">
              <div className="pg-empty-icon">
                <CalendarX2 size={24} />
              </div>
              <h3>No events available – yet</h3>
              <p>
                Try adjusting your filters or search to find matching events.
              </p>
            </div>
          ) : (
            activeList.map(event => {
              const isApplied =
                !isAdmin &&
                view === 'upcoming' &&
                event.isRegistered === true;
              return (
                <div
                  key={event.id}
                  className={`pg-event-row-grid upcoming-event relative ${
                    isApplied ? 'applied' : ''
                  } ${
                    isAdmin || isPhotographerUpcomingView ? 'clickable-row' : ''
                  } ${
                    isPhotographerUpcomingView ? 'no-logo' : ''
                  }`}
                  style={{ zIndex: activeMenuId === event.id ? 1001 : 1 }}
                  onClick={() => handleOpenUpcomingEvent(event.id)}
                >
                  {!isPhotographerUpcomingView && (
                    <div className="pg-grid-col-thumb">
                      <div className="pg-event-thumb-small">
                        <img src={event.logo} alt={event.title} />
                      </div>
                    </div>
                  )}
                  <div className="pg-grid-col-content">
                    <div className="pg-event-date-small">{event.dateRange}</div>
                    <h3 className="pg-event-title-bold">{event.title}</h3>
                    <div className="pg-event-meta-row">
                      <span>{event.city}</span>
                      <span className="meta-bullet">•</span>
                      <span>{event.venueName}</span>
                      {event.disciplines && (
                        <>
                          <span className="meta-bullet">•</span>
                          <span className="meta-disciplines">
                            {event.disciplines.join(', ')}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="pg-grid-col-actions">
                    <div className="pg-applied-action-group">
                      {isAdmin ? (
                        <div className="pg-admin-card-actions">
                          {/* Stats for Live/Past/Archived */}
                          {view !== 'upcoming' && (
                            <>
                              <div className="pg-stats-badges gap-2">
                                <div className="pg-badge-item published stacked">
                                  <span className="label">Published</span>
                                  <span className="count">
                                    {event.publishedCount ?? 0}
                                  </span>
                                </div>
                                {/* <div className="pg-badge-item sales stacked">
                                  <span className="label">Sales</span>
                                  <span className="count">
                                    {event.soldCount ?? 0}/
                                    {event.photosCount ?? 40}
                                  </span>
                                </div> */}
                                {/* <div className="pg-badge-item earnings stacked">
                                                                    <span className="label">PG Earnings</span>
                                                                    <span className="value">SEK {((event.soldCount ?? 0) * 450).toLocaleString().replace(/,/g, ' ')}</span>
                                                                </div>
                                                                <div className="pg-badge-item earnings stacked bg-[var(--color-gallop-bg)] text-[var(--color-gallop-text)]">
                                                                    <span className="label">Gallop Earnings</span>
                                                                    <span className="value text-[var(--color-gallop-value)]">SEK {((event.soldCount ?? 0) * 4500).toLocaleString().replace(/,/g, ' ')}</span>
                                                                </div> */}
                              </div>
                              <div className="pg-action-separator h-8 mx-5" />
                            </>
                          )}
                          {/* Avatar Column */}
                          {(() => {
                            const showAvatar = true; // Show for all tabs in Admin flow
                            if (!showAvatar)
                              return <div className="pg-avatar-placeholder" />;

                            const p = event.assignedPhotographers?.[0];
                            return (
                              <div className="pg-admin-event-photographer">
                                {view !== 'past' && view !== 'archived' && (
                                  <span
                                    className={`pg-applications-watermark ${
                                      event.applicationsWelcomed === false
                                        ? 'off'
                                        : 'on'
                                    }`}
                                  >
                                    {event.applicationsWelcomed === false
                                      ? 'Closed'
                                      : 'Open'}
                                  </span>
                                )}
                                {p && (
                                  <img
                                    src={p.avatar}
                                    alt={p.name}
                                    title={`Photographer: ${p.name}`}
                                    className="pg-admin-avatar"
                                  />
                                )}
                              </div>
                            );
                          })()}

                          {/* More Menu */}
                          <div className="pg-more-menu-container">
                            <div className="pg-action-separator" />
                            <button
                              className={`pg-action-round-btn ${
                                activeMenuId === event.id ? 'active' : ''
                              }`}
                              onClick={e => {
                                e.stopPropagation();
                                setActiveMenuId(
                                  activeMenuId === event.id ? null : event.id
                                );
                              }}
                            >
                              <MoreHorizontal size={18} />
                            </button>

                            {activeMenuId === event.id && (
                              <div
                                className="dropdown-menu absolute top-[calc(100%+8px)] right-0 w-max min-w-[180px] z-[1000]"
                                onClick={e => e.stopPropagation()}
                              >
                                {view === 'archived' ? (
                                  <>
                                    <button
                                      className="dropdown-item"
                                      onClick={() =>
                                        handleNavigateToEvent(event.id)
                                      }
                                    >
                                      <Search size={14} />
                                      View Dashboard
                                    </button>
                                    <button
                                      className="dropdown-item"
                                      onClick={() => {
                                        console.log('Make active', event.id);
                                        setActiveMenuId(null);
                                      }}
                                    >
                                      <CheckCircle size={14} />
                                      Make active
                                    </button>
                                    <div className="dropdown-divider" />
                                    <button
                                      className="dropdown-item dropdown-item-danger"
                                      onClick={() => {
                                        setConfirmModal({
                                          isOpen: true,
                                          type: 'delete',
                                          event,
                                        });
                                        setActiveMenuId(null);
                                      }}
                                    >
                                      <Trash2 size={14} />
                                      Delete
                                    </button>
                                  </>
                                ) : (
                                  <>
                                    <button
                                      className="dropdown-item"
                                      onClick={() =>
                                        handleNavigateToEvent(event.id)
                                      }
                                    >
                                      <Search size={14} />
                                      Manage uploads
                                    </button>
                                    <button
                                      className="dropdown-item"
                                      onClick={() => {
                                        setEventToEdit(event);
                                        setIsAddModalOpen(true);
                                        setActiveMenuId(null);
                                      }}
                                    >
                                      <Edit2 size={14} />
                                      Edit Event
                                    </button>
                                    <button
                                      className="dropdown-item"
                                      onClick={() => {
                                        setConfirmModal({
                                          isOpen: true,
                                          type: 'archive',
                                          event,
                                        });
                                        setActiveMenuId(null);
                                      }}
                                    >
                                      <Archive size={14} />
                                      Archive
                                    </button>
                                    <div className="dropdown-divider" />
                                    <button
                                      className="dropdown-item dropdown-item-danger"
                                      onClick={() => {
                                        setConfirmModal({
                                          isOpen: true,
                                          type: 'delete',
                                          event,
                                        });
                                        setActiveMenuId(null);
                                      }}
                                    >
                                      <Trash2 size={14} />
                                      Delete
                                    </button>
                                  </>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      ) : isApplied ? (
                        <FilterChip
                          label={
                            bookingEventId === event.id
                              ? 'Cancelling...'
                              : 'Cancel booking'
                          }
                          onClick={(e?: any) => handleCancelBooking(event, e)}
                          className="hover:!bg-[var(--color-danger-tint)] hover:!border-[var(--color-danger-border)] hover:!text-[var(--color-danger)]"
                        />
                      ) : (
                        <>
                          {(() => {
                            if (event.applicationsWelcomed === false) {
                              return (
                                <span className="pg-applications-watermark off">
                                  Closed
                                </span>
                              );
                            }

                            return (
                              <FilterChip
                                label={
                                  bookingEventId === event.id
                                    ? 'Booking...'
                                    : 'Book'
                                }
                                onClick={(e?: any) => handleBookEvent(event, e)}
                              />
                            );
                          })()}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      ) : (
        <div className="pg-events-grid">
          {isPhotographerMyEventsLoading ? (
            <div className="pg-empty-state">
              <div className="pg-empty-icon pg-loading-icon">
                <Loader2 size={24} />
              </div>
              <h3>Loading your events...</h3>
              <p>Fetching the events you've joined or been assigned to.</p>
            </div>
          ) : myEvents.length === 0 ? (
            <div className="pg-empty-state">
              <div className="pg-empty-icon">
                <CalendarPlus size={24} />
              </div>
              <h3>No events yet</h3>
              <p>Events you've joined or been assigned to will appear here.</p>
            </div>
          ) : (
            myEvents.map(event => (
              <PgEventCard
                key={event.id}
                event={event}
                onCoverChange={handleCoverChange}
                onCancelBooking={
                  bookedEventIds.has(event.id) ? handleCancelBooking : undefined
                }
                eventProfilePath={
                  bookedEventIds.has(event.id) ? `/event/${event.id}` : undefined
                }
                eventProfileState={
                  bookedEventIds.has(event.id)
                    ? { from: '/pg/events', fromTab: view }
                    : undefined
                }
                hideLogo={!isAdmin && view === 'my'}
                fromTab={view}
                onEdit={ev => {
                  setEventToEdit(ev);
                  setIsAddModalOpen(true);
                }}
              />
            ))
          )}
        </div>
      )}

      <CoverImagePickerModal
        isOpen={!!activePickerEventId}
        onClose={() => setActivePickerEventId(null)}
        eventId={activePickerEventId || ''}
        onSelect={url => {
          console.log('New cover selected:', url);
        }}
      />

      <AddEventModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setEventToEdit(null);
        }}
        eventToEdit={eventToEdit}
      />

      {showApplyToast && (
        <PgToast
          type="success"
          message={toastMessage}
          className="fixed bottom-6 right-6"
        />
      )}

      {/* Confirmation Modal */}
      {confirmModal && confirmModal.isOpen && (
        <div className="pg-modal-overlay">
          <div className="pg-modal-card">
            <div className="flex gap-4 items-start">
              <div className="pg-alert-icon danger">
                <AlertCircle size={24} />
              </div>
              <div className="flex-1">
                <h3 className="mt-0 text-[1.125rem] font-bold mb-2 text-primary">
                  {confirmModal.type === 'archive' && 'Archive event?'}
                  {confirmModal.type === 'delete' && 'Delete event?'}
                </h3>
                <p className="mb-4 text-[0.875rem] leading-[1.5] text-secondary">
                  {confirmModal.type === 'archive' && (
                    <>
                      Are you sure you want to archive{' '}
                      <strong>{confirmModal.event?.title}</strong>? It will be
                      moved to the Archived tab.
                    </>
                  )}
                  {confirmModal.type === 'delete' && (
                    <>
                      This will permanently delete{' '}
                      <strong>{confirmModal.event?.title}</strong>. This action
                      cannot be undone.
                    </>
                  )}
                </p>
              </div>
            </div>
            <div className="modal-footer-actions">
              <button
                className="modal-btn-cancel"
                onClick={() => {
                  setConfirmModal(null);
                }}
              >
                Cancel
              </button>
              <button
                className="modal-btn-danger"
                onClick={() => {
                  console.log(
                    `${confirmModal.type}ing event:`,
                    confirmModal.event?.id
                  );
                  setConfirmModal(null);
                }}
              >
                {confirmModal.type === 'archive' && 'Archive'}
                {confirmModal.type === 'delete' && 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
