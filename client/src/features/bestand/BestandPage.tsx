import ErrorAlert from '@/components/alerts/ErrorAlert';
import LoadingAlert from '@/components/alerts/LoadingAlert';
import useAuth from '@/features/user-profile/hooks/useAuth';
import GreetingHeader from '@/features/worker-lifecycle/components/GreetingHeader';
import { BestandTab } from './BestandTab';

export function BestandPage() {
  const { user, isLoading, isError } = useAuth();

  if (isLoading) return <LoadingAlert />;
  if (isError || !user) return <ErrorAlert />;

  return (
    <div className="mx-auto flex h-full min-h-0 flex-col overflow-hidden rounded-2xl bg-card p-6 text-card-foreground md:max-w-8xl">
      <div className="flex h-full min-h-0 w-full flex-col">
        <GreetingHeader firstname={user.firstName || ''} />
        <div className="mt-5 flex min-h-0 flex-1 flex-col">
          <BestandTab />
        </div>
      </div>
    </div>
  );
}
