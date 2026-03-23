import type { Photo } from '../types';
import { assetUrl } from '../lib/utils';

// --- USER PROVIDED MOCK DATA (Synced 2026-01-17) ---

export const RIDERS = [
    { "id": "r1", "firstName": "Ebba", "lastName": "Lindström", "gender": "F", "countryCode": "SE" },
    { "id": "r2", "firstName": "Maja", "lastName": "Sjöberg", "gender": "F", "countryCode": "SE" },
    { "id": "r3", "firstName": "Alva", "lastName": "Karlsson", "gender": "F", "countryCode": "SE" },
    { "id": "r4", "firstName": "Nora", "lastName": "Bergqvist", "gender": "F", "countryCode": "SE" },
    { "id": "r5", "firstName": "Elsa", "lastName": "Håkansson", "gender": "F", "countryCode": "SE" },
    { "id": "r6", "firstName": "Signe", "lastName": "Jonsson", "gender": "F", "countryCode": "SE" },
    { "id": "r7", "firstName": "Freja", "lastName": "Nyström", "gender": "F", "countryCode": "SE" },
    { "id": "r8", "firstName": "Linnea", "lastName": "Ek", "gender": "F", "countryCode": "SE" },
    { "id": "r9", "firstName": "Oskar", "lastName": "Wallin", "gender": "M", "countryCode": "SE" },
    { "id": "r10", "firstName": "Viktor", "lastName": "Sundberg", "gender": "M", "countryCode": "SE" }
];

export const PHOTOGRAPHERS = [
    { "id": "hanna-bjork", "firstName": "Hanna", "lastName": "Björk", "gender": "F", "countryCode": "SE", "primaryEventId": "c1", highlights: [] as string[], city: "Stockholm", isAvailableToHire: true },
    { "id": "klara-fors", "firstName": "Klara", "lastName": "Fors", "gender": "F", "countryCode": "SE", "primaryEventId": "c2", highlights: [] as string[], city: "Göteborg", isAvailableToHire: false },
    { "id": "ida-holmgren", "firstName": "Ida", "lastName": "Holmgren", "gender": "F", "countryCode": "SE", "primaryEventId": "c3", highlights: [] as string[], city: "Malmö", isAvailableToHire: true },
    { "id": "tove-lund", "firstName": "Tove", "lastName": "Lund", "gender": "F", "countryCode": "SE", "primaryEventId": "c4", highlights: [] as string[], city: "Uppsala", isAvailableToHire: true },
    { "id": "sara-engstrom", "firstName": "Sara", "lastName": "Engström", "gender": "F", "countryCode": "SE", "primaryEventId": "c5", highlights: [] as string[], city: "Västerås", isAvailableToHire: false },
    { "id": "johan-lindahl", "firstName": "Johan", "lastName": "Lindahl", "gender": "M", "countryCode": "SE", "primaryEventId": "c6", highlights: [] as string[], city: "Örebro", isAvailableToHire: true },
    { "id": "erik-nyberg", "firstName": "Erik", "lastName": "Nyberg", "gender": "M", "countryCode": "SE", "primaryEventId": "c7", highlights: [] as string[], city: "Linköping", isAvailableToHire: true },
    { "id": "mattias-berg", "firstName": "Mattias", "lastName": "Berg", "gender": "M", "countryCode": "SE", "primaryEventId": "c8", highlights: [] as string[], city: "Helsingborg", isAvailableToHire: false },
    { "id": "daniel-soder", "firstName": "Daniel", "lastName": "Söder", "gender": "M", "countryCode": "SE", "primaryEventId": "c9", highlights: [] as string[], city: "Jönköping", isAvailableToHire: true },
    { "id": "per-hedman", "firstName": "Per", "lastName": "Hedman", "gender": "M", "countryCode": "SE", "primaryEventId": "c10", highlights: [] as string[], city: "Norrköping", isAvailableToHire: true }
];

