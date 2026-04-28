import React, {
  createContext,
  useContext,
  useState,
  type ReactNode,
} from 'react';
import { assetUrl } from '../lib/utils';
import { useAuth } from './AuthContext';

// --- Types ---

export type EventStatus = 'upcoming' | 'open' | 'archived';

export interface PgEvent {
  id: string;
  title: string;
  date: string; // Start date for sorting/simple display
  dateRange: string; // Full range "26 Nov – 30 Nov 2026"
  location: string;
  coverImage: string;
  status: EventStatus;

  // Stats for "My events"
  photosCount?: number;
  publishedCount?: number;
  soldCount?: number;

  // For "Upcoming" logic
  isRegistered?: boolean;
  logo: string;
  venueName: string;
  disciplines: string[];
  city: string;
  assignedPhotographers?: { id: string; name: string; avatar: string }[];
  applicationsWelcomed?: boolean;
}

export interface Photo {
  id: string;
  url: string;
  eventId: string;
  status:
    | 'uploading'
    | 'processing'
    | 'needsReview'
    | 'uploadedUnpublished'
    | 'published'
    | 'archived';
  soldCount: number;
  /* Metadata */
  rider?: string;
  riderId?: string;
  horse?: string;
  horseId?: string;
  timestamp?: string;
  width: number;
  height: number;
  title?: string;
  description?: string;
  isGeneric?: boolean;
  /* New fields for Uploads tab */
  fileName?: string;
  photoCode?: string; // e.g. "PHT-9X2A1"
  uploadDate?: string; // ISO date string
  batch?: string; // Batch name (empty = Uncategorised)
  classId?: string;
  className?: string;
  isDuplicate?: boolean;
  duplicateResolved?: boolean; // True after "Keep" action resolves duplicates
  duplicateGroupId?: string; // Identifies which duplicate group this instance belongs to
  storedLocation?: 'Random' | 'Misc' | 'Uncategorised' | 'Published'; // Where this instance lives
  priceStandard?: number; // e.g. 499
  priceHigh?: number; // e.g. 999
  priceCommercial?: number; // e.g. 1500
}

export interface UploadFile {
  id: string;
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'failed';
  error?: string;
}

export interface UploadSession {
  eventId: string;
  status: 'uploading' | 'completed';
  files: UploadFile[];
  startTime: number;
}

interface PhotographerContextType {
  photographerId: string;
  events: PgEvent[];
  allPhotos: Photo[];
  getEvent: (id: string) => PgEvent | undefined;

  // Actions
  registerForEvent: (eventId: string) => void;

  // Photos
  getPhotosByEvent: (eventId: string) => Photo[];
  updatePhotoStatus: (photoIds: string[], status: Photo['status']) => void;
  deletePhotos: (photoIds: string[]) => void;
  restorePhotos: (photosToRestore: Photo[]) => void;
  setPhotoPrice: (photoIds: string[], price: number) => void;
  updatePhotoMetadata: (photoIds: string[], metadata: Partial<Photo>) => void;
  republishPhoto: (photoId: string) => void;

  // Duplicates
  resolveDuplicate: (photoId: string, action: 'keep' | 'remove') => void;

  // Upload System
  isUploadOverlayOpen: boolean;
  currentUploadEventId: string | null;
  uploadSessions: Record<string, UploadSession>; // Keyed by eventId
  openUploadOverlay: (eventId: string) => void;
  closeUploadOverlay: () => void;
  setCurrentUploadEventId: (eventId: string | null) => void; // New export
  startUpload: (files: File[], metadata?: { classId?: string }) => void; // Updated sig
  clearUploadSession: (eventId: string) => void;
  removeUploadFile: (eventId: string, fileId: string) => void;

  // Highlights
  highlights: string[];
  updateHighlights: (ids: string[]) => void;
  availableToHire: boolean;
  toggleAvailableToHire: (val: boolean) => void;
}

import { allMockEvents, type EventData, SHOW_EVENTS } from '../data/mockEvents';
import {
  photos as basePhotos,
  RIDERS,
  HORSES,
  RIDER_PRIMARY_HORSE,
  PHOTOGRAPHERS,
} from '../data/mockData';

