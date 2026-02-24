// import { Container, Heading, Spinner, Text, VStack } from "@chakra-ui/react";
import useSessions from '@/hooks/use-Sessions';
import SessionCard from '@/components/auth/SessionCard';

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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      )}
      {isError && <p className="text-red-400">Failed to get sessions.</p>}
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
