import { create } from 'zustand';
import { authApi, User } from '../services/api';

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: () => boolean;
  setUser: (user: User) => void;
  setToken: (token: string) => void;
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  restoreSession: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  isLoading: true, // Start as loading until session restoration completes

  isAuthenticated: () => {
    return !!get().token && !!get().user;
  },

  setUser: (user: User) => {
    set({ user });
    localStorage.setItem('user', JSON.stringify(user));
  },

  setToken: (token: string) => {
    set({ token });
    localStorage.setItem('token', token);
  },

  login: async (email: string, password: string) => {
    const response = await authApi.login({ email, password });

    if (response.success) {
      const { user, token } = response.data;

      // Store in state
      set({ user, token, isLoading: false });

      // Persist to localStorage
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
    }
  },

  register: async (username: string, email: string, password: string) => {
    const response = await authApi.register({ username, email, password });

    if (response.success) {
      const { user, token } = response.data;

      // Store in state
      set({ user, token, isLoading: false });

      // Persist to localStorage
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
    }
  },

  logout: () => {
    // Call API logout (best effort, don't await)
    authApi.logout().catch(() => {
      // Ignore errors on logout
    });

    // Clear state
    set({ user: null, token: null });

    // Clear localStorage (API client also does this, but be explicit)
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  restoreSession: () => {
    const token = localStorage.getItem('token');
    const userJson = localStorage.getItem('user');

    if (token && userJson) {
      try {
        const user = JSON.parse(userJson) as User;
        set({ user, token, isLoading: false });
      } catch {
        // Invalid user data, clear everything
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        set({ isLoading: false });
      }
    } else {
      // No session to restore
      set({ isLoading: false });
    }
  },
}));

// Export hook alias for convenience
export const useAuth = useAuthStore;
