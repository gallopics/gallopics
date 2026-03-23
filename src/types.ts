export interface Photo {
  id: string;
  src: string;
  rider: string;
  horse: string;
  event: string;
  eventId: string;
  date: string;
  width: number;
  height: number;
  // New fields for Event Patch
  className: string;
  time: string;
  city: string;
  arena: string;
  countryCode: string;
  photographer?: string;
  photographerId?: string;
  isDuplicate?: boolean;
  duplicateGroupId?: string;
}

export interface FilterState {
  event?: string;
  rider?: string;
  horse?: string;
}

// --- Event Detail API Structure ---

export interface Country {
  name: string;
  code: string;
}

export interface Period {
  startDate: string;
  endDate: string;
}

export interface Meeting {
  id: string;
  name: string;
  country: Country;
  city: string;
  venueName: string;
  clubName: string;
  period: Period;
  disciplines: string[];
  timezone: string;
  photoCount: number;
  coverImage: string;
  logo: string;
  photographer?: {
    id: string;
    name: string;
    avatar: string;
  };
}

export interface ClassSection {
  classSectionId: string;
  name: string;
  startTime: string;
  position: number;
  discipline: string;
  entriesCount: number;
}

export interface Arena {
  id: string;
  name: string;
  position: number;
  competitions: ClassSection[]; // mapped from "competitions" in JSON spec
}

export interface DailySchedule {
  date: string;
  arenas: Arena[];
}

export interface EventDetail {
  meetingId: string;
  meeting: Meeting;
  schedule: DailySchedule[];
}

export interface CartItem {
  cartId: string;
  photoId: string;
  photo: Photo;
  quality: string;
  qualityLabel: string;
  price: number;
}
