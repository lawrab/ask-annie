import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, Link } from 'react-router';
import { useAuthStore } from '../stores/authStore';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Alert } from '../components/ui/Alert';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);
  const [apiError, setApiError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    mode: 'onBlur',
  });

  const onSubmit = async (data: LoginFormData) => {
    setApiError(null);
    setIsLoading(true);

    try {
      await login(data.email, data.password);
      navigate('/dashboard');
    } catch (error) {
      if (error instanceof Error) {
        setApiError(error.message);
      } else {
        setApiError('Failed to login. Please check your credentials.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign in to Ask Annie
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Or{' '}
            <Link
              to="/register"
              className="font-medium text-indigo-600 hover:text-indigo-500"
            >
              create a new account
            </Link>
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          {apiError && <Alert type="error">{apiError}</Alert>}

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

            <Input
              {...register('password')}
              id="password"
              type="password"
              label="Password"
              placeholder="••••••••"
              autoComplete="current-password"
              error={errors.password?.message}
            />
          </div>

          <div>
            <Button
              type="submit"
              variant="primary"
              size="md"
              fullWidth
              loading={isLoading}
            >
              Sign in
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
