import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import SettingsPage from '../SettingsPage';
import { useAuthStore } from '../../stores/authStore';
import { userApi, passkeysApi } from '../../services/api';
import {
  isPasskeySupported,
  isPlatformAuthenticatorAvailable,
  registerPasskey,
} from '../../utils/passkeys';

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
  passkeysApi: {
    list: vi.fn(),
    delete: vi.fn(),
    updateDeviceName: vi.fn(),
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

// Mock passkey utilities
vi.mock('../../utils/passkeys', () => ({
  isPasskeySupported: vi.fn(),
  isPlatformAuthenticatorAvailable: vi.fn(),
  registerPasskey: vi.fn(),
  getBrowserDeviceName: vi.fn(() => 'Chrome on Linux'),
}));

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

  it('should have navigation elements', () => {
    render(
      <MemoryRouter>
        <SettingsPage />
      </MemoryRouter>
    );

    expect(screen.getByRole('button', { name: /trends/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /user menu/i })).toBeInTheDocument();
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
    it('should navigate to dashboard when title is clicked', async () => {
      const user = userEvent.setup();

      render(
        <MemoryRouter>
          <SettingsPage />
        </MemoryRouter>
      );

      // SettingsPage has custom title "Settings"
      const title = screen.getByRole('heading', { level: 1 });
      await user.click(title);

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

    it('should logout and navigate to login when logout is clicked from profile menu', async () => {
      const user = userEvent.setup();

      render(
        <MemoryRouter>
          <SettingsPage />
        </MemoryRouter>
      );

      // Open profile dropdown
      const profileButton = screen.getByRole('button', { name: /user menu/i });
      await user.click(profileButton);

      // Click logout in dropdown
      await waitFor(() => {
        expect(screen.getByText('Logout')).toBeInTheDocument();
      });

      const logoutButton = screen.getByText('Logout');
      await user.click(logoutButton);

      expect(mockLogout).toHaveBeenCalled();
      expect(mockNavigate).toHaveBeenCalledWith('/login');
    });
  });

  describe('Passkey Management', () => {
    beforeEach(() => {
      // Default: passkeys supported
      vi.mocked(isPasskeySupported).mockReturnValue(true);
      vi.mocked(isPlatformAuthenticatorAvailable).mockResolvedValue(true);
      vi.mocked(passkeysApi.list).mockResolvedValue({
        success: true,
        data: [],
      });
    });

    it('should render passkey section when passkeys are supported', async () => {
      render(
        <MemoryRouter>
          <SettingsPage />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Security')).toBeInTheDocument();
        expect(screen.getByText('Passkeys')).toBeInTheDocument();
      });
    });

    it('should show "no passkeys" message when user has no passkeys', async () => {
      render(
        <MemoryRouter>
          <SettingsPage />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText(/no passkeys registered yet/i)).toBeInTheDocument();
      });
    });

    it('should list existing passkeys', async () => {
      const mockPasskeys = [
        {
          id: 'passkey1',
          credentialId: 'cred1',
          deviceName: 'Chrome on macOS',
          lastUsedAt: '2024-01-15T00:00:00Z',
          createdAt: '2024-01-01T00:00:00Z',
          transports: ['internal'],
        },
        {
          id: 'passkey2',
          credentialId: 'cred2',
          deviceName: 'Firefox on Linux',
          lastUsedAt: '2024-01-20T00:00:00Z',
          createdAt: '2024-01-10T00:00:00Z',
          transports: ['usb'],
        },
      ];

      vi.mocked(passkeysApi.list).mockResolvedValue({
        success: true,
        data: mockPasskeys,
      });

      render(
        <MemoryRouter>
          <SettingsPage />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Chrome on macOS')).toBeInTheDocument();
        expect(screen.getByText('Firefox on Linux')).toBeInTheDocument();
      });
    });

    it('should add a new passkey when add button is clicked', async () => {
      const user = userEvent.setup();

      vi.mocked(registerPasskey).mockResolvedValue({ success: true });
      vi.mocked(passkeysApi.list).mockResolvedValueOnce({
        success: true,
        data: [],
      });

      const newPasskey = {
        id: 'passkey1',
        credentialId: 'cred1',
        deviceName: 'Chrome on Linux',
        lastUsedAt: '2024-01-01T00:00:00Z',
        createdAt: '2024-01-01T00:00:00Z',
        transports: ['internal'],
      };

      vi.mocked(passkeysApi.list).mockResolvedValueOnce({
        success: true,
        data: [newPasskey],
      });

      render(
        <MemoryRouter>
          <SettingsPage />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText(/no passkeys registered yet/i)).toBeInTheDocument();
      });

      const addButton = screen.getByRole('button', { name: /add passkey/i });
      await user.click(addButton);

      await waitFor(() => {
        expect(registerPasskey).toHaveBeenCalledWith('Chrome on Linux');
        expect(screen.getByText(/passkey added successfully/i)).toBeInTheDocument();
      });
    });

    it('should show error when adding passkey fails', async () => {
      const user = userEvent.setup();

      vi.mocked(registerPasskey).mockResolvedValue({
        success: false,
        error: 'User cancelled registration',
      });

      render(
        <MemoryRouter>
          <SettingsPage />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /add passkey/i })).toBeInTheDocument();
      });

      const addButton = screen.getByRole('button', { name: /add passkey/i });
      await user.click(addButton);

      await waitFor(() => {
        expect(screen.getByText(/user cancelled registration/i)).toBeInTheDocument();
      });
    });

    it('should delete a passkey when delete button is clicked', async () => {
      const user = userEvent.setup();
      const mockConfirm = vi.spyOn(window, 'confirm');
      mockConfirm.mockReturnValue(true);

      const mockPasskey = {
        id: 'passkey1',
        credentialId: 'cred1',
        deviceName: 'Chrome on macOS',
        lastUsedAt: '2024-01-01T00:00:00Z',
        createdAt: '2024-01-01T00:00:00Z',
        transports: ['internal'],
      };

      vi.mocked(passkeysApi.list).mockResolvedValue({
        success: true,
        data: [mockPasskey],
      });

      vi.mocked(passkeysApi.delete).mockResolvedValue({
        success: true,
        message: 'Passkey deleted',
      });

      render(
        <MemoryRouter>
          <SettingsPage />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Chrome on macOS')).toBeInTheDocument();
      });

      // Get delete buttons and find the one for passkeys (not account deletion)
      const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
      const passkeyDeleteButton = deleteButtons[0]; // First delete button is for the passkey
      await user.click(passkeyDeleteButton);

      await waitFor(() => {
        expect(mockConfirm).toHaveBeenCalled();
        expect(passkeysApi.delete).toHaveBeenCalledWith('passkey1');
        expect(screen.getByText(/passkey deleted successfully/i)).toBeInTheDocument();
      });

      mockConfirm.mockRestore();
    });

    it('should not delete passkey when user cancels confirmation', async () => {
      const user = userEvent.setup();
      const mockConfirm = vi.spyOn(window, 'confirm');
      mockConfirm.mockReturnValue(false);

      const mockPasskey = {
        id: 'passkey1',
        credentialId: 'cred1',
        deviceName: 'Chrome on macOS',
        lastUsedAt: '2024-01-01T00:00:00Z',
        createdAt: '2024-01-01T00:00:00Z',
        transports: ['internal'],
      };

      vi.mocked(passkeysApi.list).mockResolvedValue({
        success: true,
        data: [mockPasskey],
      });

      render(
        <MemoryRouter>
          <SettingsPage />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Chrome on macOS')).toBeInTheDocument();
      });

      // Get delete buttons and find the one for passkeys (not account deletion)
      const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
      const passkeyDeleteButton = deleteButtons[0]; // First delete button is for the passkey
      await user.click(passkeyDeleteButton);

      expect(mockConfirm).toHaveBeenCalled();
      expect(passkeysApi.delete).not.toHaveBeenCalled();

      mockConfirm.mockRestore();
    });

    it('should rename a passkey', async () => {
      const user = userEvent.setup();

      const mockPasskey = {
        id: 'passkey1',
        credentialId: 'cred1',
        deviceName: 'Chrome on macOS',
        lastUsedAt: '2024-01-01T00:00:00Z',
        createdAt: '2024-01-01T00:00:00Z',
        transports: ['internal'],
      };

      vi.mocked(passkeysApi.list).mockResolvedValue({
        success: true,
        data: [mockPasskey],
      });

      const updatedPasskey = { ...mockPasskey, deviceName: 'My MacBook Pro' };

      vi.mocked(passkeysApi.updateDeviceName).mockResolvedValue({
        success: true,
        data: updatedPasskey,
      });

      render(
        <MemoryRouter>
          <SettingsPage />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Chrome on macOS')).toBeInTheDocument();
      });

      const renameButton = screen.getByRole('button', { name: /rename/i });
      await user.click(renameButton);

      const input = screen.getByPlaceholderText(/device name/i);
      await user.clear(input);
      await user.type(input, 'My MacBook Pro');

      const saveButton = screen.getByRole('button', { name: /save/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(passkeysApi.updateDeviceName).toHaveBeenCalledWith('passkey1', 'My MacBook Pro');
        expect(screen.getByText(/passkey name updated successfully/i)).toBeInTheDocument();
      });
    });

    it('should cancel rename when cancel button is clicked', async () => {
      const user = userEvent.setup();

      const mockPasskey = {
        id: 'passkey1',
        credentialId: 'cred1',
        deviceName: 'Chrome on macOS',
        lastUsedAt: '2024-01-01T00:00:00Z',
        createdAt: '2024-01-01T00:00:00Z',
        transports: ['internal'],
      };

      vi.mocked(passkeysApi.list).mockResolvedValue({
        success: true,
        data: [mockPasskey],
      });

      render(
        <MemoryRouter>
          <SettingsPage />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Chrome on macOS')).toBeInTheDocument();
      });

      const renameButton = screen.getByRole('button', { name: /rename/i });
      await user.click(renameButton);

      const input = screen.getByPlaceholderText(/device name/i);
      await user.type(input, 'New Name');

      const cancelButton = screen.getAllByRole('button', { name: /cancel/i })[0];
      await user.click(cancelButton);

      await waitFor(() => {
        expect(screen.queryByPlaceholderText(/device name/i)).not.toBeInTheDocument();
        expect(passkeysApi.updateDeviceName).not.toHaveBeenCalled();
      });
    });

    it('should show browser not supported warning when passkeys not supported', async () => {
      vi.mocked(isPasskeySupported).mockReturnValue(false);

      render(
        <MemoryRouter>
          <SettingsPage />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(
          screen.getByText(/passkeys are not supported in your current browser/i)
        ).toBeInTheDocument();
      });

      expect(screen.queryByRole('button', { name: /add passkey/i })).not.toBeInTheDocument();
    });

    it('should show platform authenticator warning when not available', async () => {
      vi.mocked(isPlatformAuthenticatorAvailable).mockResolvedValue(false);

      render(
        <MemoryRouter>
          <SettingsPage />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(
          screen.getByText(/your device may not support biometric authentication/i)
        ).toBeInTheDocument();
      });
    });
  });
});
