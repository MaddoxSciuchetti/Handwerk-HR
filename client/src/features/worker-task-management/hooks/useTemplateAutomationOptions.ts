import { useQuery } from '@tanstack/react-query';
import useAuth from '@/features/user-profile/hooks/useAuth';
import { getChannels, getConnection } from '@/features/microsoft-teams/teams.api';
import {
  engagementMailKey,
  getEngagementMailRecipients,
  getMicrosoftMailAddresses,
} from '../api/engagementMail.api';

// Share in-flight lookups and briefly reuse results when the confirmation opens.
const staleTime = 60_000;

export function useTemplateAutomationOptions({
  engagementId,
  hasMail,
  hasTeams,
}: {
  engagementId?: string;
  hasMail: boolean;
  hasTeams: boolean;
}) {
  const { user } = useAuth();
  const senders = useQuery({
    queryKey: ['template-mail-senders', user?.organizationId, user?.id],
    queryFn: getMicrosoftMailAddresses,
    enabled: hasMail,
    staleTime,
  });
  const mail = useQuery({
    queryKey: engagementMailKey(engagementId ?? ''),
    queryFn: () => getEngagementMailRecipients(engagementId!),
    enabled: hasMail && Boolean(engagementId),
    staleTime,
  });
  const connection = useQuery({
    queryKey: ['template-teams-connection', user?.organizationId, user?.id],
    queryFn: getConnection,
    enabled: hasTeams,
    staleTime,
  });
  const channels = useQuery({
    queryKey: ['template-teams-channels', user?.organizationId, user?.id],
    queryFn: getChannels,
    enabled:
      hasTeams &&
      connection.data?.status === 'connected' &&
      connection.data.ready,
    staleTime,
  });
  return { senders, mail, connection, channels };
}
