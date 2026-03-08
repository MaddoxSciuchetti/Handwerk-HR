import CenteredDiv from '@/components/alerts/layout-wrapper/CenteredDiv';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { signup } from '../api/auth.api';
import DoorManCard from './resuable/DoorManCard';
import DoorManFooter from './resuable/DoorManFooter';

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
    <DoorManCard>
      {isError && (
        <div className="mb-3 text-red-400">
          {error?.message || 'An error occurred'}
        </div>
      )}
      <div className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="email" className="text-white text-sm font-medium">
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
            <Label htmlFor="email" className="text-white text-sm font-medium">
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
            <Label htmlFor="email" className="text-white text-sm font-medium">
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
          <Label htmlFor="password" className="text-white text-sm font-medium">
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
        <DoorManFooter
          description={`Already have an account? ${''}`}
          action="Signin"
          nav={() => navigate({ to: `/login` })}
        />
      </div>
    </DoorManCard>
  );
}
