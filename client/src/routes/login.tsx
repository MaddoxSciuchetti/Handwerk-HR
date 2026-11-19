import { StagingAutoEnter } from '@/features/auth/components/StagingAutoEnter';
import { StandardUserLogin } from '@/features/auth/components/StandardUserLogin';
import { STAGING_SKIP_LOGIN } from '@/config/env';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/login')({
  component: LoginForm,
});

export default function LoginForm() {
  if (STAGING_SKIP_LOGIN) {
    return <StagingAutoEnter />;
  }
  return <StandardUserLogin />;
}
