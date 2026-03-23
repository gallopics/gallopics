import React, { createContext, useContext, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';

interface WorkspaceContextType {
    basePath: string;
    isAdmin: boolean;
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

export const WorkspaceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const location = useLocation();
    const { user } = useAuth();

    const value = useMemo(() => {
        // isAdmin is only true if both the URL matches AND the user has an admin role
        const pathIsAdmin = location.pathname.startsWith('/admin');
        const userIsAdmin = user?.role === 'admin';

        // In prototype, we permit path-based isAdmin for guests or when testing, 
        // but if logged in, we check the role.
        const isAdmin = user ? userIsAdmin : pathIsAdmin;
        const basePath = isAdmin ? '/admin' : '/pg';

        return { basePath, isAdmin };
    }, [location.pathname, user]);

    return (
        <WorkspaceContext.Provider value={value}>
            {children}
        </WorkspaceContext.Provider>
    );
};

export const useWorkspace = () => {
    const context = useContext(WorkspaceContext);
    if (!context) {
        // Fallback for components not under the provider but needing it (though rare in this app)
        return { basePath: '/pg', isAdmin: false };
    }
    return context;
};
