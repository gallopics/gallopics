import { COMPETITIONS } from './mockData';
import { mockEvents } from './mockEvents';
import type { EventDetail, DailySchedule, Arena, ClassSection, Meeting } from '../types';
import { assetUrl } from '../lib/utils';

// Helper to pick random int range
const randomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const pickRandom = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

// Venues & Clubs mapping (Mock)
const VENUES = [
    { venue: "Friends Arena Showground", club: "Stockholms Fältrittklubb" },
    { venue: "Scandinavium Arena", club: "Gothenburg Horse Club" },
    { venue: "Falsterbo Horse Show Arena", club: "Falsterbo Horse Club" },
    { venue: "Strömsholm Castle Park", club: "Strömsholm Riding Association" },
    { venue: "Flyinge Kungsgård", club: "Flyinge Riding Club" }
];

export const eventDetails: EventDetail[] = COMPETITIONS.map((comp) => {
    // 1. Get enriched data from mockEvents (cover image etc)
    const enriched = mockEvents.find(e => e.id === comp.id);
    const coverImage = enriched?.coverImage || assetUrl('images/events/default.png');

    // 2. Generate Meeting Info
    // Randomize venue info if not specific
    const venueInfo = pickRandom(VENUES);
    const discipline = comp.discipline || "Show Jumping";

    const meeting: Meeting = {
        id: comp.id,
        name: comp.name,
        country: { name: comp.country, code: comp.countryCode },
        city: comp.city,
        venueName: venueInfo.venue,
        clubName: venueInfo.club,
        period: { startDate: comp.date, endDate: comp.endDate },
        disciplines: [discipline],
        timezone: "Europe/Stockholm",
        photoCount: randomInt(350, 850), // Reflect larger photo pool
        coverImage: coverImage,
        logo: enriched?.logo || '',
        photographer: enriched?.photographer || undefined
    };

    // 3. Generate Schedule (2 Days)
    // Create actual Date objects to step through
    const startDate = new Date(comp.date);
    const schedule: DailySchedule[] = [];

    // Generate 2 days
    for (let d = 0; d < 2; d++) {
        const currentDate = new Date(startDate);
        currentDate.setDate(startDate.getDate() + d);
        const dateStr = currentDate.toISOString().split('T')[0];

        // 4. Generate Arenas (2 per day)
        const arenas: Arena[] = [];
        const arenaNames = ["Main Arena", "International Ring", "Showground A", "Grand Hall"];

        for (let a = 0; a < 2; a++) {
            const arenaId = `a-${comp.id}-d${d + 1}-a${a + 1}`;

            // 5. Generate Competitions (3 per arena)
            const competitions: ClassSection[] = [];
            for (let c = 0; c < 3; c++) {
                const heights = ["1.10m", "1.15m", "1.20m", "1.30m", "1.40m", "Grand Prix 1.50m"];
                const className = pickRandom(heights);

                // Staggered times: 09:00, 12:00, 15:00...
                const hour = 9 + (c * 3);
                const timeStr = `${hour < 10 ? '0' : ''}${hour}:00`;

                competitions.push({
                    classSectionId: `cs-${comp.id}-${d}-${a}-${c}`,
                    name: className,
                    startTime: timeStr,
                    position: c + 1,
                    discipline: discipline,
                    entriesCount: randomInt(20, 70)
                });
            }

            arenas.push({
                id: arenaId,
                name: arenaNames[a] || `Arena ${a + 1}`,
                position: a + 1,
                competitions: competitions
            });
        }

        schedule.push({
            date: dateStr,
            arenas: arenas
        });
    }

    return {
        meetingId: comp.id,
        meeting,
        schedule
    };
});
