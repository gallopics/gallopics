import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  useAuth as useClerkAuth,
  useClerk,
  useUser,
} from '@clerk/clerk-react';
import { assetUrl } from '../lib/utils';
import {
  api,
  ApiError,
  resolveApiAssetUrl,
  type ApiPhotographer,
  type ApiUser,
} from '../data/apiClient';

export interface UserProfile {
  id?: string;
  displayName: string;
  city: string;
  country?: string;
  avatarUrl?: string | null;
  phone?: string | null;
  hasCompletedOnboarding?: boolean;
  role?: 'pg' | 'admin';
  approvalStatus?: 'pending' | 'approved';
}

interface AuthContextType {
  isLoaded: boolean;
  isAuthenticated: boolean;
  user: UserProfile | null;
  logout: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  uploadAvatar: (file: File) => Promise<string>;
}

type AuthMetadata = {
  avatarUrl?: string | null;
  city?: string;
  country?: string;
  hasCompletedOnboarding?: boolean;
  role?: 'pg' | 'admin';
  approvalStatus?: 'pending' | 'approved';
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const normalizeTextValue = (value: unknown) =>
  typeof value === 'string' ? value.trim().toLowerCase() : undefined;

const normalizeRole = (value: unknown): AuthMetadata['role'] => {
  const normalized = normalizeTextValue(value);

  if (normalized === 'admin') {
    return 'admin';
  }

  if (normalized === 'pg' || normalized === 'photographer') {
    return 'pg';
  }

  return undefined;
};

const normalizeApprovalStatus = (
  value: unknown,
): AuthMetadata['approvalStatus'] => {
  const normalized = normalizeTextValue(value);

  if (normalized === 'approved') {
    return 'approved';
  }

  if (normalized === 'pending') {
    return 'pending';
  }

  return undefined;
};

export const PROTOTYPE_USER = {
  id: 'klara-fors',
  displayName: 'Klara Fors',
  country: 'Sweden',
  city: 'Stockholm',
  avatarUrl: assetUrl('images/Klara Fors.jpg'),
  role: 'pg' as const,
};

const slugify = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const normalizeIdentifier = (value: string) => {
  const trimmed = value.trim();
  const localPart = trimmed.includes('@') ? trimmed.split('@')[0] : trimmed;
  return slugify(localPart);
};

const readMetadataObject = (metadata: unknown): AuthMetadata => {
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) {
    return {};
  }

  const raw = metadata as Record<string, unknown>;

  return {
    avatarUrl:
      typeof raw.avatarUrl === 'string' || raw.avatarUrl === null
        ? raw.avatarUrl
        : undefined,
    city: typeof raw.city === 'string' ? raw.city : undefined,
    country: typeof raw.country === 'string' ? raw.country : undefined,
    hasCompletedOnboarding:
      typeof raw.hasCompletedOnboarding === 'boolean'
        ? raw.hasCompletedOnboarding
        : undefined,
    role: normalizeRole(raw.role),
    approvalStatus: normalizeApprovalStatus(raw.approvalStatus),
  };
};

const readMetadata = (
  publicMetadata: unknown,
  unsafeMetadata: unknown,
): AuthMetadata => {
  const unsafe = readMetadataObject(unsafeMetadata);
  const publicData = readMetadataObject(publicMetadata);

  return {
    ...publicData,
    ...unsafe,
    role:
      publicData.role === 'admin' || unsafe.role === 'admin'
        ? 'admin'
        : unsafe.role ?? publicData.role,
    approvalStatus:
      publicData.approvalStatus === 'approved' ||
      unsafe.approvalStatus === 'approved'
        ? 'approved'
        : unsafe.approvalStatus ?? publicData.approvalStatus,
  };
};

const splitDisplayName = (displayName: string) => {
  const parts = displayName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return { firstName: '', lastName: '' };
  }

  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(' '),
  };
};

const resolveDisplayName = (values: Array<string | null | undefined>) =>
  values
    .find(value => typeof value === 'string' && value.trim().length > 0)
    ?.trim() ?? 'Photographer';

const mapRole = (
  apiUser: ApiUser | null,
  metadata: AuthMetadata,
  clerkIdentifiers: Array<string | null | undefined>,
): UserProfile['role'] => {
  if (apiUser?.role === 'admin' || metadata.role === 'admin') {
    return 'admin';
  }

  if (
    clerkIdentifiers.some(identifier => {
      if (!identifier) {
        return false;
      }

      const localPart = identifier.includes('@')
        ? identifier.split('@')[0]
        : identifier;
      return localPart.trim().toLowerCase() === 'admin';
    })
  ) {
    return 'admin';
  }

  return 'pg';
};

const mapApprovalStatus = (
  photographer: ApiPhotographer | null,
  metadata: AuthMetadata,
): UserProfile['approvalStatus'] => {
  if (
    photographer?.status === 'approved' ||
    metadata.approvalStatus === 'approved'
  ) {
    return 'approved';
  }

  return metadata.approvalStatus ?? 'pending';
};

