import ErrorAlert from '@/components/alerts/ErrorAlert';
import LoadingAlert from '@/components/alerts/LoadingAlert';
import PermissionDenied from '@/components/alerts/PermissionDenied';
import CeoDashboard from '@/features/CeoDashboard';
import useAuth from '@/hooks/use-Auth';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/dashboard/ceo')({
  component: RouteComponent,
});

function RouteComponent() {
  const { user, isLoading, isError } = useAuth();

  if (isLoading) return <LoadingAlert />;

  if (isError || !user) return <ErrorAlert />;

  if (user.user_permission === 'CHEF') {
    return <CeoDashboard />;
  }
  return <PermissionDenied />;
}
