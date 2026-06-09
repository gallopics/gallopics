import type { Photo } from '../types';

// --- USER PROVIDED MOCK DATA (Synced 2026-01-17) ---

export const RIDERS = [
  {
    id: 'r1',
    firstName: 'Ebba',
    lastName: 'Lindström',
    gender: 'F',
    countryCode: 'SE',
  },
  {
    id: 'r2',
    firstName: 'Maja',
    lastName: 'Sjöberg',
    gender: 'F',
    countryCode: 'SE',
  },
  {
    id: 'r3',
    firstName: 'Alva',
    lastName: 'Karlsson',
    gender: 'F',
    countryCode: 'SE',
  },
  {
    id: 'r4',
    firstName: 'Nora',
    lastName: 'Bergqvist',
    gender: 'F',
    countryCode: 'SE',
  },
  {
    id: 'r5',
    firstName: 'Elsa',
    lastName: 'Håkansson',
    gender: 'F',
    countryCode: 'SE',
  },
  {
    id: 'r6',
    firstName: 'Signe',
    lastName: 'Jonsson',
    gender: 'F',
    countryCode: 'SE',
  },
  {
    id: 'r7',
    firstName: 'Freja',
    lastName: 'Nyström',
    gender: 'F',
    countryCode: 'SE',
  },
  {
    id: 'r8',
    firstName: 'Linnea',
    lastName: 'Ek',
    gender: 'F',
    countryCode: 'SE',
  },
  {
    id: 'r9',
    firstName: 'Oskar',
    lastName: 'Wallin',
    gender: 'M',
    countryCode: 'SE',
  },
  {
    id: 'r10',
    firstName: 'Viktor',
    lastName: 'Sundberg',
    gender: 'M',
    countryCode: 'SE',
  },
];

export const PHOTOGRAPHERS = [
  {
    id: 'hanna-bjork',
    firstName: 'Hanna',
    lastName: 'Björk',
    gender: 'F',
    countryCode: 'SE',
    primaryEventId: 'c1',
    highlights: [] as string[],
    city: 'Stockholm',
    isAvailableToHire: true,
  },
  {
    id: 'klara-fors',
    firstName: 'Klara',
    lastName: 'Fors',
    gender: 'F',
    countryCode: 'SE',
    primaryEventId: 'c2',
    highlights: [] as string[],
    city: 'Göteborg',
    isAvailableToHire: false,
  },
  {
    id: 'ida-holmgren',
    firstName: 'Ida',
    lastName: 'Holmgren',
    gender: 'F',
    countryCode: 'SE',
    primaryEventId: 'c3',
    highlights: [] as string[],
    city: 'Malmö',
    isAvailableToHire: true,
  },
  {
    id: 'tove-lund',
    firstName: 'Tove',
    lastName: 'Lund',
    gender: 'F',
    countryCode: 'SE',
    primaryEventId: 'c4',
    highlights: [] as string[],
    city: 'Uppsala',
    isAvailableToHire: true,
  },
  {
    id: 'sara-engstrom',
    firstName: 'Sara',
    lastName: 'Engström',
    gender: 'F',
    countryCode: 'SE',
    primaryEventId: 'c5',
    highlights: [] as string[],
    city: 'Västerås',
    isAvailableToHire: false,
  },
  {
    id: 'johan-lindahl',
    firstName: 'Johan',
    lastName: 'Lindahl',
    gender: 'M',
    countryCode: 'SE',
    primaryEventId: 'c6',
    highlights: [] as string[],
    city: 'Örebro',
    isAvailableToHire: true,
  },
  {
    id: 'erik-nyberg',
    firstName: 'Erik',
    lastName: 'Nyberg',
    gender: 'M',
    countryCode: 'SE',
    primaryEventId: 'c7',
    highlights: [] as string[],
    city: 'Linköping',
    isAvailableToHire: true,
  },
  {
    id: 'mattias-berg',
    firstName: 'Mattias',
    lastName: 'Berg',
    gender: 'M',
    countryCode: 'SE',
    primaryEventId: 'c8',
    highlights: [] as string[],
    city: 'Helsingborg',
    isAvailableToHire: false,
  },
  {
    id: 'daniel-soder',
    firstName: 'Daniel',
    lastName: 'Söder',
    gender: 'M',
    countryCode: 'SE',
    primaryEventId: 'c9',
    highlights: [] as string[],
    city: 'Jönköping',
    isAvailableToHire: true,
  },
  {
    id: 'per-hedman',
    firstName: 'Per',
    lastName: 'Hedman',
    gender: 'M',
    countryCode: 'SE',
    primaryEventId: 'c10',
    highlights: [] as string[],
    city: 'Norrköping',
    isAvailableToHire: true,
  },
];

export const HORSES = [
  { id: 'h1', name: 'Nordic Aurora', registeredName: 'Nordic Aurora' },
  { id: 'h2', name: 'Silver Tindra', registeredName: 'Silver Tindra' },
  { id: 'h3', name: 'Stormvind', registeredName: 'Stormvind' },
  { id: 'h4', name: 'Midnight Saga', registeredName: 'Midnight Saga' },
  { id: 'h5', name: 'Lilla Fjord', registeredName: 'Lilla Fjord' },
  { id: 'h6', name: 'Valhalla Rune', registeredName: 'Valhalla Rune' },
  { id: 'h7', name: 'Skärgårdsprins', registeredName: 'Skärgårdsprins' },
  { id: 'h8', name: 'Göta Glimt', registeredName: 'Göta Glimt' },
  { id: 'h9', name: 'Björkdal Brave', registeredName: 'Björkdal Brave' },
  { id: 'h10', name: 'Frost Nova', registeredName: 'Frost Nova' },
];

