import CenteredDiv from '@/components/alerts/layout-wrapper/CenteredDiv';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { signup } from '../api/auth.api';

export function SignupForm() {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const navigate = useNavigate();

  const {
    mutate: createAccount,
    error,
    isError,
    isPending,
  } = useMutation({
    mutationFn: signup,
    onSuccess: () => {
      navigate({ to: '/worker-lifycycle' });
    },
    onError: () => {
      console.log(
        isError ? `this is error ${error.message}` : 'nothing received'
      );
    },
  });

  if (isPending)
    return (
      <CenteredDiv>
        <Spinner className="w-8" />
      </CenteredDiv>
    );

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="mx-auto max-w-md py-12 px-6 text-center">
        <>
          <h1 className="text-4xl font-bold mb-6">Create an account</h1>
          <div className="rounded-lg bg-gray-700 shadow-lg p-8">
            {isError && (
              <div className="mb-3 text-red-400">
                {error?.message || 'An error occurred'}
              </div>
            )}
            <div className="space-y-6">
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

              <div className="space-y-2">
                <label
                  htmlFor="password"
                  className="text-white text-sm font-medium"
                >
                  Password
                </label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="text-white bg-gray-600 border-gray-500"
                />
                <p className="text-gray-400 text-xs text-left mt-2">
                  - Must be at least 6 characters long.
                </p>
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="confirmPassword"
                  className="text-white text-sm font-medium"
                >
                  Confirm Password
                </label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  onKeyDown={(e) =>
                    e.key === 'Enter' &&
                    createAccount({
                      email,
                      password,
                      confirmPassword,
                    })
                  }
                  className="text-white bg-gray-600 border-gray-500"
                />
              </div>

              <Button
                className="w-full my-2 text-white "
                variant={'outline'}
                // isLoading={isPending}
                // disabled={
                //   !email || password.length < 6 || password !== confirmPassword
                // }
                onClick={() =>
                  createAccount({
                    email,
                    password,
                    confirmPassword,
                  })
                }
              >
                Create Account
              </Button>

              <p className="text-sm text-gray-400">
                Already have an account?{' '}
                <button
                  onClick={() => navigate({ to: '/login' })}
                  className="text-white hover:text-gray-300 underline"
                >
                  Sign in
                </button>
              </p>
            </div>
          </div>
        </>
      </div>
    </div>
  );
}