// Mapped Data based on shared mockEvents
// Filter/Assign events to our mock photographer "Klara Fors"
// For the purpose of this workspace demo, we'll treat the first few events as "My Events" (registered)
// and others as "Upcoming".

const mapToPgEvent = (e: EventData, isMyEvent: boolean): PgEvent => {
  return {
    id: e.id,
    title: e.name,
    date: e.period.split(' – ')[0] || e.period,
    dateRange: e.period,
    location: `${e.city}, Sweden`, // Based on mockEvents hardcoded '🇸🇪'
    coverImage: e.coverImage,
    status: isMyEvent ? 'open' : 'upcoming',
    isRegistered: isMyEvent,
    photosCount: e.photoCount || 0,
    publishedCount: isMyEvent ? Math.floor((e.photoCount || 0) * 0.8) : 0,
    soldCount: isMyEvent ? Math.floor((e.photoCount || 0) * 0.1) : 0,
    logo: e.logo,
    venueName: e.name.includes('Gothenburg')
      ? 'Scandinavium'
      : e.name.includes('Falsterbo')
        ? 'Falsterbo Arena'
        : 'Main Arena', // Simple mock mapping or use actual data if available
    disciplines: [e.discipline],
    city: e.city,
    assignedPhotographers: e.photographer ? [e.photographer] : [],
    applicationsWelcomed: true, // Defaulting to true for mock data
  };
};

const MY_EVENT_IDS = ['c1', 'c2', 'c3', 'c4', 'c5'];

const MOCK_EVENTS: PgEvent[] = allMockEvents.map(e => {
  const isMine = MY_EVENT_IDS.includes(e.id);
  const mapped = mapToPgEvent(e, isMine);

  // Apply Admin flow logic based on status
  const isUpcoming = mapped.status === 'upcoming';

  if (isUpcoming) {
    if (e.id === 'c10') {
      // "Last 3rd card from the below" (of the original 7)
      // One pg assigned, status OPEN (more than one can apply)
      mapped.assignedPhotographers = [
        {
          id: PHOTOGRAPHERS[1].id,
          name: `${PHOTOGRAPHERS[1].firstName} ${PHOTOGRAPHERS[1].lastName}`,
          avatar: assetUrl(
            `images/${PHOTOGRAPHERS[1].firstName} ${PHOTOGRAPHERS[1].lastName}.jpg`,
          ),
        },
      ];
      mapped.applicationsWelcomed = true;
    } else if (e.id === 'd1' || e.id === 'd2') {
      // Last two
      mapped.applicationsWelcomed = false;
      if (
        !mapped.assignedPhotographers ||
        mapped.assignedPhotographers.length === 0
      ) {
        mapped.assignedPhotographers = [
          {
            id: PHOTOGRAPHERS[0].id,
            name: `${PHOTOGRAPHERS[0].firstName} ${PHOTOGRAPHERS[0].lastName}`,
            avatar: assetUrl(
              `images/${PHOTOGRAPHERS[0].firstName} ${PHOTOGRAPHERS[0].lastName}.jpg`,
            ),
          },
        ];
      }
    } else {
      // c6, c7, c8, c9
      mapped.assignedPhotographers = [];
      mapped.applicationsWelcomed = true;
    }
  } else {
    // Live, Past, Archived: Always Assigned & App status OFF
    mapped.applicationsWelcomed = false;
    // assignedPhotographers logic already handles assigning a photographer if present in mockData
    if (
      !mapped.assignedPhotographers ||
      mapped.assignedPhotographers.length === 0
    ) {
      // Fallback: assign the first photographer if none exists
      mapped.assignedPhotographers = [
        {
          id: PHOTOGRAPHERS[0].id,
          name: `${PHOTOGRAPHERS[0].firstName} ${PHOTOGRAPHERS[0].lastName}`,
          avatar: assetUrl(
            `images/${PHOTOGRAPHERS[0].firstName} ${PHOTOGRAPHERS[0].lastName}.jpg`,
          ),
        },
      ];
    }
  }

  // User request: Let the first one (c1) have no cover.
  if (e.id === 'c1') {
    mapped.coverImage = '';
  }

  return mapped;
});

// Helpers for randomization (Copied/Adapted from EventProfile.tsx)
function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}
const randomInt = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min) + min);

