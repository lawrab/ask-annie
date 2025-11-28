import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { useAuthStore } from '../stores/authStore';
import api from '../services/api';
import logo from '../assets/logo.svg';

export default function MagicLinkVerifyPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const setUser = useAuthStore((state) => state.setUser);
  const setToken = useAuthStore((state) => state.setToken);

  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [errorMessage, setErrorMessage] = useState('');

  // Use ref to prevent double execution in React StrictMode
  const verificationAttempted = useRef(false);

  useEffect(() => {
    // Skip if verification already attempted
    if (verificationAttempted.current) return;
    verificationAttempted.current = true;

    const verifyToken = async () => {
      const token = searchParams.get('token');

      if (!token) {
        setStatus('error');
        setErrorMessage('No token provided. Please request a new magic link.');
        return;
      }

      try {
        const response = await api.post('/auth/magic-link/verify', { token });

        if (response.data.success && response.data.data) {
          // Set user and token in auth store
          setUser(response.data.data.user);
          setToken(response.data.data.token);

          setStatus('success');

          // Redirect to dashboard after a short delay
          setTimeout(() => {
            navigate('/dashboard');
          }, 1500);
        } else {
          setStatus('error');
          setErrorMessage('Invalid response from server. Please try again.');
        }
      } catch (error) {
        setStatus('error');
        if (error instanceof Error) {
          setErrorMessage(error.message);
        } else {
          setErrorMessage('Invalid or expired magic link. Please request a new one.');
        }
      }
    };

    verifyToken();
  }, [searchParams, navigate, setUser, setToken]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <img
            src={logo}
            alt="Annie's Health Journal Logo"
            className="mx-auto h-16 w-auto"
          />

          {status === 'verifying' && (
            <div className="mt-6 text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
              <h2 className="mt-6 text-center text-2xl font-bold text-gray-900">
                Verifying your magic link...
              </h2>
              <p className="mt-2 text-sm text-gray-600">
                Please wait while we sign you in
              </p>
            </div>
          )}

          {status === 'success' && (
            <div className="mt-6">
              <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                <div className="flex items-center justify-center">
                  <div className="flex-shrink-0">
                    <svg
                      className="h-12 w-12 text-green-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                </div>
                <h2 className="mt-4 text-center text-2xl font-bold text-gray-900">
                  Successfully signed in!
                </h2>
                <p className="mt-2 text-center text-sm text-gray-600">
                  Redirecting you to the dashboard...
                </p>
              </div>
            </div>
          )}

          {status === 'error' && (
            <div className="mt-6">
              <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                <div className="flex items-center justify-center">
                  <div className="flex-shrink-0">
                    <svg
                      className="h-12 w-12 text-red-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                </div>
                <h2 className="mt-4 text-center text-2xl font-bold text-gray-900">
                  Verification failed
                </h2>
                <p className="mt-2 text-center text-sm text-gray-600">
                  {errorMessage}
                </p>
                <div className="mt-6 text-center">
                  <button
                    onClick={() => navigate('/login')}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                  >
                    Request a new magic link
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
