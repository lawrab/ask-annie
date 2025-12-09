import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AdminRoute } from './components/AdminRoute';
import { ErrorBoundary } from './components/ErrorBoundary';
import { useAuthStore } from './stores/authStore';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import MagicLinkVerifyPage from './pages/MagicLinkVerifyPage';
import DashboardPage from './pages/DashboardPage';
import CheckInPage from './pages/CheckInPage';
import TrendsPage from './pages/TrendsPage';
import SettingsPage from './pages/SettingsPage';
import DeleteAccountPage from './pages/DeleteAccountPage';
import DesignSystemPage from './pages/DesignSystemPage';
import AdminDashboardPage from './pages/AdminDashboardPage';

function App() {
  const restoreSession = useAuthStore((state) => state.restoreSession);

  // Restore session from localStorage on app mount (before routes render)
  useEffect(() => {
    restoreSession();
  }, [restoreSession]);

  return (
    <ErrorBoundary>
      <Router>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/auth/magic-link" element={<MagicLinkVerifyPage />} />
        <Route path="/design-system" element={<DesignSystemPage />} />

        {/* Protected routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/checkin"
          element={
            <ProtectedRoute>
              <CheckInPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/trends"
          element={
            <ProtectedRoute>
              <TrendsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <SettingsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/account/delete"
          element={
            <ProtectedRoute>
              <DeleteAccountPage />
            </ProtectedRoute>
          }
        />

        {/* Admin-only routes */}
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminDashboardPage />
            </AdminRoute>
          }
        />

        {/* Redirect root to dashboard */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Router>
    </ErrorBoundary>
  );
}

export default App;
