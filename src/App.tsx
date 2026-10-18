import { Fragment, lazy, Suspense, useEffect } from "react"
import { BrowserRouter, Navigate, Route, Routes } from "react-router"

import { AuthProvider } from "@/context/AuthContext"
import { CartProvider } from "@/context/CartContext"
import { PhotographerProvider } from "@/context/PhotographerContext"
import { WorkspaceProvider } from "@/context/WorkspaceContext"
import { ProtectedRoute } from "@/components/ProtectedRoute"
import ScrollToTop from "@/components/ScrollToTop"
// Shell for all workspace pages: kept eager so it appears immediately on auth
import { PhotographerLayout } from "@/pages/pg/PhotographerLayout"

// Pages are added here as they are migrated from the old app.
const ComingSoonPage = lazy(() =>
  import("@/pages/ComingSoonPage").then((m) => ({
    default: m.ComingSoonPage,
  }))
)
const EventsPage = lazy(() =>
  import("@/pages/EventsPage").then((m) => ({ default: m.EventsPage }))
)
const EventProfile = lazy(() =>
  import("@/pages/EventProfile").then((m) => ({ default: m.EventProfile }))
)
const HorseProfile = lazy(() =>
  import("@/pages/HorseProfile").then((m) => ({ default: m.HorseProfile }))
)
const PhotographerProfile = lazy(() =>
  import("@/pages/PhotographerProfile").then((m) => ({
    default: m.PhotographerProfile,
  }))
)
const RiderProfile = lazy(() =>
  import("@/pages/RiderProfile").then((m) => ({ default: m.RiderProfile }))
)
const Cart = lazy(() =>
  import("@/pages/Cart").then((m) => ({ default: m.Cart }))
)
const ImageProfile = lazy(() =>
  import("@/pages/ImageProfile").then((m) => ({ default: m.ImageProfile }))
)
const PendingApproval = lazy(() =>
  import("@/pages/pg/PendingApproval").then((m) => ({
    default: m.PendingApproval,
  }))
)
const EventsList = lazy(() =>
  import("@/pages/pg/EventsList").then((m) => ({ default: m.EventsList }))
)
const EventDetail = lazy(() =>
  import("@/pages/pg/EventDetail").then((m) => ({ default: m.EventDetail }))
)
const SoldPhotos = lazy(() =>
  import("@/pages/pg/SoldPhotos").then((m) => ({ default: m.SoldPhotos }))
)
const Photographers = lazy(() =>
  import("@/pages/pg/Photographers").then((m) => ({ default: m.Photographers }))
)
const UploadPage = lazy(() =>
  import("@/pages/pg/UploadPage").then((m) => ({ default: m.UploadPage }))
)
const OnboardingProfile = lazy(() =>
  import("@/pages/pg/onboarding/OnboardingProfile").then((m) => ({
    default: m.OnboardingProfile,
  }))
)
const PhotographerBilling = lazy(() =>
  import("@/pages/pg/Billing").then((m) => ({
    default: m.PhotographerBilling,
  }))
)
const Receipts = lazy(() =>
  import("@/pages/pg/Receipts").then((m) => ({ default: m.Receipts }))
)
const Settings = lazy(() =>
  import("@/pages/pg/Settings").then((m) => ({ default: m.Settings }))
)
const FAQPage = lazy(() =>
  import("@/pages/FAQPage").then((m) => ({ default: m.FAQPage }))
)
const PrivacyPage = lazy(() =>
  import("@/pages/PrivacyPage").then((m) => ({ default: m.PrivacyPage }))
)
const TermsPage = lazy(() =>
  import("@/pages/TermsPage").then((m) => ({ default: m.TermsPage }))
)

// Workspace pages, served under both /pg and /admin (same pages, role-checked)
const workspacePages = [
  { path: "events", element: <EventsList /> },
  { path: "events/:eventId", element: <EventDetail /> },
  { path: "sold", element: <SoldPhotos /> },
  { path: "receipts", element: <Receipts /> },
  { path: "billing", element: <PhotographerBilling /> },
  { path: "settings", element: <Settings /> },
]

const showComingSoon =
  import.meta.env.VITE_SHOW_COMING_SOON === "true" ||
  (import.meta.env.PROD && import.meta.env.VITE_SHOW_COMING_SOON !== "false")

function App() {
  useEffect(() => {
    // Ensure app boot always lands clean: no search overlay/scroll-lock leftovers
    document.body.style.overflow = ""
    document.body.classList.remove("isSearchMode")
  }, [])

  return (
    <CartProvider>
      <AuthProvider>
        <PhotographerProvider>
          <BrowserRouter>
            <WorkspaceProvider>
              <ScrollToTop />
              <Suspense fallback={null}>
                <Routes>
                  <Route
                    path="/"
                    element={
                      showComingSoon ? <ComingSoonPage /> : <EventsPage />
                    }
                  />
                  <Route path="/event/:eventId" element={<EventProfile />} />
                  <Route
                    path="/photographer/:id"
                    element={<PhotographerProfile />}
                  />
                  <Route path="/rider/:riderId" element={<RiderProfile />} />
                  <Route path="/horse/:horseId" element={<HorseProfile />} />
                  <Route
                    path="/photographerprofile"
                    element={<PhotographerProfile />}
                  />
                  <Route path="/photo/:id" element={<ImageProfile />} />
                  <Route path="/cart" element={<Cart />} />
                  {/* Photographer / admin workspace */}
                  <Route
                    element={
                      <ProtectedRoute>
                        <PhotographerLayout />
                      </ProtectedRoute>
                    }
                  >
                    {["/pg", "/admin"].map((base) => (
                      <Fragment key={base}>
                        {workspacePages.map((page) => (
                          <Route
                            key={page.path}
                            path={`${base}/${page.path}`}
                            element={page.element}
                          />
                        ))}
                      </Fragment>
                    ))}
                    {/* Admin only */}
                    <Route
                      path="/admin/photographers"
                      element={<Photographers />}
                    />
                  </Route>
                  {/* Full-screen upload (outside the workspace layout) */}
                  {["/pg", "/admin"].map((base) => (
                    <Route
                      key={base}
                      path={`${base}/upload`}
                      element={
                        <ProtectedRoute>
                          <UploadPage />
                        </ProtectedRoute>
                      }
                    />
                  ))}
                  <Route
                    path="/pg"
                    element={<Navigate to="/pg/events" replace />}
                  />
                  <Route
                    path="/admin"
                    element={<Navigate to="/admin/events" replace />}
                  />
                  <Route
                    path="/pg/onboarding/profile"
                    element={
                      <ProtectedRoute>
                        <OnboardingProfile />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/pg/pending-approval"
                    element={
                      <ProtectedRoute>
                        <PendingApproval />
                      </ProtectedRoute>
                    }
                  />
                  <Route path="/comingsoon" element={<ComingSoonPage />} />
                  <Route path="/faq" element={<FAQPage />} />
                  <Route path="/privacy" element={<PrivacyPage />} />
                  <Route path="/terms" element={<TermsPage />} />
                </Routes>
              </Suspense>
            </WorkspaceProvider>
          </BrowserRouter>
        </PhotographerProvider>
      </AuthProvider>
    </CartProvider>
  )
}

export default App
