import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import { useAuth } from '../context/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isLoaded, isAuthenticated, user } = useAuth();
  const { user: clerkUser } = useUser();
  const location = useLocation();

  const publicApprovalStatus =
    typeof clerkUser?.publicMetadata?.approvalStatus === 'string'
      ? clerkUser.publicMetadata.approvalStatus
      : undefined;
  const unsafeApprovalStatus =
    typeof clerkUser?.unsafeMetadata?.approvalStatus === 'string'
      ? clerkUser.unsafeMetadata.approvalStatus
      : undefined;
  const effectiveApprovalStatus =
    user?.approvalStatus ?? publicApprovalStatus ?? unsafeApprovalStatus;

  if (!isLoaded) {
    return null;
  }

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  // Role-based path protection
  const isAdminPath = location.pathname.startsWith('/admin');
  const isPgPath = location.pathname.startsWith('/pg');
  const isPendingApprovalPath = location.pathname === '/pg/pending-approval';
  const isOnboardingPath = location.pathname.startsWith('/pg/onboarding/');

  if (isAdminPath && user?.role !== 'admin') {
    // Photographers shouldn't be on /admin paths
    return <Navigate to="/pg/events" replace />;
  }

  if (
    isPgPath &&
    user?.role !== 'admin' &&
    effectiveApprovalStatus !== 'approved' &&
    !isPendingApprovalPath &&
    !isOnboardingPath
  ) {
    return <Navigate to="/pg/pending-approval" replace />;
  }

  if (
    isPendingApprovalPath &&
    user?.role !== 'admin' &&
    effectiveApprovalStatus === 'approved'
  ) {
    return <Navigate to="/pg/events" replace />;
  }

  if (isPgPath && user?.role === 'admin') {
    // Admins shouldn't be on /pg paths (clean separation)
    return <Navigate to="/admin/events" replace />;
  }

  return <>{children}</>;
};
