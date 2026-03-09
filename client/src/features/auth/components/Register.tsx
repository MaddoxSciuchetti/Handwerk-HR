import CenteredDiv from '@/components/alerts/layout-wrapper/CenteredDiv';
import SingleFormField from '@/components/form/SingleFormField';
import { Button } from '@/components/ui/button';
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
          <SingleFormField
            label="Email Address"
            id="email"
            type="email"
            value={email}
            setValue={setEmail}
          />
        </div>
        <div className="flex gap-3">
          <div className="space-y-2">
            <SingleFormField
              label="Vorname"
              id="firstName"
              type="text"
              value={firstName}
              setValue={setFirstName}
            />
          </div>
          <div className="space-y-2">
            <SingleFormField
              id="lastName"
              type="text"
              label="Nachname"
              value={lastName}
              setValue={setLastName}
            />
          </div>
        </div>

        <div className="space-y-2">
          <SingleFormField
            label="Password"
            id="password"
            type="password"
            value={password}
            setValue={setPassword}
            // action={() => signin({ email, password })}
          />
          <p className="text-gray-400 text-xs text-left mt-2">
            - Must be at least 6 characters long.
          </p>
        </div>

        <div className="space-y-2">
          <SingleFormField
            label="Confirm Password"
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            setValue={setConfirmPassword}
            action={() =>
              createAccount({
                email,
                firstName,
                lastName,
                password,
                confirmPassword,
              })
            }
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
