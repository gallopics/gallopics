import React, { createContext, useContext, useState, useEffect } from 'react';
import { assetUrl } from '../lib/utils';

// For prototype, we'll store basic user info
interface UserProfile {
    id?: string;
    displayName: string;
    city: string;
    avatarUrl?: string | null;
    hasCompletedOnboarding?: boolean;
    role?: 'pg' | 'admin';
}

interface AuthContextType {
    isAuthenticated: boolean;
    user: UserProfile | null;
    login: (profile?: UserProfile) => void;
    logout: () => void;
    updateProfile: (updates: Partial<UserProfile>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Prototype Constants
export const PROTOTYPE_USER = {
    id: 'klara-fors',
    displayName: 'Klara Fors',
    country: 'Sweden',
    city: 'Stockholm',
    avatarUrl: assetUrl('images/Klara Fors.jpg'),
    role: 'pg' as const
};

export const ADMIN_USER = {
    id: 'ida-lindemann',
    displayName: 'Ida Lindemann',
    country: 'Germany',
    city: 'Admin',
    avatarUrl: assetUrl('images/ida.jpg'),
    role: 'admin' as const
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    // Initialize from localStorage if present
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
        return localStorage.getItem('gallopics_auth_is_authenticated') === 'true';
    });

    const [user, setUser] = useState<UserProfile | null>(() => {
        const savedUser = localStorage.getItem('gallopics_auth_user');
        return savedUser ? JSON.parse(savedUser) : null;
    });

    // Sync to localStorage
    useEffect(() => {
        localStorage.setItem('gallopics_auth_is_authenticated', String(isAuthenticated));
        if (user) {
            localStorage.setItem('gallopics_auth_user', JSON.stringify(user));
        } else {
            localStorage.removeItem('gallopics_auth_user');
        }
    }, [isAuthenticated, user]);

    const login = (profile?: UserProfile) => {
        setIsAuthenticated(true);
        if (profile) {
            setUser({ ...profile, hasCompletedOnboarding: profile.hasCompletedOnboarding ?? false });
        } else {
            // Default mock user if none provided (e.g. mock login)
            setUser({
                ...PROTOTYPE_USER,
                hasCompletedOnboarding: false
            });
        }
    };

    const updateProfile = (updates: Partial<UserProfile>) => {
        setUser(prev => prev ? { ...prev, ...updates } : null);
    };

    const logout = () => {
        setIsAuthenticated(false);
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ isAuthenticated, user, login, logout, updateProfile }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within an AuthProvider');
    return context;
};
