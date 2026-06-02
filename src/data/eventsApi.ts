import type { EventData } from './mockEvents';
import { getApiBaseUrl, resolveApiAssetUrl } from './apiClient';
import type {
  ClassSection,
  DailySchedule,
  EventDetail,
  Meeting,
  Photo,
} from '../types';
import type { ApiPhoto } from './apiClient';
import { formatLabel } from '../lib/utils';

const EVENTS_REQUEST_TIMEOUT_MS = 15000;

async function fetchWithTimeout(url: URL, options: RequestInit = {}) {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(
    () => controller.abort(),
    EVENTS_REQUEST_TIMEOUT_MS
  );

  try {
    return await fetch(url, {
      ...options,
      signal: controller.signal,
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error('The events API took too long to respond. Please retry.');
    }
    throw error;
  } finally {
    window.clearTimeout(timeoutId);
  }
}

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
  photo_count?: number | null;
  photos_count?: number | null;
  published_photo_count?: number | null;
  photoCount?: number | null;
  photosCount?: number | null;
  publishedPhotoCount?: number | null;
  cover_image?: string | null;
  coverImage?: string | null;
  logo_url?: string | null;
  logoUrl?: string | null;
  created_at: string;
  updated_at: string;
}

interface PaginatedApiResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
}

type ApiPhotoWithUrls = ApiPhoto & {
  preview_url?: string | null;
  thumbnail_url?: string | null;
  url?: string | null;
  width?: number | null;
  height?: number | null;
  event_class_name?: string | null;
};

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
    SWE: 'Sweden',
    NO: 'Norway',
    NOR: 'Norway',
    DK: 'Denmark',
    DNK: 'Denmark',
    FI: 'Finland',
    FIN: 'Finland',
    DE: 'Germany',
    DEU: 'Germany',
    FR: 'France',
    FRA: 'France',
    NL: 'Netherlands',
    NLD: 'Netherlands',
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
  const photoCount =
    event.published_photo_count ??
    event.publishedPhotoCount ??
    event.photo_count ??
    event.photoCount ??
    event.photos_count ??
    event.photosCount;
  const coverImage = resolveApiAssetUrl(event.cover_image ?? event.coverImage);
  const logo = resolveApiAssetUrl(event.logo_url ?? event.logoUrl);

  return {
    id: event.id,
    name: event.name,
    coverImage: coverImage ?? '',
    period: formatEventPeriod(event.start_date, event.end_date),
    startDate: event.start_date,
    endDate: event.end_date || event.start_date,
    flag: country === 'Sweden' ? '🇸🇪' : '',
    city: event.city || event.venue_name || event.organizer_name || 'Sweden',
    discipline: formatLabel(event.discipline) || 'Equestrian',
    country,
    logo: logo ?? '',
    photographer: null,
    photoCount: typeof photoCount === 'number' ? photoCount : undefined,
    status: event.status === 'cancelled' ? 'disabled' : 'active',
  };
}

