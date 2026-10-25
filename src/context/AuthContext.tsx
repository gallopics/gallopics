import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
} from "react"
import { useClerk, useAuth as useClerkAuth, useUser } from "@clerk/clerk-react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import {
  api,
  resolveApiAssetUrl,
  type ApiPhotographer,
  type ApiUser,
  type UpsertPhotographerProfile,
} from "../data/apiClient"
import {
  accountKeys,
  meQueryOptions,
  photographerProfileQueryOptions,
} from "../data/queries/account"
import { photographerKeys } from "../data/queries/photographer"

export interface UserProfile {
  id?: string
  displayName: string
  city: string
  country?: string
  avatarUrl?: string | null
  phone?: string | null
  hasCompletedOnboarding?: boolean
  role?: "pg" | "admin"
  /** From our API; "suspended" = rejected by an admin (no studio access, like pending) */
  approvalStatus?: "pending" | "approved" | "suspended"
}

interface AuthContextType {
  isLoaded: boolean
  isAuthenticated: boolean
  user: UserProfile | null
  /** API role "photographer": may load the studio's own data (bookings, photos...) */
  isPhotographer: boolean
  /** Signed in, not an admin, and our API says there is no photographer profile yet */
  needsOnboarding: boolean
  logout: () => Promise<void>
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>
  uploadAvatar: (file: File) => Promise<string>
}

type AuthMetadata = {
  avatarUrl?: string | null
  city?: string
  country?: string
  hasCompletedOnboarding?: boolean
  role?: "pg" | "admin"
  approvalStatus?: "pending" | "approved"
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const normalizeTextValue = (value: unknown) =>
  typeof value === "string" ? value.trim().toLowerCase() : undefined

const normalizeRole = (value: unknown): AuthMetadata["role"] => {
  const normalized = normalizeTextValue(value)

  if (normalized === "admin") {
    return "admin"
  }

  if (normalized === "pg" || normalized === "photographer") {
    return "pg"
  }

  return undefined
}

const normalizeApprovalStatus = (
  value: unknown
): AuthMetadata["approvalStatus"] => {
  const normalized = normalizeTextValue(value)

  if (normalized === "approved") {
    return "approved"
  }

  if (normalized === "pending") {
    return "pending"
  }

  return undefined
}

export const PROTOTYPE_USER = {
  id: "klara-fors",
  displayName: "Klara Fors",
  country: "Sweden",
  city: "Stockholm",
  avatarUrl: "",
  role: "pg" as const,
}

const slugify = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")

const normalizeIdentifier = (value: string) => {
  const trimmed = value.trim()
  const localPart = trimmed.includes("@") ? trimmed.split("@")[0] : trimmed
  return slugify(localPart)
}

const readMetadataObject = (metadata: unknown): AuthMetadata => {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
    return {}
  }

  const raw = metadata as Record<string, unknown>

  return {
    avatarUrl:
      typeof raw.avatarUrl === "string" || raw.avatarUrl === null
        ? raw.avatarUrl
        : undefined,
    city: typeof raw.city === "string" ? raw.city : undefined,
    country: typeof raw.country === "string" ? raw.country : undefined,
    hasCompletedOnboarding:
      typeof raw.hasCompletedOnboarding === "boolean"
        ? raw.hasCompletedOnboarding
        : undefined,
    role: normalizeRole(raw.role),
    approvalStatus: normalizeApprovalStatus(raw.approvalStatus),
  }
}

const readMetadata = (
  publicMetadata: unknown,
  unsafeMetadata: unknown
): AuthMetadata => {
  const unsafe = readMetadataObject(unsafeMetadata)
  const publicData = readMetadataObject(publicMetadata)

  return {
    ...publicData,
    ...unsafe,
    role:
      publicData.role === "admin" || unsafe.role === "admin"
        ? "admin"
        : (unsafe.role ?? publicData.role),
    approvalStatus:
      publicData.approvalStatus === "approved" ||
      unsafe.approvalStatus === "approved"
        ? "approved"
        : (unsafe.approvalStatus ?? publicData.approvalStatus),
  }
}

const splitDisplayName = (displayName: string) => {
  const parts = displayName.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) {
    return { firstName: "", lastName: "" }
  }

  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(" "),
  }
}

const resolveDisplayName = (values: Array<string | null | undefined>) =>
  values
    .find((value) => typeof value === "string" && value.trim().length > 0)
    ?.trim() ?? "Photographer"

// Role and approval come only from our API (our database, set by admins). Clerk metadata
// is not trusted for access: users can edit their own unsafeMetadata.
const mapRole = (apiUser: ApiUser | null): UserProfile["role"] =>
  apiUser?.role === "admin" ? "admin" : "pg"

