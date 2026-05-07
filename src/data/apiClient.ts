const RENDER_API_BASE_URL = 'https://gallopics-api.onrender.com';

export function getApiBaseUrl() {
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }

  return import.meta.env.DEV ? window.location.origin : RENDER_API_BASE_URL;
}

export function resolveApiAssetUrl(path: string | null | undefined) {
  if (!path) {
    return null;
  }

  if (/^(https?:|data:|blob:)/i.test(path)) {
    return path;
  }

  return new URL(path, getApiBaseUrl()).toString();
}

export interface ApiUser {
  id: string;
  clerk_user_id: string;
  email: string;
  role: 'user' | 'photographer' | 'admin';
  created_at: string;
  updated_at: string;
}

export interface ApiPhotographer {
  id: string;
  user_id: string;
  slug: string;
  display_name: string;
  city: string | null;
  country: string | null;
  avatar_url: string | null;
  phone: string | null;
  is_available_to_hire: boolean;
  status: 'pending' | 'approved' | 'suspended';
  created_at: string;
  updated_at: string;
}

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

export interface UpsertPhotographerProfile {
  slug?: string;
  display_name: string;
  city?: string | null;
  country?: string | null;
  avatar_url?: string | null;
  phone?: string | null;
  is_available_to_hire?: boolean;
}

type TokenGetter = () => Promise<string | null>;

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

async function request<T>(
  path: string,
  options: RequestInit = {},
  getToken?: TokenGetter
): Promise<T> {
  const headers = new Headers(options.headers);
  headers.set('Accept', 'application/json');

  if (
    options.body &&
    !(options.body instanceof FormData) &&
    !headers.has('Content-Type')
  ) {
    headers.set('Content-Type', 'application/json');
  }

  if (getToken) {
    const token = await getToken();
    if (!token) {
      throw new ApiError(401, 'No active Clerk session token was available.');
    }
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
  }

  const response = await fetch(new URL(path, getApiBaseUrl()), {
    ...options,
    headers,
  });

  if (!response.ok) {
    let message = `Request failed: ${response.status}`;
    try {
      const body = await response.json();
      message = body.detail || body.message || message;
    } catch {
      // Keep the status-based message for non-JSON errors.
    }
    throw new ApiError(response.status, message);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export const api = {
  getMe: (getToken: TokenGetter) =>
    request<ApiUser>('/api/v1/me', {}, getToken),
  getMyPhotographer: (getToken: TokenGetter) =>
    request<ApiPhotographer>('/api/v1/photographer/me', {}, getToken),
  upsertMyPhotographer: (
    getToken: TokenGetter,
    body: UpsertPhotographerProfile
  ) =>
    request<ApiPhotographer>(
      '/api/v1/photographer/me',
      { method: 'PUT', body: JSON.stringify(body) },
      getToken
    ),
  uploadMyAvatar: (getToken: TokenGetter, file: File) => {
    const formData = new FormData();
    formData.set('file', file);

    return request<ApiPhotographer>(
      '/api/v1/photographer/me/avatar',
      { method: 'POST', body: formData },
      getToken
    );
  },
  getPublicPhotographer: (slugOrId: string) =>
    request<ApiPhotographer>(
      `/api/v1/photographers/${encodeURIComponent(slugOrId)}`
    ),
  listMyEventBookings: (getToken: TokenGetter) =>
    request<ApiEvent[]>('/api/v1/photographer/bookings', {}, getToken),
  bookEvent: (getToken: TokenGetter, eventId: string) =>
    request<ApiEvent>(
      `/api/v1/photographer/bookings/${encodeURIComponent(eventId)}`,
      { method: 'POST' },
      getToken
    ),
  cancelEventBooking: (getToken: TokenGetter, eventId: string) =>
    request<void>(
      `/api/v1/photographer/bookings/${encodeURIComponent(eventId)}`,
      { method: 'DELETE' },
      getToken
    ),

  // Upload methods
  uploadPhotos: (getToken: TokenGetter, eventId: string, files: File[]) => {
    const formData = new FormData();
    formData.set('event_id', eventId);
    files.forEach(file => formData.append('files', file));
    return request<ApiPhoto[]>(
      '/api/v1/photographer/uploads',
      { method: 'POST', body: formData },
      getToken
    );
  },

  completeUpload: (getToken: TokenGetter, sessionId: string) =>
    request<ApiPhoto[]>(
      '/api/v1/photographer/uploads/complete',
      {
        method: 'POST',
        body: JSON.stringify({ session_id: sessionId }),
      },
      getToken
    ),

  listMyPhotos: (
    getToken: TokenGetter,
    eventId?: string,
    visibility?: string
  ) => {
    const params = new URLSearchParams();
    if (eventId) params.set('event_id', eventId);
    if (visibility) params.set('visibility', visibility);
    return request<PaginatedResponse<ApiPhoto>>(
      `/api/v1/photographer/photos?${params.toString()}`,
      {},
      getToken
    );
  },

  updatePhoto: (
    getToken: TokenGetter,
    photoId: string,
    data: {
      visibility?: string;
      price?: number;
      tags?: Array<{ type: string; value: string }>;
    }
  ) =>
    request<ApiPhoto>(
      `/api/v1/photographer/photos/${encodeURIComponent(photoId)}`,
      { method: 'PATCH', body: JSON.stringify(data) },
      getToken
    ),

  deletePhoto: (getToken: TokenGetter, photoId: string) =>
    request<void>(
      `/api/v1/photographer/photos/${encodeURIComponent(photoId)}`,
      { method: 'DELETE' },
      getToken
    ),

  getEventGallery: (eventId: string, page?: number, pageSize?: number) => {
    const params = new URLSearchParams();
    if (page) params.set('page', String(page));
    if (pageSize) params.set('page_size', String(pageSize));
    return request<PaginatedResponse<ApiPhoto>>(
      `/api/v1/events/${eventId}/gallery?${params.toString()}`
    );
  },

  searchGallery: (eventId: string, q: string, tagType?: string) =>
    request<ApiPhoto[]>(
      `/api/v1/events/${eventId}/gallery/search?q=${encodeURIComponent(q)}${
        tagType ? `&tag_type=${tagType}` : ''
      }`
    ),
};

// --- Additional Types for Upload/Gallery ---

export interface ApiPhoto {
  id: string;
  event_id: string;
  photographer_id: string;
  price: number;
  currency: string;
  status: 'processing' | 'ready' | 'failed';
  visibility: 'draft' | 'published';
  tags: Array<{ type: string; value: string }>;
  storage_key_original?: string | null;
  storage_key_thumbnail?: string | null;
  storage_key_preview?: string | null;
  created_at: string;
  updated_at: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
}
