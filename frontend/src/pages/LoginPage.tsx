import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Alert } from '../components/ui/Alert';
import logo from '../assets/logo.svg';
import api from '../services/api';
import { authenticateWithPasskey, isPasskeySupported } from '../utils/passkeys';
import { useAuthStore } from '../stores/authStore';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const navigate = useNavigate();
  const setUser = useAuthStore((state) => state.setUser);
  const setToken = useAuthStore((state) => state.setToken);

  const [apiError, setApiError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState('');
  const [passkeySupported, setPasskeySupported] = useState(false);
  const [isPasskeyLoading, setIsPasskeyLoading] = useState(false);
  const [showPasskeyEmailInput, setShowPasskeyEmailInput] = useState(false);
  const [passkeyEmail, setPasskeyEmail] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    mode: 'onBlur',
  });

  // Check passkey support on mount
  useEffect(() => {
    setPasskeySupported(isPasskeySupported());
  }, []);

  const onSubmit = async (data: LoginFormData) => {
    setApiError(null);
    setIsLoading(true);

    try {
      // Check if email exists
      const checkResponse = await api.get('/auth/check-email', {
        params: { email: data.email },
      });

      if (!checkResponse.data.exists) {
        // New user - show error message
        setApiError('No account found with this email. Please sign up first.');
        setIsLoading(false);
        return;
      }

      // Existing user - send login link
      await api.post('/auth/magic-link/request', { email: data.email });
      setSubmittedEmail(data.email);
      setEmailSent(true);
    } catch (error) {
      if (error instanceof Error) {
        setApiError(error.message);
      } else {
        setApiError('Failed to send login link. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasskeyLogin = async () => {
    if (!passkeyEmail.trim()) {
      setApiError('Please enter your email address.');
      return;
    }

    setApiError(null);
    setIsPasskeyLoading(true);

    try {
      const result = await authenticateWithPasskey(passkeyEmail);

      if (result.success && result.user && result.token) {
        setUser(result.user);
        setToken(result.token);
        navigate('/dashboard');
      } else {
        setApiError(result.error || 'Failed to authenticate with passkey.');
      }
    } catch (error) {
      console.error('Passkey login error:', error);
      setApiError('An unexpected error occurred. Please try again.');
    } finally {
      setIsPasskeyLoading(false);
    }
  };

  if (emailSent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div>
            <img
              src={logo}
              alt="Annie's Health Journal Logo"
              className="mx-auto h-16 w-auto"
            />
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              Check your email
            </h2>
            <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-6">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg
                    className="h-6 w-6 text-green-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 19v-8.93a2 2 0 01.89-1.664l7-4.666a2 2 0 012.22 0l7 4.666A2 2 0 0121 10.07V19M3 19a2 2 0 002 2h14a2 2 0 002-2M3 19l6.75-4.5M21 19l-6.75-4.5M3 10l6.75 4.5M21 10l-6.75 4.5m0 0l-1.14.76a2 2 0 01-2.22 0l-1.14-.76"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-green-800">
                    Login link sent!
                  </h3>
                  <div className="mt-2 text-sm text-green-700">
                    <p>
                      We sent a login link to <strong>{submittedEmail}</strong>
                    </p>
                    <p className="mt-2">
                      Click the link in the email to sign in. The link will expire in 15 minutes.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Didn&apos;t receive the email?{' '}
                <button
                  onClick={() => setEmailSent(false)}
                  className="font-medium text-primary-600 hover:text-primary-500"
                >
                  Try again
                </button>
              </p>
              <p className="mt-2 text-xs text-gray-500">
                Check your spam folder if you don&apos;t see it
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <img
            src={logo}
            alt="Annie's Health Journal Logo"
            className="mx-auto h-16 w-auto"
          />
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign in to Annie&apos;s Health Journal
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {passkeySupported
              ? 'Sign in with a passkey or email link'
              : 'Enter your email and we\'ll send you a login link'}
          </p>
        </div>

        {/* Passkey login section */}
        {passkeySupported && (
          <>
            {apiError && <Alert type="error">{apiError}</Alert>}

            <div className="mt-8 space-y-4">
              {!showPasskeyEmailInput ? (
                <Button
                  type="button"
                  fullWidth
                  variant="primary"
                  onClick={() => setShowPasskeyEmailInput(true)}
                >
                  🔑 Sign in with passkey
                </Button>
              ) : (
                <div className="space-y-3">
                  <Input
                    id="passkey-email"
                    type="email"
                    label="Email address"
                    placeholder="you@example.com"
                    value={passkeyEmail}
                    onChange={(e) => setPasskeyEmail(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handlePasskeyLogin();
                      }
                    }}
                  />
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      fullWidth
                      variant="primary"
                      loading={isPasskeyLoading}
                      disabled={isPasskeyLoading}
                      onClick={handlePasskeyLogin}
                    >
                      {isPasskeyLoading ? 'Authenticating...' : 'Continue'}
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      disabled={isPasskeyLoading}
                      onClick={() => {
                        setShowPasskeyEmailInput(false);
                        setPasskeyEmail('');
                        setApiError(null);
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Divider */}
            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-gray-50 text-gray-500">or</span>
                </div>
              </div>
            </div>
          </>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          {!passkeySupported && apiError && <Alert type="error">{apiError}</Alert>}

          <div className="rounded-md shadow-sm space-y-4">
            <Input
              {...register('email')}
              id="email"
              type="email"
              label="Email address"
              placeholder="you@example.com"
              autoComplete="email"
              error={errors.email?.message}
            />
          </div>

          <div className="space-y-4">
            <Button
              type="submit"
              fullWidth
              loading={isLoading}
              disabled={isLoading}
            >
              {isLoading ? 'Sending...' : 'Send login link'}
            </Button>

            <div className="text-center">
              <p className="text-sm text-gray-600">
                Don&apos;t have an account?{' '}
                <Link
                  to="/register"
                  className="font-medium text-primary-600 hover:text-primary-500"
                >
                  Sign up
                </Link>
              </p>
            </div>
          </div>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-gray-50 text-gray-500">
                  No password needed
                </span>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
