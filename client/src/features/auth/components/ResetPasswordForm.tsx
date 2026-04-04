import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useMutation } from '@tanstack/react-query';
import { CheckCircle } from 'lucide-react';
import { useState } from 'react';

import { resetPassword } from '@/features/auth/api/auth.api';
import { useNavigate } from '@tanstack/react-router';
import DoorManCard from './resuable/DoorManCard';

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
          <div className="mb-3 text-destructive">
            {error.message || 'An error occurred'}
          </div>
        )}
        {isSuccess ? (
          <div className="space-y-3">
            <Alert
              variant="default"
              className="mb-3 rounded-xl border border-[var(--status-success-foreground)] bg-[var(--status-success-bg)]"
            >
              <CheckCircle className="h-4 w-4 text-[var(--status-success-foreground)]" />
              <AlertDescription className="text-[var(--status-success-foreground)]">
                Password updated successfully!
              </AlertDescription>
            </Alert>

            <button
              onClick={() => navigate({ to: '/login' })}
              className="cursor-pointer text-foreground"
            >
              Sign in
            </button>
          </div>
        ) : (
          <div className="space-y-4 text-left">
            <div className="space-y-2">
              <label
                htmlFor="password"
                className="text-foreground text-sm font-medium"
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
                className="border-input bg-background text-foreground"
              />
            </div>
            <Button
              variant={'outline'}
              className="w-full cursor-pointer"
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
