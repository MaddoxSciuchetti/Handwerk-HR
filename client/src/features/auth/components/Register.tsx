import CenteredDiv from '@/components/alerts/layout-wrapper/CenteredDiv';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { signup } from '../api/auth.api';

export function SignupForm() {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [firstName, setFirstName] = useState<string>('');
  const [lastName, setLastName] = useState<string>('');
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
      <div className="mx-auto max-w-xl min-w-md py-12 px-6 text-center">
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
                <Label
                  htmlFor="email"
                  className="text-white text-sm font-medium"
                >
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoFocus
                  className="text-white bg-gray-600 border-gray-500"
                />
              </div>
              <div className="flex gap-3">
                <div className="space-y-2">
                  <Label
                    htmlFor="email"
                    className="text-white text-sm font-medium"
                  >
                    Vorname
                  </Label>
                  <Input
                    id="firstName"
                    type="firstName"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    autoFocus
                    className="text-white bg-gray-600 border-gray-500"
                  />
                </div>
                <div className="space-y-2">
                  <Label
                    htmlFor="email"
                    className="text-white text-sm font-medium"
                  >
                    Nachname
                  </Label>
                  <Input
                    id="lastName"
                    type="lastName"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    autoFocus
                    className="text-white bg-gray-600 border-gray-500"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="password"
                  className="text-white text-sm font-medium"
                >
                  Password
                </Label>
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
                <Label
                  htmlFor="confirmPassword"
                  className="text-white text-sm font-medium"
                >
                  Confirm Password
                </Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  onKeyDown={(e) =>
                    e.key === 'Enter' &&
                    createAccount({
                      email,
                      firstName,
                      lastName,
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
                onClick={() =>
                  createAccount({
                    email,
                    firstName,
                    lastName,
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
                  onClick={() => navigate({ to: '/worker-lifycycle' })}
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
