import { apiJson } from '@/config/apiClient';

export type Connection = {
  organizationId: string;
  userId: string;
  ready: boolean;
  live: boolean;
  status: 'disconnected' | 'connected' | 'reconnect_required';
  account: { displayName: string; username: string } | null;
};
export type Channel = {
  teamId: string;
  channelId: string;
  teamName: string;
  channelName: string;
  label: string;
};
export type Destination = {
  id: string;
  teamId: string;
  channelId: string;
  label: string;
  status: string;
  error: string | null;
  retryAfter: string | null;
  messageUrl: string | null;
};
export type SendOperation = {
  senderName: string;
  id: string;
  idempotencyKey: string;
  body: string;
  status: string;
  leaseUntil: string | null;
  destinations: Destination[];
};
export type Preview = {
  body: string;
  connection: Connection;
  operation: SendOperation | null;
  completed: boolean;
};
type Response<T> = { success: boolean; data: T };
const base = '/automation/microsoft-teams';
export const connectionKey = (userId?: string, organizationId?: string) =>
  ['microsoft-teams', organizationId, userId] as const;
export const getConnection = () =>
  apiJson.get<Response<Connection>>(`${base}/connection`).then((r) => r.data);
export const connectTeams = () =>
  apiJson
    .post<Response<{ url: string }>>(`${base}/connection`, {})
    .then((r) => r.data);
export const disconnectTeams = () =>
  apiJson
    .delete<Response<Connection>>(`${base}/connection`)
    .then((r) => r.data);
export const getChannels = () =>
  apiJson
    .get<
      Response<{ channels: Channel[]; warnings: string[] }>
    >(`${base}/channels`)
    .then((r) => r.data);
export const getTeamsPreview = (issueId: string) =>
  apiJson
    .get<Response<Preview>>(`/automation/issues/${issueId}/teams-preview`)
    .then((r) => r.data);
export const sendTeams = (
  issueId: string,
  input: {
    idempotencyKey: string;
    destinations: Array<{ teamId: string; channelId: string }>;
  }
) =>
  apiJson
    .post<
      Response<SendOperation>
    >(`/automation/issues/${issueId}/teams-send`, input)
    .then((r) => r.data);
export const reviewDelivery = (
  issueId: string,
  destinationId: string,
  delivered: boolean
) =>
  apiJson
    .post<
      Response<SendOperation>
    >(`/automation/issues/${issueId}/teams-review`, { destinationId, delivered })
    .then((r) => r.data);
export function teamsError(error: unknown) {
  return error &&
    typeof error === 'object' &&
    'message' in error &&
    typeof error.message === 'string'
    ? error.message
    : 'Microsoft Teams ist derzeit nicht verfügbar.';
}