const mapApprovalStatus = (
  photographer: ApiPhotographer | null
): UserProfile["approvalStatus"] =>
  photographer?.status === "approved" || photographer?.status === "suspended"
    ? photographer.status
    : "pending"

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const clerk = useClerk()
  const {
    isLoaded: isClerkLoaded,
    isSignedIn,
    userId: clerkUserId,
  } = useClerkAuth()
  const { user: clerkUser } = useUser()
  const queryClient = useQueryClient()

  const metadata = useMemo(
    () => readMetadata(clerkUser?.publicMetadata, clerkUser?.unsafeMetadata),
    [clerkUser?.publicMetadata, clerkUser?.unsafeMetadata]
  )

  const meQuery = useQuery({
    ...meQueryOptions(),
    enabled: isClerkLoaded && !!isSignedIn && !!clerkUser,
  })
  // Only this Clerk user's answer: right after an account switch the cache can
  // still hold the previous user's until the reset below has run
  const apiUser: ApiUser | null =
    clerkUser && meQuery.data?.clerk_user_id === clerkUser.id
      ? meQuery.data
      : null
  // After /me: the first request creates the user row, so they must not race
  const photographerQuery = useQuery({
    ...photographerProfileQueryOptions(),
    enabled: !!apiUser,
  })
  const apiPhotographer: ApiPhotographer | null =
    (apiUser && photographerQuery.data) || null
  const isProfileLoaded =
    !clerkUser ||
    // By data, not status: a failed background refetch keeps the last answer
    (apiUser ? !photographerQuery.isPending : meQuery.isError)

  useEffect(() => {
    if (meQuery.error || photographerQuery.error) {
      console.error(
        "Failed to load Gallopics API profile",
        meQuery.error || photographerQuery.error
      )
    }
  }, [meQuery.error, photographerQuery.error])

  // Sign-out or account switch: drop all cached data (the next user must not
  // see the last one's); what is on screen is refetched
  const lastClerkUserId = useRef(clerkUserId)
  useEffect(() => {
    if (lastClerkUserId.current && lastClerkUserId.current !== clerkUserId) {
      void queryClient.resetQueries()
    }
    lastClerkUserId.current = clerkUserId
  }, [clerkUserId, queryClient])

  const saveProfile = useMutation({
    mutationFn: (body: UpsertPhotographerProfile) =>
      api.upsertMyPhotographer(body),
    onSuccess: (profile) => {
      queryClient.setQueryData<ApiPhotographer | null>(
        photographerKeys.profile(),
        profile
      )
      // Creating a profile makes the user a photographer
      queryClient.setQueryData<ApiUser>(accountKeys.me, (current) =>
        current ? { ...current, role: "photographer" as const } : current
      )
    },
  })

  const saveAvatar = useMutation({
    mutationFn: (file: File) => api.uploadMyAvatar(file),
    onSuccess: (profile) => {
      queryClient.setQueryData<ApiPhotographer | null>(
        photographerKeys.profile(),
        profile
      )
    },
  })

  const user: UserProfile | null = useMemo(() => {
    if (!clerkUser) {
      return null
    }

    const displayName = resolveDisplayName([
      apiPhotographer?.display_name,
      [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" "),
      clerkUser.fullName,
      clerkUser.username,
      clerkUser.primaryEmailAddress?.emailAddress?.split("@")[0],
    ])
    const fallbackSlug = normalizeIdentifier(
      clerkUser.username ||
        clerkUser.primaryEmailAddress?.emailAddress ||
        displayName
    )

    return {
      id: apiPhotographer?.slug || fallbackSlug,
      displayName,
      city: apiPhotographer?.city || metadata.city || "",
      country: apiPhotographer?.country || metadata.country || undefined,
      avatarUrl:
        resolveApiAssetUrl(apiPhotographer?.avatar_url) ??
        resolveApiAssetUrl(metadata.avatarUrl) ??
        clerkUser.imageUrl ??
        null,
      phone: apiPhotographer?.phone ?? null,
      hasCompletedOnboarding:
        metadata.hasCompletedOnboarding ?? Boolean(apiPhotographer),
      role: mapRole(apiUser),
      approvalStatus: mapApprovalStatus(apiPhotographer),
    }
  }, [apiPhotographer, apiUser, clerkUser, metadata])

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!clerkUser) {
      return
    }

    const nextDisplayName =
      updates.displayName ?? user?.displayName ?? "Photographer"
    const { firstName, lastName } = splitDisplayName(nextDisplayName)
    await saveProfile.mutateAsync({
      slug: updates.id ?? user?.id,
      display_name: nextDisplayName,
      city: updates.city ?? user?.city ?? null,
      country: updates.country ?? user?.country ?? null,
      avatar_url:
        updates.avatarUrl === undefined
          ? (user?.avatarUrl ?? null)
          : updates.avatarUrl,
      phone:
        updates.phone === undefined ? (user?.phone ?? null) : updates.phone,
      is_available_to_hire: true,
    })

    await clerkUser.update({
      firstName: firstName || null,
      lastName: lastName || null,
      unsafeMetadata: {
        ...metadata,
        avatarUrl:
          updates.avatarUrl === undefined
            ? metadata.avatarUrl
            : updates.avatarUrl,
        city: updates.city ?? metadata.city,
        country: updates.country ?? metadata.country,
        hasCompletedOnboarding:
          updates.hasCompletedOnboarding ??
          metadata.hasCompletedOnboarding ??
          false,
        role: updates.role ?? metadata.role ?? "pg",
        approvalStatus:
          updates.approvalStatus ?? metadata.approvalStatus ?? "pending",
      },
    })
  }

  const uploadAvatar = async (file: File) => {
    const nextProfile = await saveAvatar.mutateAsync(file)
    return nextProfile.avatar_url ?? ""
  }

  const logout = async () => {
    await clerk.signOut()
  }

  return (
    <AuthContext.Provider
      value={{
        isLoaded: isClerkLoaded && isProfileLoaded,
        isAuthenticated: isClerkLoaded && !!isSignedIn,
        user,
        isPhotographer: !!clerkUser && apiUser?.role === "photographer",
        // null = the API answered "no profile" (a failed request is not that)
        needsOnboarding:
          !!apiUser &&
          apiUser.role !== "admin" &&
          photographerQuery.data === null,
        logout,
        updateProfile,
        uploadAvatar,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
