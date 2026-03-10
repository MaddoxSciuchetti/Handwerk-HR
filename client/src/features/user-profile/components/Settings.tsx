import SessionCard from '@/features/auth/components/SessionCard';
import useSessions from '@/hooks/useSessions';

export type Sessions_Type = {
  createdAt: string;
  id: string;
  isCurrent: boolean;
  userAgent: string;
};

const Settings = () => {
  const { sessions, isPending, isSuccess, isError } = useSessions();

  return (
    <div className="max-w-7xl mx-auto px-4 mt-16">
      <h1 className="text-3xl font-bold mb-6">My Sessions</h1>
      {isPending && (
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-foreground"></div>
      )}
      {isError && <p className="text-destructive">Failed to get sessions.</p>}
      {isSuccess && (
        <div className="flex flex-col items-start space-y-4">
          {sessions &&
            Array.isArray(sessions) &&
            sessions.map((session: Sessions_Type) => (
              <SessionCard key={session.id} session={session} />
            ))}
        </div>
      )}
    </div>
  );
};
export default Settings;
