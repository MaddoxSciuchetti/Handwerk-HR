import { InviteSignup } from '@/features/auth/components/InviteSignup';
import { SignupForm } from '@/features/auth/components/Register';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/signup')({
  validateSearch: (search: Record<string, unknown>) => ({
    invite: (search.invite as string | undefined) || undefined,
  }),
  component: Signup,
});

export default function Signup() {
  const { invite } = Route.useSearch();
  if (invite) return <InviteSignup token={invite} />;
  return <SignupForm />;
}
