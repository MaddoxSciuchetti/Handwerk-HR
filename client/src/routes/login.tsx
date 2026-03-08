import { LoginComponent } from '@/features/auth/components/Login';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/login')({
  component: LoginForm,
});

export default function LoginForm() {
  return <LoginComponent />;
}
