import { Fragment } from 'react';
import { Menu, Transition } from '@headlessui/react';
import { useNavigate } from 'react-router';
import { Settings, LogOut } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { cn } from '../utils/cn';
import { getInitial } from '../utils/string';

export interface ProfileDropdownProps {
  /**
   * Additional CSS classes
   */
  className?: string;
}

/**
 * Profile dropdown menu for user navigation
 * Displays user initial/avatar with Settings and Logout options
 */
export function ProfileDropdown({ className }: ProfileDropdownProps) {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleSettings = () => {
    navigate('/settings');
  };

  // Get user initial for avatar
  const userInitial = getInitial(user?.username);

  return (
    <Menu as="div" className={cn('relative', className)}>
      <Menu.Button
        className="flex items-center justify-center w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 text-white font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-white/50 focus:ring-offset-2 focus:ring-offset-indigo-600"
        aria-label="User menu"
      >
        {userInitial}
      </Menu.Button>

      <Transition
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Menu.Items className="absolute right-0 mt-2 w-48 origin-top-right rounded-lg bg-white shadow-lg ring-1 ring-black/5 focus:outline-none z-50">
          <div className="py-1">
            {/* User info header */}
            <div className="px-4 py-2 border-b border-gray-100">
              <p className="text-sm font-medium text-gray-900 truncate">
                {user?.username || 'User'}
              </p>
              <p className="text-xs text-gray-500 truncate">{user?.email}</p>
            </div>

            {/* Menu items */}
            <Menu.Item>
              {({ active }) => (
                <button
                  onClick={handleSettings}
                  className={cn(
                    'flex w-full items-center gap-3 px-4 py-2 text-sm text-gray-700',
                    active && 'bg-gray-50'
                  )}
                >
                  <Settings className="h-4 w-4 text-gray-400" />
                  Settings
                </button>
              )}
            </Menu.Item>

            <Menu.Item>
              {({ active }) => (
                <button
                  onClick={handleLogout}
                  className={cn(
                    'flex w-full items-center gap-3 px-4 py-2 text-sm text-gray-700',
                    active && 'bg-gray-50'
                  )}
                >
                  <LogOut className="h-4 w-4 text-gray-400" />
                  Logout
                </button>
              )}
            </Menu.Item>
          </div>
        </Menu.Items>
      </Transition>
    </Menu>
  );
}
