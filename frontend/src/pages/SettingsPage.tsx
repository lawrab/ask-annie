import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useAuthStore } from '../stores/authStore';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Alert } from '../components/ui/Alert';
import { userApi, passkeysApi, type Passkey } from '../services/api';
import {
  registerPasskey,
  isPasskeySupported,
  isPlatformAuthenticatorAvailable,
  getBrowserDeviceName,
} from '../utils/passkeys';
import { Header } from '../components/Header';
import { UserStatsCard } from '../components/UserStatsCard';

export default function SettingsPage() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);

  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [exportSuccess, setExportSuccess] = useState(false);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isRequestingDeletion, setIsRequestingDeletion] = useState(false);
  const [deletionRequestError, setDeletionRequestError] = useState<string | null>(null);
  const [deletionRequestSuccess, setDeletionRequestSuccess] = useState(false);

  // Passkey state
  const [passkeys, setPasskeys] = useState<Passkey[]>([]);
  const [isLoadingPasskeys, setIsLoadingPasskeys] = useState(true);
  const [passkeySupported, setPasskeySupported] = useState(false);
  const [platformAuthAvailable, setPlatformAuthAvailable] = useState(false);
  const [isAddingPasskey, setIsAddingPasskey] = useState(false);
  const [passkeyError, setPasskeyError] = useState<string | null>(null);
  const [passkeySuccess, setPasskeySuccess] = useState<string | null>(null);
  const [editingPasskeyId, setEditingPasskeyId] = useState<string | null>(null);
  const [editingDeviceName, setEditingDeviceName] = useState('');

  // Load passkeys and check browser support on mount
  useEffect(() => {
    const init = async () => {
      // Check browser support
      setPasskeySupported(isPasskeySupported());
      const platformAuth = await isPlatformAuthenticatorAvailable();
      setPlatformAuthAvailable(platformAuth);

      // Load passkeys
      try {
        const response = await passkeysApi.list();
        if (response.success) {
          setPasskeys(response.data);
        }
      } catch (error) {
        console.error('Failed to load passkeys:', error);
      } finally {
        setIsLoadingPasskeys(false);
      }
    };

    init();
  }, []);

  const handleExportData = async () => {
    try {
      setIsExporting(true);
      setExportError(null);
      setExportSuccess(false);

      const response = await userApi.exportData();

      // Backend returns data directly, not wrapped in {success, data}
      if (response && response.exportDate) {
        // Create a blob from the JSON data
        const blob = new Blob([JSON.stringify(response, null, 2)], {
          type: 'application/json',
        });

        // Create download link
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;

        // Use filename from response or create default
        const filename = `annies-health-journal-data-${new Date().toISOString().split('T')[0]}.json`;
        link.setAttribute('download', filename);

        // Trigger download
        document.body.appendChild(link);
        link.click();

        // Cleanup
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

        setExportSuccess(true);
      } else {
        setExportError('Failed to export data. Please try again.');
      }
    } catch (error) {
      console.error('Export error:', error);
      setExportError('Failed to export data. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleRequestDeletion = async () => {
    try {
      setIsRequestingDeletion(true);
      setDeletionRequestError(null);
      setDeletionRequestSuccess(false);

      const response = await userApi.requestDeletion();

      if (response.success) {
        setDeletionRequestSuccess(true);
        setShowDeleteConfirm(false);
      } else {
        setDeletionRequestError(response.error || 'Failed to request account deletion.');
      }
    } catch (error) {
      console.error('Deletion request error:', error);
      setDeletionRequestError('Failed to request account deletion. Please try again.');
    } finally {
      setIsRequestingDeletion(false);
    }
  };

  const handleAddPasskey = async () => {
    try {
      setIsAddingPasskey(true);
      setPasskeyError(null);
      setPasskeySuccess(null);

      const deviceName = getBrowserDeviceName();
      const result = await registerPasskey(deviceName);

      if (result.success) {
        setPasskeySuccess('Passkey added successfully!');
        // Reload passkeys
        const response = await passkeysApi.list();
        if (response.success) {
          setPasskeys(response.data);
        }
      } else {
        setPasskeyError(result.error || 'Failed to add passkey.');
      }
    } catch (error) {
      console.error('Add passkey error:', error);
      setPasskeyError('An unexpected error occurred. Please try again.');
    } finally {
      setIsAddingPasskey(false);
    }
  };

  const handleDeletePasskey = async (id: string) => {
    if (!confirm('Are you sure you want to delete this passkey?')) {
      return;
    }

    try {
      setPasskeyError(null);
      setPasskeySuccess(null);

      const response = await passkeysApi.delete(id);
      if (response.success) {
        setPasskeySuccess('Passkey deleted successfully!');
        setPasskeys(passkeys.filter((p) => p.id !== id));
      } else {
        setPasskeyError(response.message || 'Failed to delete passkey.');
      }
    } catch (error) {
      console.error('Delete passkey error:', error);
      setPasskeyError('Failed to delete passkey. Please try again.');
    }
  };

  const handleUpdatePasskeyName = async (id: string, newName: string) => {
    try {
      setPasskeyError(null);
      setPasskeySuccess(null);

      const response = await passkeysApi.updateDeviceName(id, newName);
      if (response.success) {
        setPasskeySuccess('Passkey name updated successfully!');
        setPasskeys(passkeys.map((p) => (p.id === id ? response.data : p)));
        setEditingPasskeyId(null);
        setEditingDeviceName('');
      } else {
        setPasskeyError('Failed to update passkey name.');
      }
    } catch (error) {
      console.error('Update passkey error:', error);
      setPasskeyError('Failed to update passkey name. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header currentPage="settings" title="Settings" subtitle="Manage your account and privacy" />

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Account Information */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Account Information</h2>
            <Card variant="default" className="p-6">
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-700">Username</label>
                  <p className="text-gray-900">{user?.username}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Email</label>
                  <p className="text-gray-900">{user?.email}</p>
                </div>
              </div>
            </Card>
          </section>

          {/* User Activity Stats */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Your Activity</h2>
            <UserStatsCard />
          </section>

          {/* Security */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Security</h2>

            <Card variant="default" className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Passkeys</h3>
              <p className="text-gray-600 mb-4">
                Passkeys provide secure, passwordless authentication using Face ID, Touch ID, or
                your device&apos;s security features.
              </p>

              {/* Browser support warning */}
              {!passkeySupported && (
                <Alert type="error" className="mb-4">
                  Passkeys are not supported in your current browser. Please use a modern browser
                  like Chrome, Safari, or Edge.
                </Alert>
              )}

              {/* Platform authenticator info */}
              {passkeySupported && !platformAuthAvailable && (
                <Alert type="warning" className="mb-4">
                  Your device may not support biometric authentication. You can still use
                  security keys.
                </Alert>
              )}

              {/* Success/Error messages */}
              {passkeySuccess && (
                <Alert type="success" className="mb-4">
                  {passkeySuccess}
                </Alert>
              )}

              {passkeyError && (
                <Alert type="error" className="mb-4">
                  {passkeyError}
                </Alert>
              )}

              {/* Passkey list */}
              {isLoadingPasskeys ? (
                <div className="text-gray-600 mb-4">Loading passkeys...</div>
              ) : passkeys.length > 0 ? (
                <div className="space-y-3 mb-4">
                  {passkeys.map((passkey) => (
                    <div
                      key={passkey.id}
                      className="border border-gray-200 rounded-lg p-4 flex items-center justify-between"
                    >
                      <div className="flex-1">
                        {editingPasskeyId === passkey.id ? (
                          <div className="flex gap-2 items-center">
                            <input
                              type="text"
                              value={editingDeviceName}
                              onChange={(e) => setEditingDeviceName(e.target.value)}
                              className="px-3 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                              placeholder="Device name"
                            />
                            <Button
                              onClick={() => handleUpdatePasskeyName(passkey.id, editingDeviceName)}
                              variant="primary"
                              size="small"
                            >
                              Save
                            </Button>
                            <Button
                              onClick={() => {
                                setEditingPasskeyId(null);
                                setEditingDeviceName('');
                              }}
                              variant="secondary"
                              size="small"
                            >
                              Cancel
                            </Button>
                          </div>
                        ) : (
                          <>
                            <p className="font-medium text-gray-900">{passkey.deviceName}</p>
                            <div className="flex gap-4 text-sm text-gray-600 mt-1">
                              <span>
                                Created:{' '}
                                {new Date(passkey.createdAt).toLocaleDateString(undefined, {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric',
                                })}
                              </span>
                              <span>
                                Last used:{' '}
                                {new Date(passkey.lastUsedAt).toLocaleDateString(undefined, {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric',
                                })}
                              </span>
                            </div>
                          </>
                        )}
                      </div>
                      {editingPasskeyId !== passkey.id && (
                        <div className="flex gap-2 ml-4">
                          <Button
                            onClick={() => {
                              setEditingPasskeyId(passkey.id);
                              setEditingDeviceName(passkey.deviceName);
                            }}
                            variant="secondary"
                            size="small"
                          >
                            Rename
                          </Button>
                          <Button
                            onClick={() => handleDeletePasskey(passkey.id)}
                            variant="danger"
                            size="small"
                          >
                            Delete
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-600 mb-4">No passkeys registered yet.</p>
              )}

              {/* Add passkey button */}
              {passkeySupported && (
                <Button
                  onClick={handleAddPasskey}
                  variant="primary"
                  size="medium"
                  disabled={isAddingPasskey}
                >
                  {isAddingPasskey ? 'Adding Passkey...' : 'Add Passkey'}
                </Button>
              )}
            </Card>
          </section>

          {/* Data & Privacy */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Data & Privacy</h2>

            {/* Export Data */}
            <Card variant="default" className="p-6 mb-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Export Your Data</h3>
              <p className="text-gray-600 mb-4">
                Download all your health data in JSON format. This includes your account
                information, check-ins, symptoms, and statistics.
              </p>

              {exportSuccess && (
                <Alert type="success" className="mb-4">
                  Your data has been exported successfully!
                </Alert>
              )}

              {exportError && (
                <Alert type="error" className="mb-4">
                  {exportError}
                </Alert>
              )}

              <Button
                onClick={handleExportData}
                variant="primary"
                size="medium"
                disabled={isExporting}
              >
                {isExporting ? 'Exporting...' : 'Export Data'}
              </Button>
            </Card>

            {/* Delete Account */}
            <Card variant="default" className="p-6 border-red-200">
              <h3 className="text-lg font-semibold text-red-900 mb-2">Delete Account</h3>
              <p className="text-gray-600 mb-4">
                Permanently delete your account and all associated data. This action cannot be
                undone. You will receive a confirmation email before deletion is completed.
              </p>

              {deletionRequestSuccess && (
                <Alert type="success" className="mb-4">
                  <p className="mb-2">
                    Check your email for the account deletion confirmation token. The token will
                    expire in 15 minutes.
                  </p>
                  <Button
                    onClick={() => navigate('/account/delete')}
                    variant="primary"
                    size="small"
                    className="mt-2"
                  >
                    Enter Deletion Token
                  </Button>
                </Alert>
              )}

              {deletionRequestError && (
                <Alert type="error" className="mb-4">
                  {deletionRequestError}
                </Alert>
              )}

              {!showDeleteConfirm ? (
                <Button
                  onClick={() => setShowDeleteConfirm(true)}
                  variant="danger"
                  size="medium"
                >
                  Delete My Account
                </Button>
              ) : (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 space-y-4">
                  <div>
                    <p className="font-semibold text-red-900 mb-2">
                      Are you sure you want to delete your account?
                    </p>
                    <p className="text-sm text-red-700 mb-2">
                      This will permanently delete:
                    </p>
                    <ul className="text-sm text-red-700 list-disc list-inside mb-4 space-y-1">
                      <li>Your account information</li>
                      <li>All check-in records</li>
                      <li>Symptom tracking history</li>
                      <li>Activity and trigger data</li>
                    </ul>
                    <p className="text-sm text-red-700">
                      You will receive a confirmation email to complete the deletion process.
                    </p>
                  </div>

                  <div className="flex gap-3">
                    <Button
                      onClick={handleRequestDeletion}
                      variant="danger"
                      size="medium"
                      disabled={isRequestingDeletion}
                    >
                      {isRequestingDeletion
                        ? 'Sending Confirmation...'
                        : 'Yes, Send Confirmation Email'}
                    </Button>
                    <Button
                      onClick={() => {
                        setShowDeleteConfirm(false);
                        setDeletionRequestError(null);
                      }}
                      variant="secondary"
                      size="medium"
                      disabled={isRequestingDeletion}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}

              {/* Helper text for users with existing token */}
              {!showDeleteConfirm && !deletionRequestSuccess && (
                <p className="text-sm text-gray-600 mt-4">
                  Already have a deletion token?{' '}
                  <button
                    onClick={() => navigate('/account/delete')}
                    className="text-indigo-600 hover:text-indigo-700 font-medium"
                  >
                    Enter it here
                  </button>
                </p>
              )}
            </Card>
          </section>
        </div>
      </main>
    </div>
  );
}