export const HORSES = [
    { "id": "h1", "name": "Nordic Aurora", "registeredName": "Nordic Aurora" },
    { "id": "h2", "name": "Silver Tindra", "registeredName": "Silver Tindra" },
    { "id": "h3", "name": "Stormvind", "registeredName": "Stormvind" },
    { "id": "h4", "name": "Midnight Saga", "registeredName": "Midnight Saga" },
    { "id": "h5", "name": "Lilla Fjord", "registeredName": "Lilla Fjord" },
    { "id": "h6", "name": "Valhalla Rune", "registeredName": "Valhalla Rune" },
    { "id": "h7", "name": "Skärgårdsprins", "registeredName": "Skärgårdsprins" },
    { "id": "h8", "name": "Göta Glimt", "registeredName": "Göta Glimt" },
    { "id": "h9", "name": "Björkdal Brave", "registeredName": "Björkdal Brave" },
    { "id": "h10", "name": "Frost Nova", "registeredName": "Frost Nova" }
];

export const COMPETITIONS = [
    { "id": "c1", "name": "Sweden International Horse Show", "country": "Sweden", "countryCode": "SE", "city": "Stockholm", "discipline": "Show Jumping", "date": "2026-01-20", "endDate": "2026-01-23" }, // Live
    { "id": "c2", "name": "Gothenburg Indoor Masters", "country": "Sweden", "countryCode": "SE", "city": "Göteborg", "discipline": "Show Jumping", "date": "2026-01-10", "endDate": "2026-01-12" }, // Recent
    { "id": "c3", "name": "Falsterbo Summer Classic", "country": "Sweden", "countryCode": "SE", "city": "Falsterbo", "discipline": "Show Jumping", "date": "2026-01-05", "endDate": "2026-01-08" }, // Recent
    { "id": "c4", "name": "Strömsholm Spring Dressage", "country": "Sweden", "countryCode": "SE", "city": "Strömsholm", "discipline": "Dressage", "date": "2026-05-08", "endDate": "2026-05-10" },
    { "id": "c5", "name": "Uppsala Arena Cup", "country": "Sweden", "countryCode": "SE", "city": "Uppsala", "discipline": "Show Jumping", "date": "2026-01-15", "endDate": "2026-01-16" }, // Recent
    { "id": "c6", "name": "Malmö City Jumping", "country": "Sweden", "countryCode": "SE", "city": "Malmö", "discipline": "Show Jumping", "date": "2026-04-25", "endDate": "2026-04-26" },
    { "id": "c7", "name": "Linköping Eventing Weekend", "country": "Sweden", "countryCode": "SE", "city": "Linköping", "discipline": "Eventing", "date": "2026-09-05", "endDate": "2026-09-06" },
    { "id": "c8", "name": "Örebro Autumn Cup", "country": "Sweden", "countryCode": "SE", "city": "Örebro", "discipline": "Show Jumping", "date": "2026-10-10", "endDate": "2026-10-11" },
    { "id": "c9", "name": "Umeå Northern Lights Dressage", "country": "Sweden", "countryCode": "SE", "city": "Umeå", "discipline": "Dressage", "date": "2026-01-19", "endDate": "2026-01-22" }, // Live
    { "id": "c10", "name": "Jönköping Lake District Classic", "country": "Sweden", "countryCode": "SE", "city": "Jönköping", "discipline": "Show Jumping", "date": "2026-06-12", "endDate": "2026-06-14" }
];

// Explicit Associations for Search/Profile logic
export const RIDER_PRIMARY_HORSE = [
    { "riderId": "r1", "primaryHorseId": "h9" },
    { "riderId": "r2", "primaryHorseId": "h4" },
    { "riderId": "r3", "primaryHorseId": "h8" },
    { "riderId": "r4", "primaryHorseId": "h1" },
    { "riderId": "r5", "primaryHorseId": "h10" },
    { "riderId": "r6", "primaryHorseId": "h2" },
    { "riderId": "r7", "primaryHorseId": "h6" },
    { "riderId": "r8", "primaryHorseId": "h7" },
    { "riderId": "r9", "primaryHorseId": "h5" },
    { "riderId": "r10", "primaryHorseId": "h3" }
];

