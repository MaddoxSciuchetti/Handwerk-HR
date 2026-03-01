import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useMutation } from '@tanstack/react-query';
import { CheckCircle } from 'lucide-react';
import { useState } from 'react';

import { resetPassword } from '@/features/auth/api/auth.api';
import { useNavigate } from '@tanstack/react-router';

const ResetPasswordForm = ({ code }: any) => {
  const [password, setPassword] = useState('');
  const {
    mutate: resetUserPassword,
    isPending,
    isSuccess,
    isError,
    error,
  } = useMutation({
    mutationFn: resetPassword,
  });

  const navigate = useNavigate();
  return (
    <>
      <h1 className="text-4xl font-bold mb-8">Change your password</h1>
      <div className="rounded-lg bg-gray-700 shadow-lg p-8">
        {isError && (
          <div className="mb-3 text-red-400">
            {error.message || 'An error occurred'}
          </div>
        )}
        {isSuccess ? (
          <div>
            <Alert
              variant="default"
              className="rounded-xl mb-3 border-green-200 bg-green-50"
            >
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                Password updated successfully!
              </AlertDescription>
            </Alert>

            <button
              onClick={() => navigate({ to: '/login' })}
              className="text-blue-600 hover:text-blue-800 underline"
            >
              Sign in
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="space-y-2">
              <label
                htmlFor="password"
                className="text-white text-sm font-medium"
              >
                New Password
              </label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) =>
                  e.key === 'Enter' &&
                  resetUserPassword({ password, verificationCode: code })
                }
                autoFocus
                className="text-white bg-gray-600 border-gray-500"
              />
            </div>
            <Button
              className="w-full my-2"
              onClick={() =>
                resetUserPassword({
                  password,
                  verificationCode: code,
                })
              }
            >
              Reset Password
            </Button>
          </div>
        )}
      </div>
    </>
  );
};
export default ResetPasswordForm;
