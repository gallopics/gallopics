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
  getToken?: TokenGetter,
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
  getMe: (getToken: TokenGetter) => request<ApiUser>('/api/v1/me', {}, getToken),
  getMyPhotographer: (getToken: TokenGetter) =>
    request<ApiPhotographer>('/api/v1/photographer/me', {}, getToken),
  upsertMyPhotographer: (
    getToken: TokenGetter,
    body: UpsertPhotographerProfile,
  ) =>
    request<ApiPhotographer>(
      '/api/v1/photographer/me',
      { method: 'PUT', body: JSON.stringify(body) },
      getToken,
    ),
  uploadMyAvatar: (getToken: TokenGetter, file: File) => {
    const formData = new FormData();
    formData.set('file', file);

    return request<ApiPhotographer>(
      '/api/v1/photographer/me/avatar',
      { method: 'POST', body: formData },
      getToken,
    );
  },
  getPublicPhotographer: (slugOrId: string) =>
    request<ApiPhotographer>(
      `/api/v1/photographers/${encodeURIComponent(slugOrId)}`,
    ),
  listMyEventBookings: (getToken: TokenGetter) =>
    request<ApiEvent[]>('/api/v1/photographer/bookings', {}, getToken),
  bookEvent: (getToken: TokenGetter, eventId: string) =>
    request<ApiEvent>(
      `/api/v1/photographer/bookings/${encodeURIComponent(eventId)}`,
      { method: 'POST' },
      getToken,
    ),
  cancelEventBooking: (getToken: TokenGetter, eventId: string) =>
    request<void>(
      `/api/v1/photographer/bookings/${encodeURIComponent(eventId)}`,
      { method: 'DELETE' },
      getToken,
    ),
};
