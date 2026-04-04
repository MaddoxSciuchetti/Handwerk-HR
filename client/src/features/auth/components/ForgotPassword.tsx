import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { CheckCircle } from 'lucide-react';
import { useState } from 'react';
import { authMutations } from '../query-options/mutations/auth.mutations';
import DoorManCard from './resuable/DoorManCard';

const ForgotPassword = () => {
  const [email, setEmail] = useState<string>('');
  const navigate = useNavigate();

  const {
    mutate: sendPasswordReset,
    isSuccess,
    isError,
    error,
  } = useMutation(authMutations.passwortResetMail());

  return (
    <DoorManCard>
      <div className="flex flex-col text-center space-y-4">
        {isError && (
          <div className="text-destructive">
            {error.message || 'An error occurred'}
          </div>
        )}

        {isSuccess ? (
          <Alert
            variant="default"
            className="rounded-xl border border-[var(--status-success-foreground)] bg-[var(--status-success-bg)]"
          >
            <CheckCircle className="h-4 w-4 text-[var(--status-success-foreground)]" />
            <AlertDescription className="text-[var(--status-success-foreground)]">
              Email sent! Check your inbox for further instructions.
            </AlertDescription>
          </Alert>
        ) : (
          <>
            <div className="space-y-2 text-left">
              <label
                htmlFor="email"
                className="text-foreground text-sm font-medium"
              >
                Email address
              </label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoFocus
                className="border-input bg-background text-foreground"
              />
            </div>
            <Button
              onClick={() => sendPasswordReset(email)}
              variant={'outline'}
              className="w-full cursor-pointer"
            >
              Reset Password
            </Button>
          </>
        )}

        <p className="text-sm text-muted-foreground">
          Go back to{' '}
          <button
            onClick={() => navigate({ to: '/login' })}
            className="text-foreground underline hover:text-accent-foreground"
          >
            Sign in
          </button>
          &nbsp;or&nbsp;
          <button
            onClick={() => navigate({ to: '/signup' })}
            className="text-foreground underline hover:text-accent-foreground"
          >
            Sign up
          </button>
        </p>
      </div>
    </DoorManCard>
  );
};

export { ForgotPassword };
