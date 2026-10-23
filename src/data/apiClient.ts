const SERVER_API_BASE_URL = "http://82.96.43.103:8081"

export function getApiBaseUrl() {
  const configuredBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim()

  if (import.meta.env.DEV) {
    if (!configuredBaseUrl || configuredBaseUrl === SERVER_API_BASE_URL) {
      return window.location.origin
    }

    return configuredBaseUrl
  }

  if (configuredBaseUrl) {
    return configuredBaseUrl
  }

  return SERVER_API_BASE_URL
}

export function resolveApiAssetUrl(path: string | null | undefined) {
  if (!path) {
    return null
  }

  if (/^(https?:|data:|blob:)/i.test(path)) {
    return path
  }

  return new URL(path, getApiBaseUrl()).toString()
}

function resolveApiDownloadUrl(url: string) {
  const downloadUrl = new URL(url, getApiBaseUrl())

  if (
    /^\/api\/v1\/photos\/[^/]+\/download$/i.test(downloadUrl.pathname) &&
    downloadUrl.searchParams.has("order_id")
  ) {
    const apiBaseUrl = new URL(getApiBaseUrl())
    return new URL(
      `${downloadUrl.pathname}${downloadUrl.search}`,
      apiBaseUrl
    ).toString()
  }

  return downloadUrl.toString()
}

export interface ApiUser {
  id: string
  clerk_user_id: string
  email: string
  role: "user" | "photographer" | "admin"
  created_at: string
  updated_at: string
}

export interface ApiPhotographer {
  id: string
  user_id: string
  slug: string
  display_name: string
  city: string | null
  country: string | null
  avatar_url: string | null
  phone: string | null
  is_available_to_hire: boolean
  highlights: string[]
  status: "pending" | "approved" | "suspended"
  created_at: string
  updated_at: string
}

export interface ApiEvent {
  id: string
  tdb_id?: string | null
  equipe_id?: string | null
  name: string
  slug: string
  discipline?: string | null
  horse_type?: string | null
  organizer_name?: string | null
  district?: string | null
  venue_name?: string | null
  city?: string | null
  country: string
  start_date: string
  end_date?: string | null
  status: "upcoming" | "ongoing" | "completed" | "cancelled"
  is_sustainable: boolean
  match_status: "unmatched" | "matched" | "manual" | "rejected"
  match_score?: number | null
  created_at: string
  updated_at: string
}

export interface UpsertPhotographerProfile {
  slug?: string
  display_name: string
  city?: string | null
  country?: string | null
  avatar_url?: string | null
  phone?: string | null
  is_available_to_hire?: boolean
}

/** A photo to buy; the server looks up its price */
export interface CheckoutItem {
  photo_id: string
  quality: string
}

export interface CheckoutSession {
  order_id: string
  session_id: string
  /** Stripe's hosted payment page */
  checkout_url: string
}

export type OrderStatus =
  "pending" | "authorized" | "captured" | "refunded" | "cancelled"

export interface CheckoutOrder {
  order_id: string
  status: OrderStatus
  paid: boolean
  customer_email: string | null
  /** In öre */
  amount: number
  currency: string
  items: Array<{
    photo_id: string
    quality: string
    name: string
    /** In öre */
    amount: number
    thumbnail_url: string | null
  }>
}

/** A photographer's Stripe account, which receives their earnings */
export interface StripeConnectStatus {
  status: "not_connected" | "action_needed" | "pending" | "active"
  details_submitted: boolean
  transfers_enabled: boolean
  payouts_enabled: boolean
  payout_day_of_month: number
}

/** "suspended" is how the API stores a rejected sign-up (shown as "Rejected") */
export type PhotographerApprovalStatus = "pending" | "approved" | "suspended"

/** A photographer as admins see it */
export interface AdminPhotographer {
  id: string
  user_id: string
  display_name: string
  slug: string
  email: string
  city: string | null
  country: string | null
  avatar_url: string | null
  status: PhotographerApprovalStatus
  stripe_status: StripeConnectStatus["status"]
  photo_count: number
  created_at: string
}

/** One sold photo (amounts in öre) */
export interface SaleItem {
  id: string
  photo_id: string
  event_id: string
  event_name: string
  class_name: string | null
  quality: string
  amount: number
  photographer_amount: number
  currency: string
  sold_at: string
  refunded: boolean
  /** owed | transferred | reversed | cancelled | failed; null = sold before payouts existed */
  payout_status: string | null
}

