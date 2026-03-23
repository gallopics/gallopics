import { COMPETITIONS, PHOTOGRAPHERS } from './mockData';
import { assetUrl } from '../lib/utils';

export interface EventData {
    id: string;
    name: string;
    coverImage: string;
    period: string; // e.g., "12 Jun – 14 Jun 2026"
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
const EVENT_ASSETS: Record<string, { cover: string; logo: string; count: number }> = {
    c1: {
        cover: assetUrl('images/Abdel_Said_Arpege_du_RU5978.jpg'),
        logo: assetUrl('images/Sweden International Horse Show.jpg'),
        count: 820
    },
    c2: {
        cover: assetUrl('images/Alice_Nilsson_Eunomia8286.jpg'),
        logo: assetUrl('images/Gothenburg Indoor Masters.jpg'),
        count: 745
    },
    c3: {
        cover: assetUrl('images/Falsterbo7800.jpg'),
        logo: assetUrl('images/Falsterbo Summer Classic.jpg'),
        count: 920
    },
    c4: {
        cover: assetUrl('images/Peder_Fredricson_Alcapone_des_Carmille8136.jpg'),
        logo: assetUrl('images/Strömsholm Spring Dressage.jpg'),
        count: 550
    },
    c5: {
        cover: assetUrl('images/Anna_Svanberg_Vidar9116.jpg'),
        logo: assetUrl('images/Uppsala Arena Cup.jpg'),
        count: 480
    },
    c6: {
        cover: assetUrl('images/Fredrik_Spetz_Galactee_de_Tivoli8292.jpg'),
        logo: assetUrl('images/Malmö City Jumping.jpg'),
        count: 620
    },
    c7: {
        cover: assetUrl('images/Alma_Nilsson_Sall_Kilimanjaro_WV7865.jpg'),
        logo: assetUrl('images/Linköping Eventing Weekend.jpg'),
        count: 410
    },
    c8: {
        cover: assetUrl('images/Felicia_Hultberg_Bollerup_Chiquelle8407.jpg'),
        logo: assetUrl('images/Örebro Autumn Cup.jpg'),
        count: 380
    },
    c9: {
        cover: assetUrl('images/Amanda_Landeblad_Joelina6763.jpg'),
        logo: assetUrl('images/Umeå Northern Lights Dressage.jpg'),
        count: 590
    },
    c10: {
        cover: assetUrl('images/Carl-Walter_Fox_Eka_First_Navy_Jack8998.jpg'),
        logo: assetUrl('images/Jönköping Lake District Classic.jpg'),
        count: 420
    },
};

// Helper: Format date range
function formatPeriod(start: string, end?: string): string {
    // start: YYYY-MM-DD
    const sDate = new Date(start);
    const eDate = end ? new Date(end) : null;

    const options: Intl.DateTimeFormatOptions = { day: '2-digit', month: 'short' };
    const sStr = sDate.toLocaleDateString('en-GB', options);

    if (eDate) {
        const eStr = eDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
        return `${sStr} – ${eStr}`;
    }
    return `${sStr} ${sDate.getFullYear()}`;
}

export const mockEvents: EventData[] = COMPETITIONS.map(comp => {
    // Find assigned photographer
    // Logic: pX assigned to cX
    const photographer = PHOTOGRAPHERS.find(p => p.primaryEventId === comp.id) || PHOTOGRAPHERS[0];
    const assets = EVENT_ASSETS[comp.id] || EVENT_ASSETS['c1'];

    return {
        id: comp.id,
        name: comp.name,
        coverImage: assets.cover,
        period: formatPeriod(comp.date, comp.endDate),
        flag: '🇸🇪', // Everyone is Sweden per request
        city: comp.city,
        discipline: comp.discipline || 'Show Jumping',
        country: comp.country,
        photoCount: assets.count,
        logo: assets.logo,
        photographer: {
            id: photographer.id,
            name: `${photographer.firstName} ${photographer.lastName}`,
            avatar: assetUrl(`images/${photographer.firstName} ${photographer.lastName}.jpg`) // Maps to real files e.g. "Hanna Björk.jpg"
        }
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
        logo: assetUrl('images/Uppsala Arena Cup.jpg'), // Reusing existing mock logo
        photographer: {
            id: 'p1',
            name: 'Hanna Björk',
            avatar: assetUrl('images/Hanna Björk.jpg')
        },
        status: 'disabled'
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
        logo: assetUrl('images/Malmö City Jumping.jpg'), // Reusing existing mock logo
        photographer: null,
        status: 'disabled'
    }
];

export const allMockEvents = [...mockEvents, ...disabledEvents];