export async function fetchEventsFromApi(options?: {
  hasPhotos?: boolean;
}): Promise<EventData[]> {
  const pageSize = 100;
  const items: ApiEvent[] = [];
  let page = 1;
  let total = 0;

  do {
    const url = new URL('/api/v1/events', getApiBaseUrl());
    url.searchParams.set('page', String(page));
    url.searchParams.set('page_size', String(pageSize));
    if (options?.hasPhotos) {
      url.searchParams.set('has_photos', 'true');
    }

    const response = await fetchWithTimeout(url);

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

export async function fetchEventsWithPhotosFromApi(): Promise<EventData[]> {
  return fetchEventsFromApi({ hasPhotos: true });
}

function getPhotoTag(photo: ApiPhoto, type: string) {
  return photo.tags?.find(tag => tag.type === type)?.value;
}

function getPhotoImageUrl(photo: ApiPhotoWithUrls) {
  return (
    resolveApiAssetUrl(photo.preview_url) ??
    resolveApiAssetUrl(photo.thumbnail_url) ??
    resolveApiAssetUrl(photo.url) ??
    resolveApiAssetUrl(`/api/v1/photographer/photos/${photo.id}/preview`) ??
    ''
  );
}

function mapApiPhotoToPhoto(photo: ApiPhotoWithUrls, event: EventData): Photo {
  const createdAt = photo.created_at ? new Date(photo.created_at) : new Date();
  const className =
    photo.event_class_name || photo.class_name || photo.class_id || 'Uploaded';

  return {
    id: photo.id,
    src: getPhotoImageUrl(photo),
    rider: getPhotoTag(photo, 'rider') || 'Unassigned',
    horse: getPhotoTag(photo, 'horse') || className || 'Uploaded photo',
    event: event.name,
    eventId: event.id,
    date: photo.created_at || event.startDate || new Date().toISOString(),
    width: photo.width || 600,
    height: photo.height || 800,
    className,
    time: createdAt.toLocaleTimeString().slice(0, 5),
    city: event.city,
    arena: className,
    countryCode: event.country === 'Sweden' ? 'se' : event.country.toLowerCase(),
    photographer: photo.photographer_display_name || 'Gallopics',
    photographerId: photo.photographer_id,
  };
}

export async function fetchPublicEventPhotosFromApi(
  event: EventData,
  pageSize = 100
): Promise<Photo[]> {
  const url = new URL(
    `/api/v1/events/${encodeURIComponent(event.id)}/gallery`,
    getApiBaseUrl()
  );
  url.searchParams.set('page', '1');
  url.searchParams.set('page_size', String(pageSize));

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to load event photos: ${response.status}`);
  }

  const data = (await response.json()) as PaginatedApiResponse<ApiPhotoWithUrls>;
  return data.items.map(photo => mapApiPhotoToPhoto(photo, event));
}

export async function fetchLatestPublicEventPhotoUrl(
  eventId: string,
  pageSize = 20
): Promise<string | null> {
  const url = new URL(
    `/api/v1/events/${encodeURIComponent(eventId)}/gallery`,
    getApiBaseUrl()
  );
  url.searchParams.set('page', '1');
  url.searchParams.set('page_size', String(pageSize));

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to load event photos: ${response.status}`);
  }

  const data = (await response.json()) as PaginatedApiResponse<ApiPhotoWithUrls>;
  const latestPhoto = [...data.items].sort((a, b) => {
    const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
    const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
    const timeA = Number.isFinite(dateA) ? dateA : 0;
    const timeB = Number.isFinite(dateB) ? dateB : 0;

    return timeB - timeA;
  })[0];

  return latestPhoto ? getPhotoImageUrl(latestPhoto) || null : null;
}

export async function fetchEventFromApi(eventId: string): Promise<ApiEvent> {
  const url = new URL(`/api/v1/events/${eventId}`, getApiBaseUrl());
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to load event: ${response.status}`);
  }

  return (await response.json()) as ApiEvent;
}

export function mapApiScheduleToDailySchedule(
  schedule: ApiEventSchedule
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
        discipline: formatLabel(eventClass.discipline) || 'Equestrian',
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
        })
      ),
    };
  });
}

export function buildApiEventDetail(
  event: ApiEvent,
  schedule?: DailySchedule[]
): EventDetail {
  const endDate = event.end_date || event.start_date;
  const discipline = formatLabel(event.discipline) || 'Equestrian';
  const countryName = normalizeCountry(event.country);
  const countryCode = countryName === 'Sweden' ? 'SE' : event.country;
  const photoCount =
    event.published_photo_count ??
    event.publishedPhotoCount ??
    event.photo_count ??
    event.photoCount ??
    event.photos_count ??
    event.photosCount ??
    0;
  const meeting: Meeting = {
    id: event.id,
    name: event.name,
    country: {
      name: countryName,
      code: countryCode,
    },
    city: event.city || event.venue_name || event.organizer_name || 'Sweden',
    venueName: event.venue_name || event.organizer_name || '',
    clubName: event.organizer_name || 'Gallopics',
    period: { startDate: event.start_date, endDate },
    disciplines: [discipline],
    timezone: 'Europe/Stockholm',
    photoCount,
    coverImage:
      resolveApiAssetUrl(event.cover_image ?? event.coverImage) ?? '',
    logo: resolveApiAssetUrl(event.logo_url ?? event.logoUrl) ?? '',
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
                  name: meeting.venueName || 'Main Arena',
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
  eventId: string
): Promise<ApiEventSchedule> {
  const url = new URL(
    `/api/v1/events/${encodeURIComponent(eventId)}/schedule`,
    getApiBaseUrl()
  );
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to load event schedule: ${response.status}`);
  }

  return (await response.json()) as ApiEventSchedule;
}