// Class names from existing mock data patterns (Limited to 3 per user request)
const MOCK_CLASSES = ['1.20m Jumping', '1.30m Grand Prix', 'Dressage Int. B'];
const MOCK_BATCHES = ['Random', 'Misc', '']; // Empty = Uncategorised

const generatePhotoCode = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  return (
    'PHT-' +
    Array.from(
      { length: 5 },
      () => chars[Math.floor(Math.random() * chars.length)],
    ).join('')
  );
};

const generateMockPhotos = (eventId: string, count: number): Photo[] => {
  const srcPool = Array.from(new Set(basePhotos.map(p => p.src)));

  return Array.from({ length: count }).map((_, i) => {
    const src = pick(srcPool);

    const ratioType = Math.random();
    let width = 600;
    let height = 800;
    if (ratioType > 0.66) {
      width = 800;
      height = 600;
    } else if (ratioType > 0.33) {
      width = 800;
      height = 800;
    }

    if (ratioType < 0.33) height += randomInt(-50, 50);

    // Determine mock status - Increased Published density for better demo
    const rand = Math.random();
    let status: Photo['status'] = 'uploadedUnpublished'; // Default for "Uploads" tab
    let soldCount = 0;

    if (rand > 0.65) {
      // 35% are published now
      status = 'published';
      // Randomly assign soldCount (Mostly 0, some 1, a few 2)
      const sellRand = Math.random();
      if (sellRand > 0.8) soldCount = 1; // 20% of published have 1 sale
      if (sellRand > 0.95) soldCount = 2; // 5% of published have 2 sales
    } else if (rand > 0.5) {
      // 15% are archived (Increased density)
      status = 'archived';
      // Archived photos can have sales history too
      const sellRand = Math.random();
      if (sellRand > 0.4) soldCount = randomInt(2, 6); // 60% of archived have 2-5 sales
    } else if (rand > 0.45) {
      // 10% need review
      status = 'needsReview';
    }

    // New metadata for Uploads tab
    const hasTags = Math.random() > 0.1; // 90% have tags
    const batch = pick(MOCK_BATCHES);
    const hasClass = hasTags && Math.random() > 0.2; // 80% of tagged photos have a class
    const classData = hasClass ? pick(MOCK_CLASSES) : undefined;

    // Use consistent rider/horse names to ensure good distribution per tag
    const riderIndex = i % 3 < 2 ? i % 2 : 2; // 2/3 of photos use first 2 riders
    const selectedRider = RIDERS[riderIndex];
    const selectedHorseMapping = RIDER_PRIMARY_HORSE.find(
      m => m.riderId === selectedRider.id,
    );
    const selectedHorse =
      HORSES.find(h => h.id === selectedHorseMapping?.primaryHorseId) ||
      HORSES[0];

    // Randomize price bundles for Published filtering coverage
    const bundleRand = Math.random();
    let priceStandard = 499;
    let priceHigh = 999;
    let priceCommercial = 1500;

    if (bundleRand < 0.33) {
      // Basic (previously lower, now harmonized)
      priceStandard = 499;
      priceHigh = 999;
      priceCommercial = 1500;
    } else if (bundleRand < 0.66) {
      // Standard
      priceStandard = 499;
      priceHigh = 999;
      priceCommercial = 1500;
    }

    const isDuplicate = false;
    const isGeneric = hasTags && Math.random() > 0.8; // 20% of tagged photos are generic

    return {
      id: `${eventId}-p-${i}-${generatePhotoCode().slice(4)}`,
      url: src,
      eventId: eventId,
      status: status,
      soldCount: soldCount,
      rider:
        hasTags && !isGeneric
          ? `${selectedRider.firstName} ${selectedRider.lastName}`
          : undefined,
      riderId: hasTags && !isGeneric ? selectedRider.id : undefined,
      horse: hasTags && !isGeneric ? selectedHorse.name : undefined,
      horseId: hasTags && !isGeneric ? selectedHorse.id : undefined,
      timestamp: `${10 + (i % 8)}:${String(randomInt(0, 59)).padStart(2, '0')}`,
      width,
      height,
      title: isGeneric
        ? i % 2 === 0
          ? 'Prize ceremony'
          : 'Atmospheric'
        : `Photo ${i}`,
      description: isGeneric ? 'Beautiful sunny day at the arena' : undefined,
      isGeneric: isGeneric,
      fileName: `IMG_${2000 + i}.jpg`,
      photoCode: generatePhotoCode(),
      uploadDate: '2026-01-20',
      batch: batch,
      classId: hasClass && !isGeneric ? `class-${i % 3}` : undefined,
      className: hasClass && !isGeneric ? classData : undefined,
      isDuplicate: isDuplicate,
      storedLocation:
        status === 'published'
          ? 'Published'
          : ((batch || 'Uncategorised') as any),
      priceStandard: priceStandard,
      priceHigh: priceHigh,
      priceCommercial: priceCommercial,
    };
  });
};

