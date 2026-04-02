import { http, HttpResponse } from 'msw';

export const handlers = [
  http.get('/api/riders', () => {
    return HttpResponse.json([
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
    ]);
  }),
];
