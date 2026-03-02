import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { CheckCircle } from 'lucide-react';
import { useState } from 'react';
import { sendPasswordResetEmail } from '../api/auth.api';

const ForgotPassword = () => {
  const [email, setEmail] = useState<string>('');
  const navigate = useNavigate();

  const {
    mutate: sendPasswordReset,
    isSuccess,
    isError,
    error,
  } = useMutation({
    mutationFn: sendPasswordResetEmail,
  });

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="mx-auto max-w-md py-12 px-6 text-center">
        <h1 className="text-4xl font-bold mb-8">Reset your password</h1>
        <div className="rounded-lg bg-gray-700 shadow-lg p-8">
          {isError && (
            <div className="mb-3 text-red-400">
              {error.message || 'An error occurred'}
            </div>
          )}
          <div className="space-y-6">
            {isSuccess ? (
              <Alert
                variant="default"
                className="rounded-xl border-green-200 bg-green-50"
              >
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  Email sent! Check your inbox for further instructions.
                </AlertDescription>
              </Alert>
            ) : (
              <>
                <div className="space-y-2">
                  <label
                    htmlFor="email"
                    className="text-white text-sm font-medium"
                  >
                    Email address
                  </label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoFocus
                    className="text-white bg-gray-600 border-gray-500"
                  />
                </div>
                <Button
                  onClick={() => sendPasswordReset(email)}
                  className="w-full"
                >
                  Reset Password
                </Button>
              </>
            )}
            <p className="text-sm text-gray-400">
              Go back to{' '}
              <button
                onClick={() => navigate({ to: '/login' })}
                className="text-white hover:text-gray-300 underline"
              >
                Sign in
              </button>
              &nbsp;or&nbsp;
              <button
                onClick={() => navigate({ to: '/signup' })}
                className="text-white hover:text-gray-300 underline"
              >
                Sign up
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export { ForgotPassword };
