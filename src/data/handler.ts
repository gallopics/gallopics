import { http, HttpResponse } from 'msw';

export const handlers = [
  http.get('/api/riders', () => {
    return HttpResponse.json([
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
    ]);
  }),
];
