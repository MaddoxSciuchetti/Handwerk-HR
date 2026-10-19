import { apiJson } from '@/config/apiClient';

export type MailRecipientKind =
  | 'worker_private'
  | 'worker_work'
  | 'microsoft_group'
  | 'teams_channel';

export type MailRecipient = {
  kind: MailRecipientKind;
  label: string;
  address: string | null;
  workerId: string | null;
  groupId: string | null;
};

export type EngagementMailPage = {
  selected: MailRecipient[];
  workers: Array<{
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    workEmail: string | null;
  }>;
  groups: Array<{ id: string; displayName: string }>;
  groupsError: string | null;
  channels: Array<{
    id: string;
    displayName: string;
    email: string;
    teamName: string;
  }>;
  channelsError: string | null;
};

type PageResponse = {
  success: boolean;
  data: EngagementMailPage;
};

type SaveResponse = {
  success: boolean;
  data: MailRecipient[];
};

export function engagementMailKey(engagementId: string) {
  return ['engagement-mail-recipients', engagementId] as const;
}

export function getEngagementMailRecipients(engagementId: string) {
  return apiJson
    .get<PageResponse>(`/automation/engagements/${engagementId}/mail-recipients`)
    .then((response) => response.data);
}

export function saveEngagementMailRecipients(
  engagementId: string,
  recipients: MailRecipient[]
) {
  return apiJson
    .put<SaveResponse>(
      `/automation/engagements/${engagementId}/mail-recipients`,
      { recipients }
    )
    .then((response) => response.data);
}

export function recipientKey(recipient: MailRecipient) {
  return `${recipient.kind}:${recipient.workerId ?? ''}:${recipient.groupId ?? ''}`;
}