const wait = (ms: number) =>
  new Promise(resolve => {
    window.setTimeout(resolve, ms);
  });

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const clerk = useClerk();
  const {
    isLoaded: isClerkLoaded,
    isSignedIn,
    getToken,
  } = useClerkAuth();
  const { user: clerkUser } = useUser();
  const [apiUser, setApiUser] = useState<ApiUser | null>(null);
  const [apiPhotographer, setApiPhotographer] =
    useState<ApiPhotographer | null>(null);
  const [isProfileLoaded, setIsProfileLoaded] = useState(false);

  const metadata = useMemo(
    () =>
      readMetadata(clerkUser?.publicMetadata, clerkUser?.unsafeMetadata),
    [clerkUser?.publicMetadata, clerkUser?.unsafeMetadata],
  );

  const getApiToken = useCallback(async () => {
    for (let attempt = 0; attempt < 6; attempt += 1) {
      const token = await getToken({ skipCache: attempt > 0 });
      if (token) {
        return token;
      }
      await wait(250);
    }

    return null;
  }, [getToken]);

  const loadApiProfile = useCallback(async () => {
    if (!clerkUser) {
      setApiUser(null);
      setApiPhotographer(null);
      setIsProfileLoaded(true);
      return;
    }

    setIsProfileLoaded(false);
    try {
      const nextApiUser = await api.getMe(getApiToken);
      setApiUser(nextApiUser);

      try {
        const nextPhotographer = await api.getMyPhotographer(getApiToken);
        setApiPhotographer(nextPhotographer);
      } catch (error) {
        if (error instanceof ApiError && error.status === 404) {
          setApiPhotographer(null);
        } else {
          throw error;
        }
      }
    } catch (error) {
      console.error('Failed to load Gallopics API profile', error);
      setApiUser(null);
      setApiPhotographer(null);
    } finally {
      setIsProfileLoaded(true);
    }
  }, [clerkUser, getApiToken]);

  useEffect(() => {
    if (!isClerkLoaded) {
      return;
    }

    void loadApiProfile();
  }, [isClerkLoaded, loadApiProfile]);

  const user: UserProfile | null = useMemo(() => {
    if (!clerkUser) {
      return null;
    }

    const displayName = resolveDisplayName([
      apiPhotographer?.display_name,
      [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(' '),
      clerkUser.fullName,
      clerkUser.username,
      clerkUser.primaryEmailAddress?.emailAddress?.split('@')[0],
    ]);
    const fallbackSlug = normalizeIdentifier(
      clerkUser.username ||
        clerkUser.primaryEmailAddress?.emailAddress ||
        displayName,
    );

    return {
      id: apiPhotographer?.slug || fallbackSlug,
      displayName,
      city:
        apiPhotographer?.city ||
        metadata.city ||
        '',
      country:
        apiPhotographer?.country ||
        metadata.country ||
        undefined,
      avatarUrl:
        resolveApiAssetUrl(apiPhotographer?.avatar_url) ??
        resolveApiAssetUrl(metadata.avatarUrl) ??
        clerkUser.imageUrl ??
        null,
      phone: apiPhotographer?.phone ?? null,
      hasCompletedOnboarding:
        metadata.hasCompletedOnboarding ?? Boolean(apiPhotographer),
      role: mapRole(apiUser, metadata, [
        clerkUser.username,
        clerkUser.primaryEmailAddress?.emailAddress,
      ]),
      approvalStatus: mapApprovalStatus(apiPhotographer, metadata),
    };
  }, [apiPhotographer, apiUser, clerkUser, metadata]);

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!clerkUser) {
      return;
    }

    const nextDisplayName =
      updates.displayName ?? user?.displayName ?? 'Photographer';
    const { firstName, lastName } = splitDisplayName(nextDisplayName);
    const nextProfile = await api.upsertMyPhotographer(getApiToken, {
      slug: updates.id ?? user?.id,
      display_name: nextDisplayName,
      city: updates.city ?? user?.city ?? null,
      country: updates.country ?? user?.country ?? null,
      avatar_url:
        updates.avatarUrl === undefined
          ? user?.avatarUrl ?? null
          : updates.avatarUrl,
      phone: updates.phone === undefined ? user?.phone ?? null : updates.phone,
      is_available_to_hire: true,
    });

    setApiPhotographer(nextProfile);
    setApiUser(current =>
      current ? { ...current, role: 'photographer' } : current,
    );

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
        role: updates.role ?? metadata.role ?? 'pg',
        approvalStatus:
          updates.approvalStatus ?? metadata.approvalStatus ?? 'pending',
      },
    });
  };

  const uploadAvatar = async (file: File) => {
    const nextProfile = await api.uploadMyAvatar(getApiToken, file);
    setApiPhotographer(nextProfile);
    return nextProfile.avatar_url ?? '';
  };

  const logout = async () => {
    await clerk.signOut();
  };

  return (
    <AuthContext.Provider
      value={{
        isLoaded: isClerkLoaded && isProfileLoaded,
        isAuthenticated: isClerkLoaded && !!isSignedIn,
        user,
        logout,
        updateProfile,
        uploadAvatar,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
