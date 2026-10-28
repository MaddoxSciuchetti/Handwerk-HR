import ErrorAlert from '@/components/alerts/ErrorAlert';
import useAuth from '@/features/user-profile/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { workerLifecycleQueries } from '../query-options/queries/worker-lifycycle.queries';
import { isTeamMember } from '../utils/teamMembers';
import GreetingHeader from './GreetingHeader';
import { LifecycleStatistics } from './LifecycleStatistics';
import NextAnniversary from './NextAnniversary';

export default function CockpitPage() {
  const { user, isLoading, isError } = useAuth();
  const {
    data: workers,
    error,
    isLoading: workersLoading,
  } = useQuery(workerLifecycleQueries.workerData());

  if (isError || (!isLoading && !user)) return <ErrorAlert />;
  if (error) return <ErrorAlert message={error.message} />;

  return (
    <div className="mx-auto flex h-full min-h-0 flex-col overflow-y-auto rounded-2xl bg-card p-6 text-card-foreground md:max-w-8xl">
      <GreetingHeader firstname={user?.firstName || ''} isLoading={isLoading} />
      <NextAnniversary
        people={(workers ?? []).filter((worker) => isTeamMember(worker))}
        isLoading={isLoading || workersLoading}
      />
      <LifecycleStatistics />
    </div>
  );
}
