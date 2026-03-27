import React, { createContext, useContext, useMemo } from 'react';
import { useAuth as useClerkAuth, useClerk, useUser } from '@clerk/clerk-react';
import { assetUrl } from '../lib/utils';
import { PHOTOGRAPHERS } from '../data/mockData';

export interface UserProfile {
    id?: string;
    displayName: string;
    city: string;
    country?: string;
    avatarUrl?: string | null;
    hasCompletedOnboarding?: boolean;
    role?: 'pg' | 'admin';
}

interface AuthContextType {
    isLoaded: boolean;
    isAuthenticated: boolean;
    user: UserProfile | null;
    logout: () => Promise<void>;
    updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
}

type AuthMetadata = {
    avatarUrl?: string | null;
    city?: string;
    country?: string;
    hasCompletedOnboarding?: boolean;
    role?: 'pg' | 'admin';
    photographerProfileId?: string;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const PROTOTYPE_USER = {
    id: 'klara-fors',
    displayName: 'Klara Fors',
    country: 'Sweden',
    city: 'Stockholm',
    avatarUrl: assetUrl('images/Klara Fors.jpg'),
    role: 'pg' as const,
};

const DEFAULT_PHOTOGRAPHER_PROFILE_ID = PROTOTYPE_USER.id;

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

const resolveRole = (candidates: Array<string | null | undefined>) => {
    for (const candidate of candidates) {
        if (!candidate) {
            continue;
        }

        const normalized = normalizeIdentifier(candidate);
        if (normalized === 'admin' || normalized.startsWith('admin-')) {
            return 'admin' as const;
        }
    }

    return 'pg' as const;
};

const resolvePhotographerProfileId = (candidates: Array<string | null | undefined>) => {
    const photographerIds = new Set(PHOTOGRAPHERS.map((photographer) => photographer.id));
    const photographerNameMap = new Map(
        PHOTOGRAPHERS.map((photographer) => [
            slugify(`${photographer.firstName} ${photographer.lastName}`),
            photographer.id,
        ]),
    );

    for (const candidate of candidates) {
        if (!candidate) {
            continue;
        }

        const normalized = slugify(candidate);
        if (!normalized) {
            continue;
        }

        if (normalized === 'member') {
            return DEFAULT_PHOTOGRAPHER_PROFILE_ID;
        }

        if (photographerIds.has(normalized)) {
            return normalized;
        }

        const matchedPhotographerId = photographerNameMap.get(normalized);
        if (matchedPhotographerId) {
            return matchedPhotographerId;
        }
    }

    return DEFAULT_PHOTOGRAPHER_PROFILE_ID;
};

const readMetadata = (metadata: unknown): AuthMetadata => {
    if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) {
        return {};
    }

    const raw = metadata as Record<string, unknown>;

    return {
        avatarUrl: typeof raw.avatarUrl === 'string' || raw.avatarUrl === null ? raw.avatarUrl : undefined,
        city: typeof raw.city === 'string' ? raw.city : undefined,
        country: typeof raw.country === 'string' ? raw.country : undefined,
        hasCompletedOnboarding: typeof raw.hasCompletedOnboarding === 'boolean' ? raw.hasCompletedOnboarding : undefined,
        role: raw.role === 'admin' ? 'admin' : raw.role === 'pg' ? 'pg' : undefined,
        photographerProfileId:
            typeof raw.photographerProfileId === 'string' ? raw.photographerProfileId : undefined,
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
    values.find((value) => typeof value === 'string' && value.trim().length > 0)?.trim() ?? PROTOTYPE_USER.displayName;

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const clerk = useClerk();
    const { isLoaded, isSignedIn } = useClerkAuth();
    const { user: clerkUser } = useUser();

    const user = useMemo<UserProfile | null>(() => {
        if (!clerkUser) {
            return null;
        }

        const metadata = readMetadata(clerkUser.unsafeMetadata);
        const displayName = resolveDisplayName([
            [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(' '),
            clerkUser.fullName,
            clerkUser.username,
            clerkUser.primaryEmailAddress?.emailAddress?.split('@')[0],
        ]);
        const resolvedRole = metadata.role ?? resolveRole([
            clerkUser.username,
            clerkUser.primaryEmailAddress?.emailAddress,
            displayName,
        ]);
        const photographerProfileId = metadata.photographerProfileId ?? resolvePhotographerProfileId([
            clerkUser.username,
            clerkUser.primaryEmailAddress?.emailAddress?.split('@')[0],
            displayName,
        ]);

        return {
            id: photographerProfileId,
            displayName,
            city: metadata.city ?? PROTOTYPE_USER.city,
            country: metadata.country ?? PROTOTYPE_USER.country,
            avatarUrl: metadata.avatarUrl === undefined ? clerkUser.imageUrl : metadata.avatarUrl,
            hasCompletedOnboarding: metadata.hasCompletedOnboarding ?? false,
            role: resolvedRole,
        };
    }, [clerkUser]);

    const updateProfile = async (updates: Partial<UserProfile>) => {
        if (!clerkUser) {
            return;
        }

        const metadata = readMetadata(clerkUser.unsafeMetadata);
        const nextDisplayName = updates.displayName ?? user?.displayName ?? PROTOTYPE_USER.displayName;
        const { firstName, lastName } = splitDisplayName(nextDisplayName);
        const resolvedRole = updates.role ?? metadata.role ?? resolveRole([
            clerkUser.username,
            clerkUser.primaryEmailAddress?.emailAddress,
            nextDisplayName,
        ]);

        await clerkUser.update({
            firstName: firstName || null,
            lastName: lastName || null,
            unsafeMetadata: {
                ...metadata,
                photographerProfileId:
                    updates.id ??
                    metadata.photographerProfileId ??
                    resolvePhotographerProfileId([
                        clerkUser.username,
                        clerkUser.primaryEmailAddress?.emailAddress?.split('@')[0],
                        nextDisplayName,
                    ]),
                avatarUrl: updates.avatarUrl === undefined ? metadata.avatarUrl : updates.avatarUrl,
                city: updates.city ?? metadata.city ?? PROTOTYPE_USER.city,
                country: updates.country ?? metadata.country ?? PROTOTYPE_USER.country,
                hasCompletedOnboarding:
                    updates.hasCompletedOnboarding ?? metadata.hasCompletedOnboarding ?? false,
                role: resolvedRole,
            },
        });
    };

    const logout = async () => {
        await clerk.signOut();
    };

    return (
        <AuthContext.Provider
            value={{
                isLoaded,
                isAuthenticated: isLoaded && !!isSignedIn,
                user,
                logout,
                updateProfile,
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