const generateDuplicateGroups = (eventId: string): Photo[] => {
  const groups = [];
  // src pool for duplicates
  const srcPool = Array.from(new Set(basePhotos.map(p => p.src)));

  // Group 1: 3 instances (Random, Misc, Published)
  const src1 = srcPool[0];
  const grp1Id = 'dup-group-1';
  const baseP1 = {
    fileName: 'IMG_DUPLICATE_1.jpg',
    photoCode: 'DUP-10001',
    url: src1,
    width: 600,
    height: 800,
  };

  // Instance 1.1: Random
  groups.push({
    ...baseP1,
    id: `${eventId}-dup-1-1`,
    eventId,
    status: 'uploadedUnpublished',
    batch: 'Random',
    storedLocation: 'Random',
    isDuplicate: true,
    duplicateGroupId: grp1Id,
    soldCount: 0,
    timestamp: '10:00',
    uploadDate: '2026-01-20',
  });
  // Instance 1.2: Misc
  groups.push({
    ...baseP1,
    id: `${eventId}-dup-1-2`,
    eventId,
    status: 'uploadedUnpublished',
    batch: 'Misc',
    storedLocation: 'Misc',
    isDuplicate: true,
    duplicateGroupId: grp1Id,
    soldCount: 0,
    timestamp: '10:00',
    uploadDate: '2026-01-20',
  });
  // Instance 1.3: Published
  groups.push({
    ...baseP1,
    id: `${eventId}-dup-1-3`,
    eventId,
    status: 'published',
    batch: 'Random', // irrelevant if published usually, but let's keep it safe
    storedLocation: 'Published',
    isDuplicate: true,
    duplicateGroupId: grp1Id,
    soldCount: 0,
    timestamp: '10:00',
    uploadDate: '2026-01-20',
  });

  // Group 2: 2 instances (Uncategorised, Random)
  const src2 = srcPool[1] || srcPool[0];
  const grp2Id = 'dup-group-2';
  const baseP2 = {
    fileName: 'IMG_DUPLICATE_2.jpg',
    photoCode: 'DUP-20002',
    url: src2,
    width: 800,
    height: 600,
  };
  groups.push({
    ...baseP2,
    id: `${eventId}-dup-2-1`,
    eventId,
    status: 'uploadedUnpublished',
    batch: '', // Uncategorised
    storedLocation: 'Uncategorised',
    isDuplicate: true,
    duplicateGroupId: grp2Id,
    soldCount: 0,
    timestamp: '11:30',
    uploadDate: '2026-01-20',
  });
  groups.push({
    ...baseP2,
    id: `${eventId}-dup-2-2`,
    eventId,
    status: 'uploadedUnpublished',
    batch: 'Random',
    storedLocation: 'Random',
    isDuplicate: true,
    duplicateGroupId: grp2Id,
    soldCount: 0,
    timestamp: '11:30',
    uploadDate: '2026-01-20',
  });

  // Group 3: 2 instances (Misc, Published)
  const src3 = srcPool[2] || srcPool[0];
  const grp3Id = 'dup-group-3';
  const baseP3 = {
    fileName: 'IMG_DUPLICATE_3.jpg',
    photoCode: 'DUP-30003',
    url: src3,
    width: 600,
    height: 800,
  };
  groups.push({
    ...baseP3,
    id: `${eventId}-dup-3-1`,
    eventId,
    status: 'uploadedUnpublished',
    batch: 'Misc',
    storedLocation: 'Misc',
    isDuplicate: true,
    duplicateGroupId: grp3Id,
    soldCount: 0,
    timestamp: '14:15',
    uploadDate: '2026-01-20',
  });
  groups.push({
    ...baseP3,
    id: `${eventId}-dup-3-2`,
    eventId,
    status: 'published',
    batch: 'Misc',
    storedLocation: 'Published',
    isDuplicate: true,
    duplicateGroupId: grp3Id,
    soldCount: 0,
    timestamp: '14:15',
    uploadDate: '2026-01-20',
  });

  return groups as Photo[];
};