export const COMPETITIONS = [
  {
    id: 'c1',
    name: 'Sweden International Horse Show',
    country: 'Sweden',
    countryCode: 'SE',
    city: 'Stockholm',
    discipline: 'Show Jumping',
    date: '2026-01-20',
    endDate: '2026-01-23',
  }, // Live
  {
    id: 'c2',
    name: 'Gothenburg Indoor Masters',
    country: 'Sweden',
    countryCode: 'SE',
    city: 'Göteborg',
    discipline: 'Show Jumping',
    date: '2026-01-10',
    endDate: '2026-01-12',
  }, // Recent
  {
    id: 'c3',
    name: 'Falsterbo Summer Classic',
    country: 'Sweden',
    countryCode: 'SE',
    city: 'Falsterbo',
    discipline: 'Show Jumping',
    date: '2026-01-05',
    endDate: '2026-01-08',
  }, // Recent
  {
    id: 'c4',
    name: 'Strömsholm Spring Dressage',
    country: 'Sweden',
    countryCode: 'SE',
    city: 'Strömsholm',
    discipline: 'Dressage',
    date: '2026-05-08',
    endDate: '2026-05-10',
  },
  {
    id: 'c5',
    name: 'Uppsala Arena Cup',
    country: 'Sweden',
    countryCode: 'SE',
    city: 'Uppsala',
    discipline: 'Show Jumping',
    date: '2026-01-15',
    endDate: '2026-01-16',
  }, // Recent
  {
    id: 'c6',
    name: 'Malmö City Jumping',
    country: 'Sweden',
    countryCode: 'SE',
    city: 'Malmö',
    discipline: 'Show Jumping',
    date: '2026-04-25',
    endDate: '2026-04-26',
  },
  {
    id: 'c7',
    name: 'Linköping Eventing Weekend',
    country: 'Sweden',
    countryCode: 'SE',
    city: 'Linköping',
    discipline: 'Eventing',
    date: '2026-09-05',
    endDate: '2026-09-06',
  },
  {
    id: 'c8',
    name: 'Örebro Autumn Cup',
    country: 'Sweden',
    countryCode: 'SE',
    city: 'Örebro',
    discipline: 'Show Jumping',
    date: '2026-10-10',
    endDate: '2026-10-11',
  },
  {
    id: 'c9',
    name: 'Umeå Northern Lights Dressage',
    country: 'Sweden',
    countryCode: 'SE',
    city: 'Umeå',
    discipline: 'Dressage',
    date: '2026-01-19',
    endDate: '2026-01-22',
  }, // Live
  {
    id: 'c10',
    name: 'Jönköping Lake District Classic',
    country: 'Sweden',
    countryCode: 'SE',
    city: 'Jönköping',
    discipline: 'Show Jumping',
    date: '2026-06-12',
    endDate: '2026-06-14',
  },
];

// Explicit Associations for Search/Profile logic
export const RIDER_PRIMARY_HORSE = [
  { riderId: 'r1', primaryHorseId: 'h9' },
  { riderId: 'r2', primaryHorseId: 'h4' },
  { riderId: 'r3', primaryHorseId: 'h8' },
  { riderId: 'r4', primaryHorseId: 'h1' },
  { riderId: 'r5', primaryHorseId: 'h10' },
  { riderId: 'r6', primaryHorseId: 'h2' },
  { riderId: 'r7', primaryHorseId: 'h6' },
  { riderId: 'r8', primaryHorseId: 'h7' },
  { riderId: 'r9', primaryHorseId: 'h5' },
  { riderId: 'r10', primaryHorseId: 'h3' },
];

export const HORSE_PRIMARY_RIDER = [
  { horseId: 'h9', primaryRiderId: 'r1' },
  { horseId: 'h4', primaryRiderId: 'r2' },
  { horseId: 'h8', primaryRiderId: 'r3' },
  { horseId: 'h1', primaryRiderId: 'r4' },
  { horseId: 'h10', primaryRiderId: 'r5' },
  { horseId: 'h2', primaryRiderId: 'r6' },
  { horseId: 'h6', primaryRiderId: 'r7' },
  { horseId: 'h7', primaryRiderId: 'r8' },
  { horseId: 'h5', primaryRiderId: 'r9' },
  { horseId: 'h3', primaryRiderId: 'r10' },
];

// Mapping Rule derived from PrimaryEventId in Photographer
const PHOTOGRAPHER_EVENT_MAP: Record<string, string> = {
  'hanna-bjork': 'c1',
  'klara-fors': 'c2',
  'ida-holmgren': 'c3',
  'tove-lund': 'c4',
  'sara-engstrom': 'c5',
  'johan-lindahl': 'c6',
  'erik-nyberg': 'c7',
  'mattias-berg': 'c8',
  'daniel-soder': 'c9',
  'per-hedman': 'c10',
};

const DUMMY_EVENTS = [
  { id: 'd1', name: 'Club Series' },
  { id: 'd2', name: 'Indoor Tour' },
  { id: 'd3', name: 'Weekend Cup' },
];

// Helper
export const getActivePhotographerProfile = (
  photographerId: string = 'hanna-bjork',
) => {
  const photographer =
    PHOTOGRAPHERS.find(p => p.id === photographerId) || PHOTOGRAPHERS[0];
  const compId =
    PHOTOGRAPHER_EVENT_MAP[photographer.id] || photographer.primaryEventId;
  const realCompetition =
    COMPETITIONS.find(c => c.id === compId) || COMPETITIONS[0];

  return {
    photographer,
    primaryEvent: realCompetition,
    dummyEvents: DUMMY_EVENTS,
  };
};

export const photos: Photo[] = [];

PHOTOGRAPHERS.forEach(p => {
  p.highlights = [];
});
