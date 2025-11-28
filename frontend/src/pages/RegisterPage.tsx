import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link } from 'react-router';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Alert } from '../components/ui/Alert';
import api from '../services/api';
import logo from '../assets/logo.svg';

const emailSchema = z.object({
  email: z.string().email('Invalid email address'),
});

const usernameSchema = z.object({
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(30, 'Username must be at most 30 characters'),
});

type EmailFormData = z.infer<typeof emailSchema>;
type UsernameFormData = z.infer<typeof usernameSchema>;

type RegistrationStep = 'email' | 'username' | 'success';

export default function RegisterPage() {
  const [step, setStep] = useState<RegistrationStep>('email');
  const [email, setEmail] = useState('');
  const [apiError, setApiError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Email form
  const {
    register: registerEmailField,
    handleSubmit: handleEmailSubmit,
    formState: { errors: emailErrors },
  } = useForm<EmailFormData>({
    resolver: zodResolver(emailSchema),
    mode: 'onBlur',
  });

  // Username form
  const {
    register: registerUsernameField,
    handleSubmit: handleUsernameSubmit,
    formState: { errors: usernameErrors },
  } = useForm<UsernameFormData>({
    resolver: zodResolver(usernameSchema),
    mode: 'onBlur',
  });

  const onEmailSubmit = async (data: EmailFormData) => {
    setApiError(null);
    setIsLoading(true);

    try {
      // Check if email already exists
      const response = await api.get('/auth/check-email', {
        params: { email: data.email },
      });

      setEmail(data.email);

      if (response.data.exists) {
        // Existing user - send login link directly
        await api.post('/auth/magic-link/request', { email: data.email });
        setStep('success');
      } else {
        // New user - collect username
        setStep('username');
      }
    } catch (error) {
      if (error instanceof Error) {
        setApiError(error.message);
      } else {
        setApiError('An error occurred. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const onUsernameSubmit = async (data: UsernameFormData) => {
    setApiError(null);
    setIsLoading(true);

    try {
      // Send login link with username for new user registration
      await api.post('/auth/magic-link/request', {
        email,
        username: data.username,
      });
      setStep('success');
    } catch (error) {
      if (error instanceof Error) {
        setApiError(error.message);
      } else {
        setApiError('An error occurred. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <img
            src={logo}
            alt="Annie's Health Journal Logo"
            className="mx-auto h-16 w-auto"
          />

          {step === 'email' && (
            <>
              <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                Get started with Annie
              </h2>
              <p className="mt-2 text-center text-sm text-gray-600">
                We&apos;ll send you a login link
                <br />
                No password needed!
              </p>
            </>
          )}

          {step === 'username' && (
            <>
              <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                Choose your username
              </h2>
              <p className="mt-2 text-center text-sm text-gray-600">
                This is how we&apos;ll greet you
              </p>
            </>
          )}

          {step === 'success' && (
            <>
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
                        We sent a login link to <strong>{email}</strong>
                      </p>
                      <p className="mt-2">
                        Click the link in the email to sign in. The link will expire in 15 minutes.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {step === 'email' && (
          <form className="mt-8 space-y-6" onSubmit={handleEmailSubmit(onEmailSubmit)}>
            {apiError && <Alert type="error">{apiError}</Alert>}

            <div className="rounded-md shadow-sm">
              <Input
                {...registerEmailField('email')}
                id="email"
                type="email"
                label="Email address"
                placeholder="you@example.com"
                autoComplete="email"
                error={emailErrors.email?.message}
                autoFocus
              />
            </div>

            <div>
              <Button type="submit" variant="primary" size="medium" fullWidth loading={isLoading}>
                Continue
              </Button>
            </div>

            <p className="text-center text-sm text-gray-600">
              Already have an account?{' '}
              <Link to="/login" className="font-medium text-primary-600 hover:text-primary-500">
                Log in
              </Link>
            </p>
          </form>
        )}

        {step === 'username' && (
          <form className="mt-8 space-y-6" onSubmit={handleUsernameSubmit(onUsernameSubmit)}>
            {apiError && <Alert type="error">{apiError}</Alert>}

            <div className="rounded-md shadow-sm">
              <Input
                {...registerUsernameField('username')}
                id="username"
                type="text"
                label="Username"
                placeholder="johndoe"
                autoComplete="username"
                error={usernameErrors.username?.message}
                autoFocus
              />
            </div>

            <div>
              <Button type="submit" variant="primary" size="medium" fullWidth loading={isLoading}>
                Create account & send login link
              </Button>
            </div>

            <button
              type="button"
              onClick={() => setStep('email')}
              className="w-full text-center text-sm text-gray-600 hover:text-gray-900"
            >
              ← Back to email
            </button>
          </form>
        )}

        {step === 'success' && (
          <div className="mt-8 space-y-6">
            <div className="text-center">
              <p className="text-sm text-gray-600">
                Didn&apos;t receive the email?{' '}
                <button
                  onClick={() => setStep('email')}
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
        )}
      </div>
    </div>
  );
}
