import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface ProtectedRouteProps {
    children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
    const { isLoaded, isAuthenticated, user } = useAuth();
    const location = useLocation();

    if (!isLoaded) {
        return null;
    }

    if (!isAuthenticated) {
        return <Navigate to="/" replace />;
    }

    // Role-based path protection
    const isAdminPath = location.pathname.startsWith('/admin');
    const isPgPath = location.pathname.startsWith('/pg');

    if (isAdminPath && user?.role !== 'admin') {
        // Photographers shouldn't be on /admin paths
        return <Navigate to="/pg/events" replace />;
    }

    if (isPgPath && user?.role === 'admin') {
        // Admins shouldn't be on /pg paths (clean separation)
        return <Navigate to="/admin/events" replace />;
    }

    return <>{children}</>;
};