export interface SalesResponse {
  items: SaleItem[]
  /** Refunded sales are left out of the totals */
  totals: {
    count: number
    amount: number
    photographer_amount: number
    transferred: number
    owed: number
  }
  commission_percent: number
  payout_day_of_month: number
}

export interface PhotoDownloadResponse {
  url: string
  expires_in: number
}

export interface UploadPhotoMetadata {
  classId?: string
  eventClassId?: string
  classSectionId?: string
  equipeClassSectionId?: string
  className?: string
  takenAt?: string
}

type ClerkGlobal = {
  session?: {
    getToken: (options?: { skipCache?: boolean }) => Promise<string | null>
  } | null
}

const wait = (ms: number) =>
  new Promise((resolve) => {
    window.setTimeout(resolve, ms)
  })

/**
 * The signed-in user's Clerk session token. Outside React components Clerk's
 * docs use the global `Clerk` object (clerk-js, loaded by ClerkProvider); it
 * caches the token and renews it in the background. Right after sign-in it can
 * take a moment, so this asks again a few times. `skipCache` forces a new one.
 */
export async function getSessionToken({ skipCache = false } = {}) {
  for (let attempt = 0; attempt < 6; attempt += 1) {
    const clerk = (window as { Clerk?: ClerkGlobal }).Clerk
    const token = await clerk?.session?.getToken({
      skipCache: skipCache || attempt > 0,
    })
    if (token) return token
    await wait(250)
  }
  return null
}

const isUuid = (value: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  )

type ApiRequestInit = RequestInit & {
  timeoutMs?: number
  retryNetworkErrors?: number
  /** Send the signed-in user's session token */
  auth?: boolean
}

export class ApiError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = "ApiError"
    this.status = status
  }
}

async function request<T>(
  path: string,
  options: ApiRequestInit = {}
): Promise<T> {
  const {
    timeoutMs = 30000,
    retryNetworkErrors = 0,
    auth = false,
    ...fetchOptions
  } = options
  const headers = new Headers(options.headers)
  headers.set("Accept", "application/json")

  if (
    options.body &&
    !(options.body instanceof FormData) &&
    !headers.has("Content-Type")
  ) {
    headers.set("Content-Type", "application/json")
  }

  if (auth) {
    const token = await getSessionToken()
    if (!token) {
      throw new ApiError(401, "No active Clerk session token was available.")
    }
    headers.set("Authorization", `Bearer ${token}`)
  }

  const url = new URL(path, getApiBaseUrl())
  let lastNetworkError: unknown
  for (let attempt = 0; attempt <= retryNetworkErrors; attempt += 1) {
    const controller = new AbortController()
    const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs)

    try {
      const response = await fetch(url, {
        ...fetchOptions,
        headers,
        signal: controller.signal,
      })

      if (!response.ok) {
        let message = `Request failed: ${response.status}`
        try {
          const body = await response.json()
          message = body.detail || body.message || message
        } catch {
          // Keep the status-based message for non-JSON errors.
        }
        throw new ApiError(response.status, message)
      }

      if (response.status === 204) {
        return undefined as T
      }

      return (await response.json()) as T
    } catch (error) {
      if (error instanceof ApiError) {
        throw error
      }

      lastNetworkError = error
      if (attempt === retryNetworkErrors) {
        break
      }
    } finally {
      window.clearTimeout(timeoutId)
    }
  }

  if (
    lastNetworkError instanceof DOMException &&
    lastNetworkError.name === "AbortError"
  ) {
    throw new Error(`The API took too long to respond: ${url.toString()}`)
  }

  throw new Error(`Could not reach the API: ${url.toString()}`)
}

