import { Container, Heading, Spinner, Text, VStack } from "@chakra-ui/react";
import useSessions from "@/hooks/useSessions";
import SessionCard from "@/components/auth/SessionCard";

export type Sessions_Type = {
  createdAt: string;
  id: string;
  isCurrent: boolean;
  userAgent: string;
};

const Settings = () => {
  const { sessions, isPending, isSuccess, isError } = useSessions();

  return (
    <Container mt={16}>
      <Heading mb={6}>My Sessions</Heading>
      {isPending && <Spinner />}
      {isError && <Text color="red.400">Failed to get sessions.</Text>}
      {isSuccess && (
        <VStack align="flex-start">
          {sessions &&
            Array.isArray(sessions) &&
            sessions.map((session: Sessions_Type) => (
              <SessionCard key={session.id} session={session} />
            ))}
        </VStack>
      )}
    </Container>
  );
};
export default Settings;
