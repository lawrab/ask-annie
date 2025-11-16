import { useEffect } from 'react';
import { Navigate } from 'react-router';
import { useAuthStore } from '../stores/authStore';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated());
  const restoreSession = useAuthStore((state) => state.restoreSession);

  useEffect(() => {
    // Restore session from localStorage on mount
    restoreSession();
  }, [restoreSession]);

  if (!isAuthenticated) {
    // Redirect to login if not authenticated
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
