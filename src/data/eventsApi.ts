import type { EventData } from './mockEvents';
import { getApiBaseUrl } from './apiClient';
import type { ClassSection, DailySchedule, EventDetail, Meeting } from '../types';

export interface ApiEvent {
  id: string;
  tdb_id?: string | null;
  equipe_id?: string | null;
  name: string;
  slug: string;
  discipline?: string | null;
  horse_type?: string | null;
  organizer_name?: string | null;
  district?: string | null;
  venue_name?: string | null;
  city?: string | null;
  country: string;
  start_date: string;
  end_date?: string | null;
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
  is_sustainable: boolean;
  match_status: 'unmatched' | 'matched' | 'manual' | 'rejected';
  match_score?: number | null;
  created_at: string;
  updated_at: string;
}

interface PaginatedApiResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
}

interface ApiEventClass {
  id: string;
  name: string;
  class_no?: string | null;
  date: string;
  start_time?: string | null;
  arena: string;
  discipline?: string | null;
  position: number;
}

interface ApiEventScheduleDay {
  date: string;
  classes: ApiEventClass[];
}

export interface ApiEventSchedule {
  event_id: string;
  equipe_meeting_id: string;
  classes_count: number;
  days: ApiEventScheduleDay[];
}

function normalizeCountry(country: string) {
  const countryMap: Record<string, string> = {
    SE: 'Sweden',
    NO: 'Norway',
    DK: 'Denmark',
    FI: 'Finland',
    DE: 'Germany',
    FR: 'France',
    NL: 'Netherlands',
  };

  return countryMap[country] || country;
}

function formatEventPeriod(startDate: string, endDate?: string | null) {
  const start = new Date(`${startDate}T00:00:00`);
  const end = endDate ? new Date(`${endDate}T00:00:00`) : null;

  const startLabel = start.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
  });

  if (!end) {
    return start.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }

  const endLabel = end.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  return `${startLabel} – ${endLabel}`;
}

export function mapApiEventToEventData(event: ApiEvent): EventData {
  const country = normalizeCountry(event.country);

  return {
    id: event.id,
    name: event.name,
    coverImage: '',
    period: formatEventPeriod(event.start_date, event.end_date),
    startDate: event.start_date,
    endDate: event.end_date || event.start_date,
    flag: country === 'Sweden' ? '🇸🇪' : '',
    city: event.city || event.venue_name || event.organizer_name || 'Sweden',
    discipline: event.discipline || 'Equestrian',
    country,
    logo: '',
    photographer: null,
    status: event.status === 'cancelled' ? 'disabled' : 'active',
  };
}

export async function fetchEventsFromApi(): Promise<EventData[]> {
  const pageSize = 100;
  const items: ApiEvent[] = [];
  let page = 1;
  let total = 0;

  do {
    const url = new URL('/api/v1/events', getApiBaseUrl());
    url.searchParams.set('page', String(page));
    url.searchParams.set('page_size', String(pageSize));

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Failed to load events: ${response.status}`);
    }

    const data = (await response.json()) as PaginatedApiResponse<ApiEvent>;
    items.push(...data.items);
    total = data.total;
    page += 1;
  } while (items.length < total);

  return items.map(mapApiEventToEventData);
}

export async function fetchEventFromApi(eventId: string): Promise<ApiEvent> {
  const url = new URL(
    `/api/v1/events/${eventId}`,
    getApiBaseUrl(),
  );
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to load event: ${response.status}`);
  }

  return (await response.json()) as ApiEvent;
}

export function mapApiScheduleToDailySchedule(
  schedule: ApiEventSchedule,
): DailySchedule[] {
  return schedule.days.map(day => {
    const arenas = new Map<string, ClassSection[]>();

    day.classes.forEach(eventClass => {
      if (!arenas.has(eventClass.arena)) arenas.set(eventClass.arena, []);
      arenas.get(eventClass.arena)!.push({
        classSectionId: eventClass.id,
        name: eventClass.name,
        startTime: eventClass.start_time || 'TBD',
        position: eventClass.position,
        discipline: eventClass.discipline || 'Equestrian',
        entriesCount: 0,
      });
    });

    return {
      date: day.date,
      arenas: Array.from(arenas.entries()).map(
        ([arenaName, competitions], index) => ({
          id: `${day.date}-${arenaName}`,
          name: arenaName,
          position: index,
          competitions,
        }),
      ),
    };
  });
}

export function buildApiEventDetail(
  event: ApiEvent,
  schedule?: DailySchedule[],
): EventDetail {
  const endDate = event.end_date || event.start_date;
  const discipline = event.discipline || 'Equestrian';
  const countryCode = event.country === 'Sweden' ? 'SE' : event.country;
  const meeting: Meeting = {
    id: event.id,
    name: event.name,
    country: {
      name: event.country,
      code: countryCode,
    },
    city: event.city || event.venue_name || event.organizer_name || 'Sweden',
    venueName: event.venue_name || event.organizer_name || 'Venue pending',
    clubName: event.organizer_name || 'Gallopics',
    period: { startDate: event.start_date, endDate },
    disciplines: [discipline],
    timezone: 'Europe/Stockholm',
    photoCount: 0,
    coverImage: '',
    logo: '',
  };

  return {
    meetingId: event.id,
    meeting,
    schedule:
      schedule && schedule.length > 0
        ? schedule
        : [
            {
              date: event.start_date,
              arenas: [
                {
                  id: `${event.id}-arena`,
                  name: meeting.venueName,
                  position: 1,
                  competitions: [
                    {
                      classSectionId: `${event.id}-class`,
                      name: discipline,
                      startTime: '09:00',
                      position: 1,
                      discipline,
                      entriesCount: 0,
                    },
                  ],
                },
              ],
            },
          ],
  };
}

export async function fetchEventScheduleFromApi(
  eventId: string,
): Promise<ApiEventSchedule> {
  const url = new URL(
    `/api/v1/events/${encodeURIComponent(eventId)}/schedule`,
    getApiBaseUrl(),
  );
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to load event schedule: ${response.status}`);
  }

  return (await response.json()) as ApiEventSchedule;
}
