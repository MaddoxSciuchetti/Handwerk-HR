import { StandardUserLogin } from '@/features/auth/components/StandardUserLogin';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/login')({
  component: LoginForm,
});

export default function LoginForm() {
  return <StandardUserLogin />;
}