export const api = {
  getMe: () => request<ApiUser>("/api/v1/me", { auth: true }),
  getMyPhotographer: () =>
    request<ApiPhotographer>("/api/v1/photographer/me", { auth: true }),
  upsertMyPhotographer: (body: UpsertPhotographerProfile) =>
    request<ApiPhotographer>("/api/v1/photographer/me", {
      method: "PUT",
      body: JSON.stringify(body),
      auth: true,
    }),
  uploadMyAvatar: (file: File) => {
    const formData = new FormData()
    formData.set("file", file)

    return request<ApiPhotographer>("/api/v1/photographer/me/avatar", {
      method: "POST",
      body: formData,
      auth: true,
    })
  },
  getPublicPhotographer: (slugOrId: string) =>
    request<ApiPhotographer>(
      `/api/v1/photographers/${encodeURIComponent(slugOrId)}`
    ),
  getMyHighlights: () =>
    request<{ highlights: string[] }>("/api/v1/photographer/highlights", {
      auth: true,
    }),
  updateMyHighlights: (photoIds: string[]) =>
    request<{ highlights: string[] }>("/api/v1/photographer/highlights", {
      method: "PUT",
      body: JSON.stringify({ photo_ids: photoIds }),
      auth: true,
    }),
  listMyEventBookings: () =>
    request<ApiEvent[]>("/api/v1/photographer/bookings", { auth: true }),
  bookEvent: (eventId: string) =>
    request<ApiEvent>(
      `/api/v1/photographer/bookings/${encodeURIComponent(eventId)}`,
      { method: "POST", auth: true }
    ),
  cancelEventBooking: (eventId: string) =>
    request<void>(
      `/api/v1/photographer/bookings/${encodeURIComponent(eventId)}`,
      { method: "DELETE", auth: true }
    ),

  // Upload methods
  uploadPhotos: (
    eventId: string,
    files: File[],
    metadata?: UploadPhotoMetadata
  ) => {
    const formData = new FormData()
    const classId = metadata?.classId
    const classIdIsInternal = classId ? isUuid(classId) : false
    const classSectionId =
      metadata?.classSectionId || (classIdIsInternal ? classId : undefined)
    const equipeClassSectionId = metadata?.equipeClassSectionId
    const eventClassId =
      metadata?.eventClassId || (!classIdIsInternal ? classId : undefined)

    formData.set("event_id", eventId)
    if (classSectionId) {
      formData.set("class_section_id", classSectionId)
    }
    if (equipeClassSectionId) {
      formData.set("equipe_class_section_id", equipeClassSectionId)
    }
    if (eventClassId) {
      formData.set("event_class_id", eventClassId)
    }
    if (metadata?.className) {
      formData.set("class_name", metadata.className)
    }
    if (metadata?.takenAt) {
      formData.set("taken_at", metadata.takenAt)
    }
    files.forEach((file) => formData.append("files", file))
    return request<ApiPhoto[]>("/api/v1/photographer/uploads", {
      method: "POST",
      body: formData,
      auth: true,
    })
  },

  completeUpload: (sessionId: string) =>
    request<ApiPhoto[]>("/api/v1/photographer/uploads/complete", {
      method: "POST",
      body: JSON.stringify({ session_id: sessionId }),
      auth: true,
    }),

  listMyPhotos: (eventId?: string, visibility?: string, classId?: string) => {
    const params = new URLSearchParams()
    if (eventId) params.set("event_id", eventId)
    if (visibility) params.set("visibility", visibility)
    if (classId) params.set("class_id", classId)
    return request<PaginatedResponse<ApiPhoto>>(
      `/api/v1/photographer/photos?${params.toString()}`,
      { auth: true }
    )
  },

  /** One page of the signed-in photographer's photos */
  getMyPhotosPage: (page: number, pageSize: number) =>
    request<PaginatedResponse<ApiPhoto>>(
      `/api/v1/photographer/photos?page=${page}&page_size=${pageSize}`,
      { auth: true }
    ),

  updatePhoto: (
    photoId: string,
    data: {
      visibility?: string
      price?: number
      tags?: Array<{ type: string; value: string }>
    }
  ) =>
    request<ApiPhoto>(
      `/api/v1/photographer/photos/${encodeURIComponent(photoId)}`,
      { method: "PATCH", body: JSON.stringify(data), auth: true }
    ),

  deletePhoto: (photoId: string) =>
    request<void>(
      `/api/v1/photographer/photos/${encodeURIComponent(photoId)}`,
      { method: "DELETE", auth: true }
    ),

  getEventGallery: (
    eventId: string,
    page?: number,
    pageSize?: number,
    classId?: string
  ) => {
    const params = new URLSearchParams()
    if (page) params.set("page", String(page))
    if (pageSize) params.set("page_size", String(pageSize))
    if (classId) params.set("class_id", classId)
    return request<PaginatedResponse<ApiPhoto>>(
      `/api/v1/events/${eventId}/gallery?${params.toString()}`
    )
  },

  searchGallery: (
    eventId: string,
    q: string,
    tagType?: string,
    classId?: string
  ) => {
    const params = new URLSearchParams({ q })
    if (tagType) params.set("tag_type", tagType)
    if (classId) params.set("class_id", classId)
    return request<ApiPhoto[]>(
      `/api/v1/events/${eventId}/gallery/search?${params.toString()}`
    )
  },

  getPhoto: (photoId: string) =>
    request<ApiPhoto>(`/api/v1/photos/${encodeURIComponent(photoId)}`),

  createCheckoutSession: (
    items: CheckoutItem[],
    customerEmail: string,
    cancelPath?: string
  ) =>
    request<CheckoutSession>("/api/v1/checkout/sessions", {
      method: "POST",
      body: JSON.stringify({
        items,
        customer_email: customerEmail,
        cancel_path: cancelPath,
      }),
    }),

  /** Admin: all photographers, newest first */
  getAdminPhotographers: () =>
    request<AdminPhotographer[]>("/api/v1/admin/photographers", { auth: true }),

  /** Admin: approve, reject ("suspended"), or set a photographer back to pending */
  setPhotographerStatus: (
    photographerId: string,
    status: PhotographerApprovalStatus
  ) =>
    request<AdminPhotographer>(
      `/api/v1/admin/photographers/${encodeURIComponent(photographerId)}`,
      { method: "PATCH", body: JSON.stringify({ status }), auth: true }
    ),

  /** The signed-in photographer's sales, newest first */
  getMySales: () =>
    request<SalesResponse>("/api/v1/photographer/sales", { auth: true }),

  /** `refresh` re-reads the account from Stripe instead of the saved status */
  getStripeConnectStatus: (refresh = false) =>
    request<StripeConnectStatus>(
      `/api/v1/photographer/stripe${refresh ? "?refresh=true" : ""}`,
      { auth: true }
    ),

  /** One-time link to Stripe's onboarding form */
  createStripeOnboardingLink: (email?: string) =>
    request<{ url: string }>(
      "/api/v1/photographer/stripe/onboarding-link",
      // The signed-in email, used if the account has none on file
      { method: "POST", body: JSON.stringify({ email }), auth: true }
    ),

  /** One-time login link to the photographer's Stripe Express dashboard */
  createStripeDashboardLink: () =>
    request<{ url: string }>("/api/v1/photographer/stripe/dashboard-link", {
      method: "POST",
      auth: true,
    }),

  /** The order behind a Stripe Checkout Session (for the success page) */
  getCheckoutOrder: (sessionId: string) =>
    request<CheckoutOrder>(
      `/api/v1/checkout/sessions/${encodeURIComponent(sessionId)}`
    ),

  createPhotoDownload: async (photoId: string, orderId: string) => {
    const download = await request<PhotoDownloadResponse>(
      `/api/v1/photos/${encodeURIComponent(photoId)}/download`,
      {
        method: "POST",
        body: JSON.stringify({ order_id: orderId }),
        retryNetworkErrors: 1,
      }
    )

    return {
      ...download,
      url: resolveApiDownloadUrl(download.url),
    }
  },
}

// --- Additional Types for Upload/Gallery ---

export interface ApiPhoto {
  id: string
  event_id: string
  photographer_id: string
  photographer_display_name?: string | null
  photographer_avatar_url?: string | null
  price: number
  currency: string
  status: "processing" | "ready" | "failed"
  visibility: "draft" | "published"
  tags: Array<{ type: string; value: string }>
  class_id?: string | null
  class_section_id?: string | null
  event_class_id?: string | null
  equipe_class_section_id?: string | null
  class_name?: string | null
  event_class_name?: string | null
  taken_at?: string | null
  equipe_start_id?: string | null
  equipe_rider_id?: string | null
  equipe_horse_id?: string | null
  matched_at?: string | null
  match_confidence?: "high" | "medium" | "low" | "none" | string | null
  match_delta_seconds?: number | null
  match_source?: string | null
  storage_key_original?: string | null
  storage_key_thumbnail?: string | null
  storage_key_preview?: string | null
  created_at: string
  updated_at: string
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  page_size: number
}
