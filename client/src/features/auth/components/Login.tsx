import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/trycatch';
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { ComponentProps, useState } from 'react';
import { login } from '../api/auth.api';

export function LoginComponent({ className, ...props }: ComponentProps<'div'>) {
  const navigate = useNavigate();
  const [password, setPassword] = useState<string>('');
  const [email, setEmail] = useState<string>('');

  const {
    mutate: signin,
    isError,
    isPending,
  } = useMutation({
    mutationFn: login,
    onSuccess: () => {
      navigate({ to: '/handwerker' });
    },
  });

  return (
    <div className={cn('flex flex-col gap-6', className)} {...props}>
      <div className="min-h-screen flex items-center justify-center">
        {isError && (
          <div className="mb-3 text-red-400">Invalid email or password</div>
        )}
        {isPending ? (
          <div className=" flex items-center gap-6">
            <Spinner className="size-8" />
          </div>
        ) : (
          <div className="mx-auto max-w-md py-12 px-6 text-center">
            <h1 className="text-4xl font-bold mb-8">Sign in to your account</h1>
            <div className="rounded-lg bg-gray-700 shadow-lg p-8">
              <div className="space-y-6">
                <div className="space-y-2">
                  <label
                    htmlFor="email"
                    className="text-amber-50 text-sm font-medium"
                  >
                    Email address
                  </label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    placeholder="m@example.com"
                    required
                    onChange={(e) => setEmail(e.target.value)}
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
                    onChange={(e) => setPassword(e.target.value)}
                    value={password}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        signin({ email, password });
                      }
                    }}
                    className="text-white bg-gray-600 border-gray-500"
                  />
                </div>

                <Button
                  onClick={() => navigate({ to: '/password/forgot' })}
                  className="text-white hover:text-gray-300 underline text-sm"
                >
                  Forgot Password?
                </Button>

                <Button
                  variant={'outline'}
                  type="submit"
                  onClick={() => signin({ email, password })}
                  className="w-full  text-white cursor-pointer"
                >
                  Login
                </Button>

                <p className="text-sm text-amber-50">
                  Don&apos;t have an account?{' '}
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
        )}
      </div>
    </div>
  );
}
