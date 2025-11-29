import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useAuthStore } from '../stores/authStore';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Alert } from '../components/ui/Alert';
import { userApi } from '../services/api';

export default function SettingsPage() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [exportSuccess, setExportSuccess] = useState(false);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isRequestingDeletion, setIsRequestingDeletion] = useState(false);
  const [deletionRequestError, setDeletionRequestError] = useState<string | null>(null);
  const [deletionRequestSuccess, setDeletionRequestSuccess] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-indigo-600 text-white shadow-md">
        <div className="container mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold">Settings</h1>
              <p className="text-indigo-100">Manage your account and privacy</p>
            </div>
            <div className="flex gap-3">
              <Button onClick={() => navigate('/dashboard')} variant="secondary" size="small">
                Dashboard
              </Button>
              <Button onClick={() => navigate('/trends')} variant="secondary" size="small">
                Trends
              </Button>
              <Button onClick={handleLogout} variant="secondary" size="small">
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

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
