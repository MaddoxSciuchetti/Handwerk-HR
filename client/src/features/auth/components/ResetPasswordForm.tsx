import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useMutation } from '@tanstack/react-query';
import { CheckCircle } from 'lucide-react';
import { useState } from 'react';

import { resetPassword } from '@/features/auth/api/auth.api';
import { useNavigate } from '@tanstack/react-router';
import DoorManCard from './resuable/doorManCard';

const ResetPasswordForm = ({ code }: { code: string }) => {
  const [password, setPassword] = useState('');
  const {
    mutate: resetUserPassword,
    isSuccess,
    isError,
    error,
  } = useMutation({
    mutationFn: resetPassword,
  });

  const navigate = useNavigate();
  return (
    <DoorManCard>
      <div className="text-center">
        {isError && (
          <div className="mb-3 text-red-400">
            {error.message || 'An error occurred'}
          </div>
        )}
        {isSuccess ? (
          <div className="space-y-3">
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
              className="text-white cursor-pointer"
            >
              Sign in
            </button>
          </div>
        ) : (
          <div className="space-y-4 text-left">
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
              variant={'outline'}
              className="w-full cursor-pointer text-white"
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
    </DoorManCard>
  );
};
export default ResetPasswordForm;
