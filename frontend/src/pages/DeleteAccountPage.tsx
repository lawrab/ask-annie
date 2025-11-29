import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Alert } from '../components/ui/Alert';
import apiClient from '../services/api';

export default function DeleteAccountPage() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const [searchParams] = useSearchParams();

  // Get token from URL if present
  const tokenFromUrl = searchParams.get('token');

  const [deletionToken, setDeletionToken] = useState(tokenFromUrl || '');
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDeleted, setIsDeleted] = useState(false);

  // If not authenticated, redirect to login
  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  const handleDeleteAccount = async () => {
    if (!deletionToken.trim()) {
      setError('Please enter your deletion confirmation token');
      return;
    }

    try {
      setIsDeleting(true);
      setError(null);

      const response = await apiClient.delete('/user/account', {
        data: { deletionToken: deletionToken.trim() },
      });

      if (response.data.success) {
        setIsDeleted(true);
        // Logout and redirect after 3 seconds
        setTimeout(() => {
          logout();
          navigate('/login');
        }, 3000);
      } else {
        setError(response.data.error || 'Failed to delete account. Please try again.');
      }
    } catch (error) {
      console.error('Deletion error:', error);
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { data?: { error?: string } } };
        if (axiosError.response?.data?.error) {
          setError(axiosError.response.data.error);
        } else {
          setError('Failed to delete account. Please try again.');
        }
      } else {
        setError('Failed to delete account. Please try again.');
      }
    } finally {
      setIsDeleting(false);
    }
  };

  if (!user) {
    return null; // Will redirect to login
  }

  if (isDeleted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card variant="default" className="max-w-md w-full p-8">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
              <svg
                className="h-6 w-6 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Account Deleted</h1>
            <p className="text-gray-600 mb-4">
              Your account and all associated data have been permanently deleted.
            </p>
            <p className="text-sm text-gray-500">
              You will be redirected to the login page in a few seconds...
            </p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-red-600 text-white shadow-md">
        <div className="container mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold">Delete Account</h1>
              <p className="text-red-100">Confirm account deletion</p>
            </div>
            <Button onClick={() => navigate('/settings')} variant="secondary" size="small">
              Cancel
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <Card variant="default" className="p-6 border-red-200">
            {/* Warning Banner */}
            <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg
                    className="h-5 w-5 text-red-500"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">
                    Warning: This action cannot be undone
                  </h3>
                  <div className="mt-2 text-sm text-red-700">
                    <p>
                      You are about to permanently delete your account and all associated data.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* What will be deleted */}
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">
                This will permanently delete:
              </h2>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-start">
                  <svg
                    className="h-5 w-5 text-red-500 mr-2 mt-0.5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span>Your account information ({user.email})</span>
                </li>
                <li className="flex items-start">
                  <svg
                    className="h-5 w-5 text-red-500 mr-2 mt-0.5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span>All check-in records</span>
                </li>
                <li className="flex items-start">
                  <svg
                    className="h-5 w-5 text-red-500 mr-2 mt-0.5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span>Symptom tracking history</span>
                </li>
                <li className="flex items-start">
                  <svg
                    className="h-5 w-5 text-red-500 mr-2 mt-0.5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span>Activity and trigger data</span>
                </li>
              </ul>
            </div>

            {/* Token Input */}
            <div className="mb-6">
              <label
                htmlFor="deletionToken"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Deletion Confirmation Token
              </label>
              <p className="text-sm text-gray-600 mb-3">
                Enter the confirmation token from the email we sent you. The token expires in 15
                minutes.
              </p>
              <input
                type="text"
                id="deletionToken"
                value={deletionToken}
                onChange={(e) => setDeletionToken(e.target.value)}
                placeholder="Paste your deletion token here"
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500 font-mono text-sm"
                disabled={isDeleting}
              />
            </div>

            {/* Error Display */}
            {error && (
              <Alert type="error" className="mb-6">
                {error}
              </Alert>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button
                onClick={handleDeleteAccount}
                variant="danger"
                size="medium"
                disabled={isDeleting || !deletionToken.trim()}
              >
                {isDeleting ? 'Deleting Account...' : 'Permanently Delete My Account'}
              </Button>
              <Button
                onClick={() => navigate('/settings')}
                variant="secondary"
                size="medium"
                disabled={isDeleting}
              >
                Cancel
              </Button>
            </div>
          </Card>

          {/* Help Text */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Need help?{' '}
              <button
                onClick={() => navigate('/settings')}
                className="text-indigo-600 hover:text-indigo-700 font-medium"
              >
                Return to Settings
              </button>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
