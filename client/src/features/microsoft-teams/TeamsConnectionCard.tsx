import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
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
  return (
    <section
      className="mt-5 flex flex-col gap-3 rounded-xl border border-border p-5"
      aria-label="Persönliche Microsoft Teams Verbindung"
    >
      <h2 className="text-base font-semibold">Microsoft Teams</h2>
      {callbackMessage && (
        <p role="status" className="text-sm">
          {callbackMessage}
        </p>
      )}
      {state?.account && (
        <p className="text-sm">
          Verbunden als {state.account.displayName} · {state.account.username}
        </p>
      )}
      {state?.status === 'reconnect_required' && (
        <p role="status">Erneute Verbindung erforderlich.</p>
      )}
      {connection.isPending && (
        <p className="text-sm">Verbindung wird geladen…</p>
      )}
      {(connection.error || connect.error || disconnect.error) && (
        <p role="alert" className="text-sm">
          {teamsError(connection.error || connect.error || disconnect.error)}
        </p>
      )}
      <div className="flex gap-2">
        <Button
          type="button"
          disabled={!state?.ready || connect.isPending || disconnect.isPending}
          onClick={() => connect.mutate()}
        >
          {connect.isPending
            ? 'Anmeldung wird geöffnet…'
            : state?.status === 'connected'
              ? 'Konto wechseln'
              : state?.status === 'reconnect_required'
                ? 'Erneut verbinden'
                : 'Microsoft Teams verbinden'}
        </Button>
        {state?.account && (
          <Button
            type="button"
            variant="outline"
            disabled={disconnect.isPending || connect.isPending}
            onClick={() => disconnect.mutate()}
          >
            Trennen
          </Button>
        )}
        {connection.isError && (
          <Button
            type="button"
            variant="outline"
            onClick={() => void connection.refetch()}
          >
            Erneut laden
          </Button>
        )}
      </div>
    </section>
  );
}
