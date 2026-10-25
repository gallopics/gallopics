import React from "react"
import { Navigate, useLocation } from "react-router"

import { useAuth } from "../context/AuthContext"

interface ProtectedRouteProps {
  children: React.ReactNode
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isLoaded, isAuthenticated, user, needsOnboarding } = useAuth()
  const location = useLocation()

  // Approval comes from our API (set by admins), never from Clerk metadata
  const effectiveApprovalStatus = user?.approvalStatus

  if (!isLoaded) {
    return null
  }

  if (!isAuthenticated) {
    return <Navigate to="/" replace />
  }

  // Role-based path protection
  const isAdminPath = location.pathname.startsWith("/admin")
  const isPgPath = location.pathname.startsWith("/pg")
  const isPendingApprovalPath = location.pathname === "/pg/pending-approval"
  const isOnboardingPath = location.pathname.startsWith("/pg/onboarding/")

  if (isAdminPath && user?.role !== "admin") {
    // Photographers shouldn't be on /admin paths
    return <Navigate to="/pg/events" replace />
  }

  // Signed up but never saved a photographer profile: finish onboarding first
  if (isPgPath && needsOnboarding && !isOnboardingPath) {
    return <Navigate to="/pg/onboarding/profile" replace />
  }

  if (
    isPgPath &&
    user?.role !== "admin" &&
    effectiveApprovalStatus !== "approved" &&
    !isPendingApprovalPath &&
    !isOnboardingPath
  ) {
    return <Navigate to="/pg/pending-approval" replace />
  }

  if (
    isPendingApprovalPath &&
    user?.role !== "admin" &&
    effectiveApprovalStatus === "approved"
  ) {
    return <Navigate to="/pg/events" replace />
  }

  if (isPgPath && user?.role === "admin") {
    // Admins shouldn't be on /pg paths (clean separation)
    return <Navigate to="/admin/events" replace />
  }

  return <>{children}</>
}
