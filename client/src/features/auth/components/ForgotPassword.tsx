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
          <div className="text-red-400">
            {error.message || 'An error occurred'}
          </div>
        )}

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
            <div className="space-y-2 text-left">
              <label htmlFor="email" className="text-white text-sm font-medium">
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
              variant={'outline'}
              className="w-full cursor-pointer text-white "
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
    </DoorManCard>
  );
};

export { ForgotPassword };
