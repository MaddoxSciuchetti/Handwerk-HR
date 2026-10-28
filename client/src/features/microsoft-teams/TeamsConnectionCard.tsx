import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { LoaderCircle, X } from 'lucide-react';
import type { User } from '@/features/user-profile/types/auth.type';
import {
  connectTeams,
  connectionKey,
  disconnectTeams,
  getConnection,
  teamsError,
} from './teams.api';

const callbackMessages: Record<string, string> = {
  connected: 'Microsoft Teams wurde verbunden.',
  consent_cancelled:
    'Die Microsoft-Anmeldung wurde abgebrochen. Du kannst sie erneut starten.',
  invalid_attempt:
    'Die Anmeldung ist abgelaufen oder ungültig. Bitte erneut verbinden.',
  identity_mismatch: 'Bitte ein Microsoft-Konto deiner Organisation verwenden.',
  consent_required:
    'Die Teams-Berechtigungen müssen freigegeben werden. Bitte die Administration kontaktieren.',
  configuration_changed:
    'Die Microsoft-Einstellungen wurden geändert. Bitte erneut verbinden.',
  connection_failed:
    'Die Microsoft-Anmeldung ist fehlgeschlagen. Bitte erneut versuchen.',
  token_exchange_failed:
    'Microsoft konnte nicht verbunden werden. Bitte erneut verbinden.',
  connection_save_failed:
    'Verbindung konnte nicht gespeichert werden. Bitte erneut verbinden.',
};
export function TeamsConnectionCard({ user }: { user: User }) {
  const queryClient = useQueryClient();
  const [callbackMessage] = useState(() => {
    const result = new URL(window.location.href).searchParams.get('microsoft');
    return result
      ? callbackMessages[result] ||
          'Microsoft konnte nicht verbunden werden. Bitte erneut versuchen.'
      : '';
  });
  const key = connectionKey(user.id, user.organizationId);
  const connection = useQuery({
    queryKey: [...key, 'connection'],
    queryFn: getConnection,
    enabled: Boolean(user.organizationId),
    staleTime: 0,
    // Environment configuration can become available while this page is open.
    refetchInterval: (query) =>
      query.state.data?.ready === false ? 5_000 : false,
  });
  useEffect(() => {
    const url = new URL(window.location.href);
    const result = url.searchParams.get('microsoft');
    if (!result) return;
    url.searchParams.delete('microsoft');
    window.history.replaceState(window.history.state, '', url.toString());
    queryClient.removeQueries({
      queryKey: [...connectionKey(user.id, user.organizationId), 'channels'],
    });
    void queryClient.invalidateQueries({
      queryKey: connectionKey(user.id, user.organizationId),
    });
  }, [queryClient, user.id, user.organizationId]);
  const connect = useMutation({
    mutationFn: connectTeams,
    onSuccess: ({ url }) => {
      queryClient.removeQueries({ queryKey: [...key, 'channels'] });
      window.location.assign(url);
    },
  });
  const disconnect = useMutation({
    mutationFn: disconnectTeams,
    onSuccess: async (data) => {
      await queryClient.cancelQueries({ queryKey: key });
      queryClient.removeQueries({
        queryKey: key,
        predicate: (query) => query.queryKey[3] !== 'connection',
      });
      queryClient.setQueryData([...key, 'connection'], data);
    },
  });
  const state = connection.data;
  const connected = state?.status === 'connected';
  const busy = connect.isPending || disconnect.isPending;
  const buttonLabel = connection.isError
    ? 'Erneut laden'
    : connected
      ? 'Microsoft Teams trennen'
      : state?.status === 'reconnect_required'
        ? 'Erneut verbinden'
        : 'Verbinden';
  const description = state?.account
    ? `Verbunden als ${state.account.displayName} · ${state.account.username}`
    : 'Nachrichten an Teams und Kanäle senden';

  return (
    <section
      aria-label="Persönliche Microsoft Teams Verbindung"
      className="w-full min-w-0 space-y-3"
    >
      <div className="flex min-w-0 items-center gap-3 rounded-2xl px-3 py-6 transition-colors hover:bg-muted/60">
        <div
          className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-border bg-background"
          aria-hidden="true"
        >
          <svg viewBox="0 0 48 48" className="size-7" fill="none">
            <circle cx="29" cy="12" r="6" fill="#7B83EB" />
            <circle cx="40" cy="17" r="4" fill="#5059C9" />
            <path d="M34 24h12v10a6 6 0 0 1-12 0V24Z" fill="#5059C9" />
            <path d="M18 21h22v15a11 11 0 0 1-22 0V21Z" fill="#7B83EB" />
            <rect x="2" y="16" width="25" height="25" rx="3" fill="#6264A7" />
            <path d="M8 23h13v3h-5v12h-3V26H8v-3Z" fill="white" />
          </svg>
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-semibold">Microsoft Teams</h3>
          <p
            className="mt-0.5 truncate text-sm text-muted-foreground"
            title={description}
          >
            {description}
          </p>
        </div>
        <Button
          type="button"
          variant="secondary"
          className="h-9 min-w-24 shrink-0 rounded-full bg-foreground/5 px-4 text-sm shadow-none hover:bg-foreground/10"
          aria-label={buttonLabel}
          title={buttonLabel}
          disabled={
            connection.isPending ||
            busy ||
            (!connection.isError && !connected && !state?.ready)
          }
          onClick={() => {
            if (connection.isError) void connection.refetch();
            else if (connected) disconnect.mutate();
            else connect.mutate();
          }}
        >
          {busy || connection.isPending ? (
            <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
          ) : connected ? (
            <X className="size-4" aria-hidden="true" />
          ) : (
            buttonLabel
          )}
        </Button>
      </div>
      {callbackMessage && (
        <p role="status" className="px-4 text-sm">
          {callbackMessage}
        </p>
      )}
      {state?.status === 'reconnect_required' && (
        <p role="status" className="px-4 text-sm">
          Erneute Verbindung erforderlich.
        </p>
      )}
      {(connection.error || connect.error || disconnect.error) && (
        <p role="alert" className="px-4 text-sm text-destructive">
          {teamsError(connection.error || connect.error || disconnect.error)}
        </p>
      )}
    </section>
  );
}