export const HORSE_PRIMARY_RIDER = [
    { "horseId": "h9", "primaryRiderId": "r1" },
    { "horseId": "h4", "primaryRiderId": "r2" },
    { "horseId": "h8", "primaryRiderId": "r3" },
    { "horseId": "h1", "primaryRiderId": "r4" },
    { "horseId": "h10", "primaryRiderId": "r5" },
    { "horseId": "h2", "primaryRiderId": "r6" },
    { "horseId": "h6", "primaryRiderId": "r7" },
    { "horseId": "h7", "primaryRiderId": "r8" },
    { "horseId": "h5", "primaryRiderId": "r9" },
    { "horseId": "h3", "primaryRiderId": "r10" }
];

// Mapping Rule derived from PrimaryEventId in Photographer
const PHOTOGRAPHER_EVENT_MAP: Record<string, string> = {
    "hanna-bjork": "c1", "klara-fors": "c2", "ida-holmgren": "c3", "tove-lund": "c4", "sara-engstrom": "c5",
    "johan-lindahl": "c6", "erik-nyberg": "c7", "mattias-berg": "c8", "daniel-soder": "c9", "per-hedman": "c10"
};

const DUMMY_EVENTS = [
    { id: 'd1', name: "Club Series" },
    { id: 'd2', name: "Indoor Tour" },
    { id: 'd3', name: "Weekend Cup" }
];

// Helper
export const getActivePhotographerProfile = (photographerId: string = "hanna-bjork") => {
    const photographer = PHOTOGRAPHERS.find(p => p.id === photographerId) || PHOTOGRAPHERS[0];
    const compId = PHOTOGRAPHER_EVENT_MAP[photographer.id] || photographer.primaryEventId;
    const realCompetition = COMPETITIONS.find(c => c.id === compId) || COMPETITIONS[0];

    return {
        photographer,
        primaryEvent: realCompetition,
        dummyEvents: DUMMY_EVENTS
    };
};

// --- REAL ASSETS (Web Safe) ---
const filenames = [
    "Abdel_Said_Arpege_du_RU5978.jpg",
    "Alice_Nilsson_Eunomia8286.jpg",
    "Alicia_Svensson_Filourado_PS8003.jpg",
    "Alma_Nilsson_Sall_Kilimanjaro_WV7865.jpg",
    "Amanda_Landeblad_Joelina6763.jpg",
    "Amanda_Landeblad_Little_Clara9952.jpg",
    "Amanda_Thagesson_Hop_Living8848.jpg",
    "Anna_Svanberg_Vidar9116.jpg",
    "Annie_Hjerten_Clementine_PJ9738.jpg",
    "Astrid_Lund_Wisholm_Kastanjelunds_Rainbow8397.jpg",
    "Ayleen_Ejderland_Fan_Byarah8230.jpg",
    "Carl-Walter_Fox_Eka_First_Navy_Jack8998.jpg",
    "Cathrine_Laudrup-Dufour_Mount_St_John_Freestyle7222.jpg",
    "Cathrine_Laudrup-Dufour_Mount_St_John_Freestyle7225.jpg",
    "DSC_8370.jpg",
    "Dorothee_Schneider_First_Romance_27059.jpg",
    "Ella_Lofqvist_Linus8899.jpg",
    "Falsterbo7800.jpg",
    "Felicia_Hultberg_Bollerup_Chiquelle8407.jpg",
    "Filippa_Skogstrom_Melvin_D7871.jpg",
    "Fredrik_Spetz_Galactee_de_Tivoli8292.jpg",
    "Hannes_Ahlmann_Coquetto6713.jpg",
    "Harrie_Smolders_Ecclestone_Z6875.jpg",
    "Harrie_Smolders_Kaspar_R5870.jpg",
    "Henrik_von_Eckermann_Minute_Man8186.jpg",
    "Ida_Kuchenmeistern_Nordenberg_Qorruption9047.jpg",
    "Jenny_Krogsaeter_Quana_Van_Klapscheut8330.jpg",
    "Jens_Fredricson_Diarado_s_Rose_Elith6554.jpg",
    "Kim_Emmen_Nimrod_Dmh6923.jpg",
    "Linda_Heed_Skylander_VS6604.jpg",
    "Linnea_Nord_Major_Dice9747.jpg",
    "Marcus_Westergren_Qualando_de_Caramel9946.jpg",
    "Maria_von_Essen_Invoice7241.jpg",
    "Max_Kuhner_Nouri_W6680.jpg",
    "Nicole_Holmen_Bollerup_Big_Bang9527.jpg",
    "Peder_Fredricson_Alcapone_des_Carmille8136.jpg",
    "Peder_Fredricson_Iggy9507.jpg",
    "Peder_Fredricson_Qurious_HS9235.jpg",
    "Philip_Svitzer_Alida_Nike9979.jpg",
    "Trevor_Breen_Konrad_Obolensky8300.jpg",
    "Viktor_Edvinsson_Ada_Race6935.jpg"
];

