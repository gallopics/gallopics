import { COMPETITIONS, PHOTOGRAPHERS } from './mockData';

export const SHOW_EVENTS = false;

export interface EventData {
  id: string;
  name: string;
  coverImage: string;
  period: string; // e.g., "12 Jun – 14 Jun 2026"
  startDate?: string;
  endDate?: string;
  flag: string; // Emoji
  city: string;
  discipline: string;
  country: string; // For filtering (e.g., "Sweden")
  photoCount?: number;
  logo: string; // New field for Event Avatar
  photographer: {
    id: string;
    name: string;
    avatar: string;
  } | null;
  status?: 'active' | 'disabled';
}

// Config mapping for visual assets that aren't in the raw data
// cover: Random/Specific high quality Horse Photo
// logo: Specific Event Image/Logo from file list
const EVENT_ASSETS: Record<
  string,
  { cover: string; logo: string; count: number }
> = {
  c1: {
    cover: '',
    logo: '',
    count: 820,
  },
  c2: {
    cover: '',
    logo: '',
    count: 745,
  },
  c3: {
    cover: '',
    logo: '',
    count: 920,
  },
  c4: {
    cover: '',
    logo: '',
    count: 550,
  },
  c5: {
    cover: '',
    logo: '',
    count: 480,
  },
  c6: {
    cover: '',
    logo: '',
    count: 620,
  },
  c7: {
    cover: '',
    logo: '',
    count: 410,
  },
  c8: {
    cover: '',
    logo: '',
    count: 380,
  },
  c9: {
    cover: '',
    logo: '',
    count: 590,
  },
  c10: {
    cover: '',
    logo: '',
    count: 420,
  },
};

// Helper: Format date range
function formatPeriod(start: string, end?: string): string {
  // start: YYYY-MM-DD
  const sDate = new Date(start);
  const eDate = end ? new Date(end) : null;

  const options: Intl.DateTimeFormatOptions = {
    day: '2-digit',
    month: 'short',
  };
  const sStr = sDate.toLocaleDateString('en-GB', options);

  if (eDate) {
    const eStr = eDate.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
    return `${sStr} – ${eStr}`;
  }
  return `${sStr} ${sDate.getFullYear()}`;
}

export const mockEvents: EventData[] = COMPETITIONS.map(comp => {
  // Find assigned photographer
  // Logic: pX assigned to cX
  const photographer =
    PHOTOGRAPHERS.find(p => p.primaryEventId === comp.id) || PHOTOGRAPHERS[0];
  const assets = EVENT_ASSETS[comp.id] || EVENT_ASSETS['c1'];

  return {
    id: comp.id,
    name: comp.name,
    coverImage: assets.cover,
    period: formatPeriod(comp.date, comp.endDate),
    startDate: comp.date,
    endDate: comp.endDate,
    flag: '🇸🇪', // Everyone is Sweden per request
    city: comp.city,
    discipline: comp.discipline || 'Show Jumping',
    country: comp.country,
    photoCount: assets.count,
    logo: assets.logo,
    photographer: {
      id: photographer.id,
      name: `${photographer.firstName} ${photographer.lastName}`,
      avatar: '',
    },
  };
});

// Add 2 disabled events
export const disabledEvents: EventData[] = [
  {
    id: 'd1',
    name: 'Regional Dressage Cup',
    coverImage: '', // No cover
    period: '10 Feb – 12 Feb 2026', // Future Range
    flag: '🇸🇪',
    city: 'Västerås',
    discipline: 'Dressage',
    country: 'Sweden',
    photoCount: 120,
    logo: '',
    photographer: {
      id: 'p1',
      name: 'Hanna Björk',
      avatar: '',
    },
    status: 'disabled',
  },
  {
    id: 'd2',
    name: 'Local Jumping Training',
    coverImage: '', // No cover
    period: '12 Feb – 13 Feb 2026', // Future Range
    flag: '🇸🇪',
    city: 'Enköping',
    discipline: 'Show Jumping',
    country: 'Sweden',
    photoCount: 45,
    logo: '',
    photographer: null,
    status: 'disabled',
  },
];

// export const allMockEvents = [...mockEvents, ...disabledEvents];

export const allMockEvents = SHOW_EVENTS
  ? [...mockEvents, ...disabledEvents]
  : [];
