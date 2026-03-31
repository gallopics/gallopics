import { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import ScrollToTop from './components/ScrollToTop';

import { CartProvider } from './context/CartContext';
import { AuthProvider } from './context/AuthContext';
import { PhotographerProvider } from './context/PhotographerContext';
import { WorkspaceProvider } from './context/WorkspaceContext';
import { ProtectedRoute } from './components/ProtectedRoute';

// Photographer Workspace layout — kept eager (shell needed immediately on auth)
import { PhotographerLayout } from './pages/pg/PhotographerLayout';

// Public routes — lazy loaded
const EventsPage = lazy(() =>
  import('./pages/EventsPage').then(m => ({ default: m.EventsPage })),
);
const EventProfile = lazy(() =>
  import('./pages/EventProfile').then(m => ({ default: m.EventProfile })),
);
const PhotographerProfile = lazy(() =>
  import('./pages/PhotographerProfile').then(m => ({
    default: m.PhotographerProfile,
  })),
);
const RiderProfile = lazy(() =>
  import('./pages/RiderProfile').then(m => ({ default: m.RiderProfile })),
);
const HorseProfile = lazy(() =>
  import('./pages/HorseProfile').then(m => ({ default: m.HorseProfile })),
);
const ImageProfile = lazy(() =>
  import('./pages/ImageProfile').then(m => ({ default: m.ImageProfile })),
);
const Cart = lazy(() =>
  import('./pages/Cart').then(m => ({ default: m.Cart })),
);
const FAQPage = lazy(() =>
  import('./pages/FAQPage').then(m => ({ default: m.FAQPage })),
);
const PrivacyPage = lazy(() =>
  import('./pages/PrivacyPage').then(m => ({ default: m.PrivacyPage })),
);
const TermsPage = lazy(() =>
  import('./pages/TermsPage').then(m => ({ default: m.TermsPage })),
);

// Photographer workspace — lazy loaded
const EventsList = lazy(() =>
  import('./pages/pg/EventsList').then(m => ({ default: m.EventsList })),
);
const EventDetail = lazy(() =>
  import('./pages/pg/EventDetail').then(m => ({ default: m.EventDetail })),
);
const SoldPhotos = lazy(() =>
  import('./pages/pg/SoldPhotos').then(m => ({ default: m.SoldPhotos })),
);
const Receipts = lazy(() =>
  import('./pages/pg/Receipts').then(m => ({ default: m.Receipts })),
);
const PhotographerBilling = lazy(() =>
  import('./pages/pg/Billing').then(m => ({ default: m.PhotographerBilling })),
);
const Settings = lazy(() =>
  import('./pages/pg/Settings').then(m => ({ default: m.Settings })),
);
const TokensPage = lazy(() =>
  import('./pages/pg/TokensPage').then(m => ({ default: m.TokensPage })),
);
const UploadPage = lazy(() =>
  import('./pages/pg/UploadPage').then(m => ({ default: m.UploadPage })),
);
const Photographers = lazy(() =>
  import('./pages/pg/Photographers').then(m => ({ default: m.Photographers })),
);
const PendingApproval = lazy(() =>
  import('./pages/pg/PendingApproval').then(m => ({
    default: m.PendingApproval,
  })),
);
const OnboardingProfile = lazy(() =>
  import('./pages/pg/onboarding/OnboardingProfile').then(m => ({
    default: m.OnboardingProfile,
  })),
);
const OnboardingReady = lazy(() =>
  import('./pages/pg/onboarding/OnboardingReady').then(m => ({
    default: m.OnboardingReady,
  })),
);

function App() {
  useEffect(() => {
    // Ensure app boot always lands clean: no search overlay/scroll-lock leftovers
    document.body.style.overflow = '';
    document.body.classList.remove('isSearchMode');
  }, []);

  return (
    <CartProvider>
      <AuthProvider>
        <PhotographerProvider>
          <BrowserRouter>
            <WorkspaceProvider>
              <ScrollToTop />
              <Suspense fallback={null}>
                <Routes>
                  {/* Public Routes */}
                  <Route path="/" element={<EventsPage />} />
                  <Route path="/event/:eventId" element={<EventProfile />} />
                  <Route
                    path="/photographer/:id"
                    element={<PhotographerProfile />}
                  />
                  <Route path="/rider/:riderId" element={<RiderProfile />} />
                  <Route path="/horse/:horseId" element={<HorseProfile />} />
                  <Route path="/photo/:id" element={<ImageProfile />} />
                  <Route path="/cart" element={<Cart />} />
                  <Route path="/faq" element={<FAQPage />} />
                  <Route path="/privacy" element={<PrivacyPage />} />
                  <Route path="/terms" element={<TermsPage />} />
                  <Route
                    path="/photographerprofile"
                    element={<PhotographerProfile />}
                  />

                  {/* Photographer Workspace (Layout-wrapped) */}
                  <Route
                    element={
                      <ProtectedRoute>
                        <PhotographerLayout />
                      </ProtectedRoute>
                    }
                  >
                    <Route path="/pg/events" element={<EventsList />} />
                    <Route
                      path="/pg/events/:eventId"
                      element={<EventDetail />}
                    />
                    <Route path="/pg/sold" element={<SoldPhotos />} />
                    <Route path="/pg/receipts" element={<Receipts />} />
                    <Route
                      path="/pg/billing"
                      element={<PhotographerBilling />}
                    />
                    <Route path="/pg/settings" element={<Settings />} />
                    <Route path="/pg/tokens" element={<TokensPage />} />

                    {/* Admin Workspace (Cloned) */}
                    <Route path="/admin/events" element={<EventsList />} />
                    <Route
                      path="/admin/events/:eventId"
                      element={<EventDetail />}
                    />
                    <Route path="/admin/sold" element={<SoldPhotos />} />
                    <Route path="/admin/receipts" element={<Receipts />} />
                    <Route
                      path="/admin/billing"
                      element={<PhotographerBilling />}
                    />
                    <Route path="/admin/settings" element={<Settings />} />
                    <Route path="/admin/tokens" element={<TokensPage />} />
                    <Route
                      path="/admin/photographers"
                      element={<Photographers />}
                    />
                  </Route>

                  <Route
                    path="/pg/upload"
                    element={
                      <ProtectedRoute>
                        <UploadPage />
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="/admin/upload"
                    element={
                      <ProtectedRoute>
                        <UploadPage />
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="/pg"
                    element={<Navigate to="/pg/events" replace />}
                  />
                  <Route
                    path="/admin"
                    element={<Navigate to="/admin/events" replace />}
                  />

                  {/* Photographer Onboarding (Fullscreen) */}
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
                  <Route
                    path="/pg/onboarding/ready"
                    element={
                      <ProtectedRoute>
                        <OnboardingReady />
                      </ProtectedRoute>
                    }
                  />
                </Routes>
              </Suspense>
            </WorkspaceProvider>
          </BrowserRouter>
        </PhotographerProvider>
      </AuthProvider>
    </CartProvider>
  );
}

export default App;