const generateId = () => Math.random().toString(36).substr(2, 9);
const pickRandom = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

// Generate 1000 Photos to ensure density across all profiles/events
export const photos: Photo[] = Array.from({ length: 1000 }).map((_, i) => {
    const filename = filenames[i % filenames.length];

    // Use modulo to ensure even distribution but mix it up slightly for variation
    const riderIdx = i % RIDERS.length;
    const compIdx = (i + Math.floor(i / RIDERS.length)) % COMPETITIONS.length;
    const pgIdx = (i + Math.floor(i / COMPETITIONS.length)) % PHOTOGRAPHERS.length;

    const rider = RIDERS[riderIdx];
    const horseMapping = RIDER_PRIMARY_HORSE.find(m => m.riderId === rider.id);
    const horse = HORSES.find(h => h.id === horseMapping?.primaryHorseId) || HORSES[0];
    const comp = COMPETITIONS[compIdx];
    const pg = PHOTOGRAPHERS[pgIdx];

    const width = pickRandom([600, 800, 700]);
    const height = pickRandom([600, 800, 500, 900]);

    // PG States
    const statuses: any[] = ['published', 'published', 'archived', 'uploadedUnpublished', 'needsReview'];
    const status = statuses[i % statuses.length];
    const batchList = ['Random', 'Misc', 'Uncategorised', 'Class A', 'Class B'];
    const batch = batchList[i % batchList.length];
    const soldCount = status === 'published' || status === 'archived' ? (i % 5 === 0 ? 0 : Math.floor(Math.random() * 8)) : 0;

    // Ensure at least some archived photos have sales for the "Sold" bucket
    // Increase frequency: Make 50% of archived photos have sales
    const finalSoldCount = (status === 'archived' && i % 2 === 0) ? Math.floor(Math.random() * 5) + 3 : soldCount;

    return {
        id: `m-${i}-${generateId()}`,
        src: assetUrl(`images/${filename}`),
        rider: rider.firstName + ' ' + rider.lastName,
        horse: horse.name,
        event: comp.name,
        eventId: comp.id,
        date: comp.date,
        width: width,
        height: height,
        className: 'photo-grid-item',
        time: `${10 + (i % 8)}:00`, // Mix times
        city: comp.city,
        arena: `${comp.city} Arena`,
        countryCode: comp.countryCode.toLowerCase(),
        discipline: comp.discipline,
        photographer: pg.firstName + ' ' + pg.lastName,
        photographerId: pg.id,
        // Photographer Workspace fields
        status: status,
        batch: batch,
        soldCount: finalSoldCount,
        photoCode: `GAL-${1000 + i}`,
        fileName: filename,
        timestamp: '10:42 AM',
        uploadDate: '2026-01-17',
        storedLocation: status === 'published' ? 'Published' : (batch || 'Random'),
        priceStandard: 499,
        priceHigh: 999,
        priceCommercial: 1500,
        isGeneric: i % 10 === 0
    };
});

// --- POPULATE MOCK HIGHLIGHTS ---
// Give highlights to all photographers
PHOTOGRAPHERS.forEach((p) => {
    // Pick up to 10 random photos for highlights
    const count = 10;
    const shuffled = [...photos].filter(photo => photo.photographerId === p.id).sort(() => 0.5 - Math.random());
    p.highlights = shuffled.slice(0, count).map(ph => ph.id);
});
