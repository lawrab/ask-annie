import { useNavigate } from 'react-router';
import { useAuthStore } from '../stores/authStore';
import { Button } from './ui/Button';

export interface HeaderProps {
  /**
   * The title to display in the header
   */
  title?: string;
  /**
   * Optional subtitle/greeting text
   */
  subtitle?: string;
  /**
   * Which page is currently active (to hide that button from nav)
   */
  currentPage?: 'dashboard' | 'trends' | 'settings' | 'checkin';
}

/**
 * Shared header component with mobile-responsive navigation
 * Displays app title and navigation buttons
 */
export function Header({ title, subtitle, currentPage }: HeaderProps) {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const displaySubtitle = subtitle || `Welcome, ${user?.username}!`;

  return (
    <header className="bg-indigo-600 text-white shadow-md">
      <div className="container mx-auto px-4 py-4 sm:py-6">
        <div className="flex justify-between items-center gap-4">
          {/* Title section */}
          <div className="min-w-0 flex-shrink">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold truncate">
              {title || "Annie's Health Journal"}
            </h1>
            <p className="text-indigo-100 text-sm sm:text-base truncate">{displaySubtitle}</p>
          </div>

          {/* Navigation section */}
          <nav className="flex gap-2 flex-shrink-0">
            {currentPage !== 'dashboard' && (
              <Button
                onClick={() => navigate('/dashboard')}
                variant="secondary"
                size="small"
                className="whitespace-nowrap"
              >
                <span className="hidden sm:inline">Dashboard</span>
                <span className="sm:hidden">📊</span>
              </Button>
            )}
            {currentPage !== 'trends' && (
              <Button
                onClick={() => navigate('/trends')}
                variant="secondary"
                size="small"
                className="whitespace-nowrap"
              >
                <span className="hidden sm:inline">Trends</span>
                <span className="sm:hidden">📈</span>
              </Button>
            )}
            {currentPage !== 'settings' && (
              <Button
                onClick={() => navigate('/settings')}
                variant="secondary"
                size="small"
                className="whitespace-nowrap"
              >
                <span className="hidden sm:inline">Settings</span>
                <span className="sm:hidden">⚙️</span>
              </Button>
            )}
            <Button
              onClick={handleLogout}
              variant="secondary"
              size="small"
              className="whitespace-nowrap"
            >
              <span className="hidden sm:inline">Logout</span>
              <span className="sm:hidden">🚪</span>
            </Button>
          </nav>
        </div>
      </div>
    </header>
  );
}
