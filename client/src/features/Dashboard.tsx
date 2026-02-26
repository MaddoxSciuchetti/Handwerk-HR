import { Spinner } from '@/components/ui/spinner';
import useAuth from '@/features/user-profile/hooks/use-Auth';

function Dashboard() {
  const { user, isError, isLoading } = useAuth();

  if (user === undefined) return <div>Not allowed</div>;
  if (!isError) return <div>{isError}</div>;
  if (isLoading) return <Spinner className="size-8" />;

  return (
    <>
      <div>In Bearbeitung, noch nicht fertig</div>
    </>
  );
}

export default Dashboard;
