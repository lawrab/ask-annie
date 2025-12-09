import { Navigate } from 'react-router';
import { useAuthStore } from '../stores/authStore';

interface AdminRouteProps {
  children: React.ReactNode;
}

export function AdminRoute({ children }: AdminRouteProps) {
  const isLoading = useAuthStore((state) => state.isLoading);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated());
  const user = useAuthStore((state) => state.user);

  // Wait for session restoration to complete before checking authentication
  if (isLoading) {
    return null; // Or a loading spinner if desired
  }

  if (!isAuthenticated) {
    // Redirect to login if not authenticated
    return <Navigate to="/login" replace />;
  }

  if (!user?.isAdmin) {
    // Redirect to dashboard if not an admin
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
