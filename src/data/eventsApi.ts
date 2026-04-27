import type { EventData } from './mockEvents';
import { mockEvents } from './mockEvents';
import { assetUrl } from '../lib/utils';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

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

const fallbackCovers = [
  assetUrl('images/Abdel_Said_Arpege_du_RU5978.jpg'),
  assetUrl('images/Alice_Nilsson_Eunomia8286.jpg'),
  assetUrl('images/Falsterbo7800.jpg'),
  assetUrl('images/Peder_Fredricson_Alcapone_des_Carmille8136.jpg'),
  assetUrl('images/Anna_Svanberg_Vidar9116.jpg'),
  assetUrl('images/Fredrik_Spetz_Galactee_de_Tivoli8292.jpg'),
];

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

function getFallbackAsset(index: number, key: 'coverImage' | 'logo') {
  const mock = mockEvents[index % mockEvents.length];
  if (mock?.[key]) return mock[key];

  if (key === 'coverImage') return fallbackCovers[index % fallbackCovers.length];
  return assetUrl('images/logo1.svg');
}

export function mapApiEventToEventData(
  event: ApiEvent,
  index: number,
): EventData {
  const country = normalizeCountry(event.country);

  return {
    id: event.id,
    name: event.name,
    coverImage: getFallbackAsset(index, 'coverImage'),
    period: formatEventPeriod(event.start_date, event.end_date),
    startDate: event.start_date,
    endDate: event.end_date || event.start_date,
    flag: country === 'Sweden' ? '🇸🇪' : '',
    city: event.city || event.venue_name || 'Unknown city',
    discipline: event.discipline || 'Equestrian',
    country,
    logo: getFallbackAsset(index, 'logo'),
    photographer: null,
    status: event.status === 'cancelled' ? 'disabled' : 'active',
  };
}

export async function fetchEventsFromApi(): Promise<EventData[]> {
  const url = new URL(
    '/api/v1/events',
    API_BASE_URL || window.location.origin,
  );
  url.searchParams.set('page_size', '100');

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to load events: ${response.status}`);
  }

  const data = (await response.json()) as PaginatedApiResponse<ApiEvent>;
  return data.items.map(mapApiEventToEventData);
}

export async function fetchEventFromApi(eventId: string): Promise<ApiEvent> {
  const url = new URL(
    `/api/v1/events/${eventId}`,
    API_BASE_URL || window.location.origin,
  );
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to load event: ${response.status}`);
  }

  return (await response.json()) as ApiEvent;
}
