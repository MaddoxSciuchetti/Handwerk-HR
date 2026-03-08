import { SignupForm } from '@/features/auth/components/Register';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/signup')({
  component: Signup,
});

export default function Signup() {
  return <SignupForm />;
}
