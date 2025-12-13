import { useNavigate } from 'react-router';
import { ChevronLeft, TrendingUp, FileText, Shield } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { Button } from './ui/Button';
import { ProfileDropdown } from './ProfileDropdown';

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
   * Which page is currently active (to hide that nav link)
   */
  currentPage?: 'dashboard' | 'trends' | 'settings' | 'checkin' | 'admin' | 'summary';
}

/**
 * Shared header component with profile dropdown navigation
 * Displays app title, optional Trends link, and user profile menu
 *
 * Uses Soft Dawn design system:
 * - Deep Terracotta background for warmth
 * - White text for contrast
 * - Soft shadows
 */
export function Header({ title, subtitle, currentPage }: HeaderProps) {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);

  const displaySubtitle = subtitle || `Welcome, ${user?.username}!`;

  return (
    <header className="bg-terracotta text-white shadow-card">
      <div className="container mx-auto px-4 py-3 sm:py-6">
        <div className="flex justify-between items-center gap-2 sm:gap-4">
          {/* Title section */}
          <div className="min-w-0 flex-1 flex items-center gap-1 sm:gap-2">
            {/* Back to dashboard button for non-dashboard pages */}
            {currentPage !== 'dashboard' && (
              <button
                onClick={() => navigate('/dashboard')}
                className="p-1 sm:p-1.5 -ml-1 sm:-ml-1.5 rounded-lg hover:bg-white/10 transition-colors flex-shrink-0"
                aria-label="Back to dashboard"
              >
                <ChevronLeft className="h-5 w-5 sm:h-6 sm:w-6" />
              </button>
            )}
            <div className="min-w-0">
              <h1
                className="text-base sm:text-2xl md:text-3xl font-bold truncate cursor-pointer hover:opacity-90 transition-opacity"
                onClick={() => navigate('/dashboard')}
              >
                {title || "Annie's Health Journal"}
              </h1>
              <p className="hidden sm:block text-white/80 text-sm sm:text-base truncate">{displaySubtitle}</p>
            </div>
          </div>

          {/* Navigation section */}
          <nav className="flex items-center gap-1 sm:gap-3 flex-shrink-0">
            {currentPage !== 'trends' && (
              <Button
                onClick={() => navigate('/trends')}
                variant="secondary"
                size="small"
                className="bg-white/10 border-white/30 text-white hover:bg-white/20 hover:text-white"
                aria-label="Trends"
              >
                <span className="hidden sm:inline">Trends</span>
                <TrendingUp className="h-4 w-4 sm:hidden" />
              </Button>
            )}
            {currentPage !== 'summary' && (
              <Button
                onClick={() => navigate('/summary')}
                variant="secondary"
                size="small"
                className="bg-white/10 border-white/30 text-white hover:bg-white/20 hover:text-white"
                aria-label="Summary"
              >
                <span className="hidden sm:inline">Summary</span>
                <FileText className="h-4 w-4 sm:hidden" />
              </Button>
            )}
            {user?.isAdmin && currentPage !== 'admin' && (
              <Button
                onClick={() => navigate('/admin')}
                variant="secondary"
                size="small"
                className="bg-white/10 border-white/30 text-white hover:bg-white/20 hover:text-white"
                aria-label="Admin"
              >
                <span className="hidden sm:inline">Admin</span>
                <Shield className="h-4 w-4 sm:hidden" />
              </Button>
            )}
            <ProfileDropdown />
          </nav>
        </div>
      </div>
    </header>
  );
}
