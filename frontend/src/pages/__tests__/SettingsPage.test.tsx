import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import SettingsPage from '../SettingsPage';
import { useAuthStore } from '../../stores/authStore';
import { userApi } from '../../services/api';

// Mock the API
vi.mock('../../services/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    delete: vi.fn(),
  },
  userApi: {
    exportData: vi.fn(),
    requestDeletion: vi.fn(),
  },
}));

// Mock the auth store
vi.mock('../../stores/authStore', () => ({
  useAuthStore: vi.fn(),
}));

// Mock navigation
const mockNavigate = vi.fn();
vi.mock('react-router', async () => {
  const actual = await vi.importActual('react-router');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('SettingsPage', () => {
  // Store original methods to restore after each test
  const originalCreateObjectURL = global.URL.createObjectURL;
  const originalRevokeObjectURL = global.URL.revokeObjectURL;
  const originalAppendChild = document.body.appendChild;
  const originalRemoveChild = document.body.removeChild;
  const mockLogout = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    // Set up auth store mock with selector support
    const mockState = {
      user: {
        id: 'user123',
        username: 'testuser',
        email: 'test@example.com',
        notificationTimes: [],
        notificationsEnabled: true,
        createdAt: '2024-01-01',
      },
      logout: mockLogout,
    };

    vi.mocked(useAuthStore).mockImplementation((selector: any) =>
      selector ? selector(mockState) : mockState
    );
  });

  afterEach(() => {
    cleanup();
    // Restore global methods
    global.URL.createObjectURL = originalCreateObjectURL;
    global.URL.revokeObjectURL = originalRevokeObjectURL;
    document.body.appendChild = originalAppendChild;
    document.body.removeChild = originalRemoveChild;
  });

  it('should render settings page with user information', () => {
    render(
      <MemoryRouter>
        <SettingsPage />
      </MemoryRouter>
    );

    expect(screen.getByText('Settings')).toBeInTheDocument();
    expect(screen.getByText('Account Information')).toBeInTheDocument();
    expect(screen.getByText('testuser')).toBeInTheDocument();
    expect(screen.getByText('test@example.com')).toBeInTheDocument();
  });

  it('should render data & privacy section', () => {
    render(
      <MemoryRouter>
        <SettingsPage />
      </MemoryRouter>
    );

    expect(screen.getByText('Data & Privacy')).toBeInTheDocument();
    expect(screen.getByText('Export Your Data')).toBeInTheDocument();
    expect(screen.getByText('Delete Account')).toBeInTheDocument();
  });

  it('should have navigation buttons', () => {
    render(
      <MemoryRouter>
        <SettingsPage />
      </MemoryRouter>
    );

    expect(screen.getByRole('button', { name: /dashboard/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /trends/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /logout/i })).toBeInTheDocument();
  });

  describe('Export Data', () => {
    it('should export data when export button is clicked', async () => {
      const user = userEvent.setup();
      const mockExportData = {
        exportDate: '2024-01-01',
        exportVersion: '1.0.0',
        user: {
          id: 'user123',
          username: 'testuser',
          email: 'test@example.com',
          createdAt: '2024-01-01',
          updatedAt: '2024-01-01',
          notificationTimes: [],
          notificationsEnabled: true,
        },
        checkIns: [],
        symptoms: [],
        activities: [],
        triggers: [],
        statistics: {
          totalCheckIns: 0,
          totalSymptoms: 0,
          totalActivities: 0,
          totalTriggers: 0,
          accountAgeDays: 0,
          firstCheckIn: null,
          lastCheckIn: null,
        },
      };

      vi.mocked(userApi.exportData).mockResolvedValue(mockExportData);

      // Mock URL.createObjectURL and document methods
      global.URL.createObjectURL = vi.fn(() => 'blob:url');
      global.URL.revokeObjectURL = vi.fn();
      const mockClick = vi.fn();
      HTMLAnchorElement.prototype.click = mockClick;

      render(
        <MemoryRouter>
          <SettingsPage />
        </MemoryRouter>
      );

      const exportButton = screen.getByRole('button', { name: /export data/i });
      await user.click(exportButton);

      await waitFor(() => {
        expect(userApi.exportData).toHaveBeenCalled();
        expect(screen.getByText(/data has been exported successfully/i)).toBeInTheDocument();
      });
    });

    it('should show error message if export fails', async () => {
      const user = userEvent.setup();
      vi.mocked(userApi.exportData).mockRejectedValue(new Error('Export failed'));

      render(
        <MemoryRouter>
          <SettingsPage />
        </MemoryRouter>
      );

      const exportButton = screen.getByRole('button', { name: /export data/i });
      await user.click(exportButton);

      await waitFor(() => {
        expect(screen.getByText(/failed to export data/i)).toBeInTheDocument();
      });
    });
  });

  describe('Delete Account', () => {
    it('should show confirmation dialog when delete button is clicked', async () => {
      const user = userEvent.setup();

      render(
        <MemoryRouter>
          <SettingsPage />
        </MemoryRouter>
      );

      const deleteButton = screen.getByRole('button', { name: /delete my account/i });
      await user.click(deleteButton);

      expect(screen.getByText(/are you sure you want to delete your account/i)).toBeInTheDocument();
      // Use getAllByText since this text appears in multiple places
      const accountInfoElements = screen.getAllByText(/your account information/i);
      expect(accountInfoElements.length).toBeGreaterThan(0);
      expect(screen.getByText(/all check-in records/i)).toBeInTheDocument();
    });

    it('should send deletion request when confirmed', async () => {
      const user = userEvent.setup();
      vi.mocked(userApi.requestDeletion).mockResolvedValue({
        success: true,
        message: 'Deletion request sent',
      });

      render(
        <MemoryRouter>
          <SettingsPage />
        </MemoryRouter>
      );

      // Click delete button
      const deleteButton = screen.getByRole('button', { name: /delete my account/i });
      await user.click(deleteButton);

      // Confirm deletion
      const confirmButton = screen.getByRole('button', { name: /yes, send confirmation email/i });
      await user.click(confirmButton);

      await waitFor(() => {
        expect(userApi.requestDeletion).toHaveBeenCalled();
        expect(screen.getByText(/check your email/i)).toBeInTheDocument();
      });
    });

    it('should cancel deletion when cancel button is clicked', async () => {
      const user = userEvent.setup();

      render(
        <MemoryRouter>
          <SettingsPage />
        </MemoryRouter>
      );

      // Click delete button
      const deleteButton = screen.getByRole('button', { name: /delete my account/i });
      await user.click(deleteButton);

      // Cancel deletion
      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);

      await waitFor(() => {
        expect(
          screen.queryByText(/are you sure you want to delete your account/i)
        ).not.toBeInTheDocument();
      });
    });

    it('should show error message if deletion request fails', async () => {
      const user = userEvent.setup();
      vi.mocked(userApi.requestDeletion).mockRejectedValue(new Error('Request failed'));

      render(
        <MemoryRouter>
          <SettingsPage />
        </MemoryRouter>
      );

      // Click delete button
      const deleteButton = screen.getByRole('button', { name: /delete my account/i });
      await user.click(deleteButton);

      // Confirm deletion
      const confirmButton = screen.getByRole('button', { name: /yes, send confirmation email/i });
      await user.click(confirmButton);

      await waitFor(() => {
        expect(screen.getByText(/failed to request account deletion/i)).toBeInTheDocument();
      });
    });

    it('should navigate to delete account page when "Enter it here" is clicked', async () => {
      const user = userEvent.setup();

      render(
        <MemoryRouter>
          <SettingsPage />
        </MemoryRouter>
      );

      const enterTokenLink = screen.getByRole('button', { name: /enter it here/i });
      await user.click(enterTokenLink);

      expect(mockNavigate).toHaveBeenCalledWith('/account/delete');
    });

    it('should navigate to delete account page after successful deletion request', async () => {
      const user = userEvent.setup();
      vi.mocked(userApi.requestDeletion).mockResolvedValue({
        success: true,
        message: 'Deletion request sent',
      });

      render(
        <MemoryRouter>
          <SettingsPage />
        </MemoryRouter>
      );

      // Click delete button
      const deleteButton = screen.getByRole('button', { name: /delete my account/i });
      await user.click(deleteButton);

      // Confirm deletion
      const confirmButton = screen.getByRole('button', { name: /yes, send confirmation email/i });
      await user.click(confirmButton);

      await waitFor(() => {
        expect(screen.getByText(/check your email/i)).toBeInTheDocument();
      });

      // Click "Enter Deletion Token" button
      const enterTokenButton = screen.getByRole('button', { name: /enter deletion token/i });
      await user.click(enterTokenButton);

      expect(mockNavigate).toHaveBeenCalledWith('/account/delete');
    });
  });

  describe('Navigation', () => {
    it('should navigate to dashboard when dashboard button is clicked', async () => {
      const user = userEvent.setup();

      render(
        <MemoryRouter>
          <SettingsPage />
        </MemoryRouter>
      );

      const dashboardButton = screen.getByRole('button', { name: /dashboard/i });
      await user.click(dashboardButton);

      expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    });

    it('should navigate to trends when trends button is clicked', async () => {
      const user = userEvent.setup();

      render(
        <MemoryRouter>
          <SettingsPage />
        </MemoryRouter>
      );

      const trendsButton = screen.getByRole('button', { name: /trends/i });
      await user.click(trendsButton);

      expect(mockNavigate).toHaveBeenCalledWith('/trends');
    });

    it('should logout and navigate to login when logout button is clicked', async () => {
      const user = userEvent.setup();

      render(
        <MemoryRouter>
          <SettingsPage />
        </MemoryRouter>
      );

      const logoutButton = screen.getByRole('button', { name: /logout/i });
      await user.click(logoutButton);

      expect(mockLogout).toHaveBeenCalled();
      expect(mockNavigate).toHaveBeenCalledWith('/login');
    });
  });
});