const MOCK_PHOTOS: Photo[] = [
  ...generateMockPhotos('c1', 120),
  ...generateDuplicateGroups('c1'),
  ...generateMockPhotos('c2', 80),
  ...generateMockPhotos('c3', 60),
];

// --- Context & Provider ---

const PhotographerContext = createContext<PhotographerContextType | undefined>(
  undefined,
);

export const PhotographerProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const { user } = useAuth();
  const photographerId = user?.id || '';
  const [events, setEvents] = useState<PgEvent[]>(
    SHOW_EVENTS ? MOCK_EVENTS : [],
  );
  const [photos, setPhotos] = useState<Photo[]>(MOCK_PHOTOS);

  // Upload State
  const [isUploadOverlayOpen, setIsUploadOverlayOpen] = useState(false);
  const [currentUploadEventId, setCurrentUploadEventId] = useState<
    string | null
  >(null);
  // Keyed by eventId
  const [uploadSessions, setUploadSessions] = useState<
    Record<string, UploadSession>
  >({});

  // Highlights
  const [highlights, setHighlights] = useState<string[]>([]);
  const [availableToHire, setAvailableToHire] = useState(true);

  // Initialize from mock data on mount
  React.useEffect(() => {
    const p = PHOTOGRAPHERS.find(p => p.id === photographerId);
    if (p) {
      if (p.highlights) setHighlights(p.highlights);
      if (typeof p.isAvailableToHire !== 'undefined')
        setAvailableToHire(p.isAvailableToHire);
    }
  }, [photographerId]);

  const updateHighlights = (ids: string[]) => {
    setHighlights(ids);
    // Sync to mock data for public visibility
    const p = PHOTOGRAPHERS.find(p => p.id === photographerId);
    if (p) {
      p.highlights = ids;
    }
  };

  const toggleAvailableToHire = (val: boolean) => {
    setAvailableToHire(val);
    const p = PHOTOGRAPHERS.find(p => p.id === photographerId);
    if (p) {
      p.isAvailableToHire = val;
    }
  };

  const getEvent = (id: string) => events.find(e => e.id === id);

  const registerForEvent = (eventId: string) => {
    setEvents(prev =>
      prev.map(e =>
        e.id === eventId ? { ...e, isRegistered: true, status: 'open' } : e,
      ),
    );
  };

  const getPhotosByEvent = (eventId: string) =>
    photos.filter(p => p.eventId === eventId);

  const updatePhotoStatus = (photoIds: string[], status: Photo['status']) => {
    setPhotos(prev =>
      prev.map(p => (photoIds.includes(p.id) ? { ...p, status } : p)),
    );
  };

  const deletePhotos = (photoIds: string[]) => {
    setPhotos(prev => prev.filter(p => !photoIds.includes(p.id)));
  };

  const restorePhotos = (photosToRestore: Photo[]) => {
    setPhotos(prev => {
      // Avoid duplicates just in case
      const newIds = new Set(photosToRestore.map(p => p.id));
      const filtered = prev.filter(p => !newIds.has(p.id));
      return [...filtered, ...photosToRestore];
    });
  };

  const setPhotoPrice = (photoIds: string[], price: number) => {
    // Mock impl
    console.log(`Set price to ${price} for`, photoIds);
  };

  const updatePhotoMetadata = (
    photoIds: string[],
    metadata: Partial<Photo>,
  ) => {
    setPhotos(prev =>
      prev.map(p => (photoIds.includes(p.id) ? { ...p, ...metadata } : p)),
    );
  };

  const republishPhoto = (photoId: string) => {
    setPhotos(prev => {
      const original = prev.find(p => p.id === photoId);
      if (!original) return prev;

      // Generate new ID for payment log reasons
      const newId = `${original.eventId}-p-repub-${Date.now()}`;

      const newPhoto: Photo = {
        ...original,
        id: newId,
        status: 'published',
        soldCount: 0, // Reset sales
        uploadDate: new Date().toISOString(),
      };

      // We usually keep the archived one or replace it?
      // "Re-publishing... generate new... payment log".
      // Usually we'd archive the old one or just treating this as a new entry.
      // If we replace, we lose history of the old ID.
      // I'll Append new one, and maybe keep old one as archived?
      // "Archive stores photos removed/unpublished".
      // If I republish, does it leave the archive?
      // Standard "Move" logic implies it leaves.
      // But if I create NEW ID, the old ID stays in Archive?
      // "Re-publishing... must generate new ID".
      // I'll assume: Keep old in Archive, Add new to Published.
      // Or Replace?
      // I'll Replace the old object but update ID. Effectively "Moving and Renaming".
      return prev.map(p => (p.id === photoId ? newPhoto : p));
    });
  };

  // --- Duplicates Logic ---
  const resolveDuplicate = (photoId: string, action: 'keep' | 'remove') => {
    if (action === 'remove') {
      const photoToRemove = photos.find(p => p.id === photoId);
      if (!photoToRemove) return;

      // Check if removing this leaves only 1 duplicate group member
      const potentialGroup = photos.filter(
        p => p.url === photoToRemove.url && p.isDuplicate && p.id !== photoId,
      );

      if (potentialGroup.length === 1) {
        // Only 1 left, so it's no longer a duplicate
        const survivor = potentialGroup[0];
        setPhotos(prev =>
          prev
            .filter(p => p.id !== photoId)
            .map(p =>
              p.id === survivor.id
                ? { ...p, isDuplicate: false, duplicateResolved: true }
                : p,
            ),
        );
      } else {
        // Remove this photo entirely from everywhere
        setPhotos(prev => prev.filter(p => p.id !== photoId));
      }
    } else if (action === 'keep') {
      // Mark this photo as resolved (kept) and remove other duplicates with same url
      const photo = photos.find(p => p.id === photoId);
      if (photo) {
        setPhotos(prev =>
          prev
            .map(p => {
              if (p.id === photoId) {
                // Mark as resolved
                return { ...p, duplicateResolved: true };
              }
              // Remove other duplicates that have the same url (simplified duplicate detection)
              if (p.url === photo.url && p.id !== photoId && p.isDuplicate) {
                return null; // Will be filtered out
              }
              return p;
            })
            .filter((p): p is Photo => p !== null),
        );
      }
    }
  };

  // --- Upload Logic ---

  const openUploadOverlay = (eventId: string) => {
    setCurrentUploadEventId(eventId);
    setIsUploadOverlayOpen(true);
  };

  const closeUploadOverlay = () => {
    setIsUploadOverlayOpen(false);
    // Do NOT clear session or currentUploadEventId immediately if we want persistence across toggles
    // But if user clicks X, usually they want to hide it.
    // Persistence requirement: "Upload overlay must be controlled by local UI state... and must not navigate away."
    // "Persist upload session state... if modal unmounts/remounts".
    // So we just toggle visibility. We keep currentUploadEventId?
    // If user navigates to another event, openUploadOverlay(newEvent) is called.
    // So keeping currentUploadEventId here is fine.
  };

  const clearUploadSession = (eventId: string) => {
    setUploadSessions(prev => {
      const next = { ...prev };
      delete next[eventId];
      return next;
    });
  };

  const removeUploadFile = (eventId: string, fileId: string) => {
    setUploadSessions(prev => {
      const session = prev[eventId];
      if (!session) return prev;

      const updatedFiles = session.files.filter(f => f.id !== fileId);

      // If no files left, maybe clear session or keep empty? Keeping empty allows drop zone to appear.
      // But if empty, UploadPage shows empty state which is good.

      return {
        ...prev,
        [eventId]: {
          ...session,
          files: updatedFiles,
          // If no files left, status could be 'completed' or reset?
          // Let's keep it as is, or set to 'uploading' if active?
          // Actually if empty, it doesn't matter much.
        },
      };
    });
  };

  const startUpload = (files: File[], metadata?: { classId?: string }) => {
    if (!currentUploadEventId) return;
    const eventId = currentUploadEventId;

    const newFiles: UploadFile[] = files.map(f => ({
      id: Math.random().toString(36).substr(2, 9),
      file: f,
      progress: 0,
      status: 'pending',
    }));

    setUploadSessions(prev => {
      const existing = prev[eventId];
      return {
        ...prev,
        [eventId]: {
          eventId,
          startTime: existing ? existing.startTime : Date.now(),
          status: 'uploading',
          files: existing ? [...existing.files, ...newFiles] : newFiles,
        },
      };
    });

    // Simulate upload process for each file
    newFiles.forEach(item => {
      simulateFileUpload(item.id, eventId, metadata);
    });
  };

  const simulateFileUpload = (
    fileId: string,
    eventId: string,
    metadata?: { classId?: string },
  ) => {
    let progress = 0;
    const interval = setInterval(() => {
      if (Math.random() > 0.95) {
        // Simulate occasional random failure?
        // For now keep stable.
      }
      progress += Math.floor(Math.random() * 20) + 10;

      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        handleFileComplete(fileId, eventId, metadata);
      } else {
        updateFileProgress(fileId, eventId, progress);
      }
    }, 800);
  };

  const updateFileProgress = (
    fileId: string,
    eventId: string,
    progress: number,
  ) => {
    setUploadSessions(prev => {
      const session = prev[eventId];
      if (!session) return prev; // Safety

      const updatedFiles = session.files.map(f =>
        f.id === fileId ? { ...f, progress, status: 'uploading' as const } : f,
      );

      return {
        ...prev,
        [eventId]: { ...session, files: updatedFiles },
      };
    });
  };

  const handleFileComplete = (
    fileId: string,
    eventId: string,
    metadata?: { classId?: string },
  ) => {
    setUploadSessions(prev => {
      const session = prev[eventId];
      if (!session) return prev;

      const updatedFiles = session.files.map(f =>
        f.id === fileId
          ? { ...f, progress: 100, status: 'completed' as const }
          : f,
      );

      // Check if batch complete
      const allComplete = updatedFiles.every(
        f => f.status === 'completed' || f.status === 'failed',
      );

      return {
        ...prev,
        [eventId]: {
          ...session,
          files: updatedFiles,
          status: allComplete ? 'completed' : 'uploading',
        },
      };
    });

    // Add to Mock Photos
    const newPhoto: Photo = {
      id: `new-${fileId}`,
      url: 'https://images.unsplash.com/photo-1599056377758-4808a7e70337?auto=format&fit=crop&q=80&w=600',
      eventId: eventId,
      status: 'uploadedUnpublished',
      soldCount: 0,
      rider: 'Processing...',
      horse: metadata?.classId ? `Class: ${metadata.classId}` : '', // Mock usage of classId
      timestamp: new Date().toLocaleTimeString().slice(0, 5),
      width: 400 + Math.floor(Math.random() * 200),
      height: 300 + Math.floor(Math.random() * 200),
    };
    setPhotos(prev => [newPhoto, ...prev]);
  };

  return (
    <PhotographerContext.Provider
      value={{
        photographerId,
        events,
        allPhotos: photos,
        getEvent,
        registerForEvent,
        getPhotosByEvent,
        updatePhotoStatus,
        deletePhotos,
        restorePhotos,
        setPhotoPrice,
        updatePhotoMetadata,
        republishPhoto,
        resolveDuplicate,
        // Upload controls
        isUploadOverlayOpen,
        currentUploadEventId,
        uploadSessions,
        openUploadOverlay,
        closeUploadOverlay,
        setCurrentUploadEventId,
        startUpload,
        clearUploadSession,
        removeUploadFile,
        // Highlights
        highlights,
        updateHighlights,
        availableToHire,
        toggleAvailableToHire,
      }}
    >
      {children}
    </PhotographerContext.Provider>
  );
};

export const usePhotographer = () => {
  const context = useContext(PhotographerContext);
  if (!context) {
    throw new Error(
      'usePhotographer must be used within a PhotographerProvider',
    );
  }
  return context;
};
