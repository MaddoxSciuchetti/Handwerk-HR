import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { FETCHDESCRIPTION } from '@/features/all-tasks/consts/query.consts';
import {
  TASKHISTORY,
  WORKERBYID,
} from '@/features/worker-task-management/consts/query-key.consts';
import useAuth from '@/features/user-profile/hooks/useAuth';
import {
  connectionKey,
  getChannels,
  getTeamsPreview,
  reviewDelivery,
  sendTeams,
  teamsError,
  type Channel,
} from './teams.api';

const channelKey = (channel: { teamId: string; channelId: string }) =>
  `${channel.teamId}:${channel.channelId}`;
const deliveryLabel: Record<string, string> = {
  sent: 'Gesendet',
  pending: 'Noch nicht gesendet',
  posting: 'Wird gesendet / Ergebnis ausstehend',
  failed: 'Fehlgeschlagen',
  unknown: 'Zustellung unklar',
};
function teamsLink(value: string | null) {
  if (!value) return undefined;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' &&
      ['teams.microsoft.com', 'teams.cloud.microsoft'].includes(url.hostname)
      ? value
      : undefined;
  } catch {
    return undefined;
  }
}
export function TeamsSendAction({
  taskId,
  disabled,
  beforeOpen,
}: {
  taskId: string;
  disabled: boolean;
  beforeOpen?: () => Promise<boolean>;
}) {
  const [open, setOpen] = useState(false);
  const [preparing, setPreparing] = useState(false);
  const openSend = async () => {
    if (disabled || preparing) return;
    setPreparing(true);
    try {
      if (!beforeOpen || (await beforeOpen())) setOpen(true);
    } finally {
      setPreparing(false);
    }
  };
  return (
    <>
      <Button
        type="button"
        disabled={disabled || preparing}
        onClick={() => void openSend()}
      >
        Teams-Nachricht senden
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Teams-Nachricht senden</DialogTitle>
            <DialogDescription>
              Wähle die Kanäle und prüfe die Nachricht. Du sendest mit deinem
              verbundenen Microsoft-Konto.
            </DialogDescription>
          </DialogHeader>
          {open && <TeamsSendForm taskId={taskId} />}
        </DialogContent>
      </Dialog>
    </>
  );
}
export function TeamsSendForm({ taskId }: { taskId: string }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Channel[]>([]);
  const [idempotencyKey] = useState(() => crypto.randomUUID());
  const key = connectionKey(user?.id, user?.organizationId);
  const previewKey = [...key, 'preview', taskId];
  const preview = useQuery({
    queryKey: previewKey,
    queryFn: () => getTeamsPreview(taskId),
    enabled: Boolean(user?.organizationId),
    refetchInterval: (query) => {
      const op = query.state.data?.operation;
      return op?.status === 'sending' ||
        op?.destinations.some(
          (d) => d.retryAfter && new Date(d.retryAfter) > new Date()
        )
        ? 5000
        : false;
    },
  });
  const connection = preview.data?.connection;
  const channels = useQuery({
    queryKey: [...key, 'channels'],
    queryFn: getChannels,
    enabled: connection?.status === 'connected' && connection.ready,
    staleTime: 0,
  });
  const refresh = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: previewKey }),
      queryClient.invalidateQueries({ queryKey: [FETCHDESCRIPTION] }),
      queryClient.invalidateQueries({ queryKey: [WORKERBYID] }),
      queryClient.invalidateQueries({ queryKey: [TASKHISTORY, taskId] }),
    ]);
  };
  const send = useMutation({
    mutationFn: () =>
      sendTeams(taskId, {
        idempotencyKey:
          preview.data?.operation?.idempotencyKey ?? idempotencyKey,
        destinations: (preview.data?.operation?.destinations ?? selected).map(
          ({ teamId, channelId }) => ({ teamId, channelId })
        ),
      }),
    onSettled: refresh,
  });
  const review = useMutation({
    mutationFn: (input: { destinationId: string; delivered: boolean }) =>
      reviewDelivery(taskId, input.destinationId, input.delivered),
    onSettled: refresh,
  });
  const operation = preview.data?.operation;
  const busy =
    send.isPending ||
    review.isPending ||
    Boolean(
      operation?.leaseUntil && new Date(operation.leaseUntil) > new Date()
    );
  const completed =
    operation?.status === 'completed' || preview.data?.completed;
  const unknown = operation?.destinations.some(
    (d) => d.status === 'unknown' || d.status === 'posting'
  );
  const throttled = operation?.destinations.some(
    (d) =>
      d.status !== 'sent' && d.retryAfter && new Date(d.retryAfter) > new Date()
  );
  const connected = connection?.status === 'connected' && connection.ready;
  const filtered =
    channels.data?.channels.filter((channel) =>
      channel.label.toLocaleLowerCase().includes(search.toLocaleLowerCase())
    ) ?? [];
  const selectedKeys = new Set(selected.map(channelKey));
  const choose = (channel: Channel) =>
    setSelected((current) =>
      selectedKeys.has(channelKey(channel))
        ? current.filter((c) => channelKey(c) !== channelKey(channel))
        : [...current, channel]
    );
  return (
    <div className="flex flex-col gap-4">
      {preview.isPending && <p>Vorschau wird geladen…</p>}
      {preview.error && <p role="alert">{teamsError(preview.error)}</p>}
      {operation ? (
        <p className="text-sm">
          Absender dieser Zustellung: <strong>{operation.senderName}</strong>
        </p>
      ) : (
        connection?.account && (
          <p className="text-sm">
            Absender: <strong>{connection.account.displayName}</strong> ·{' '}
            {connection.account.username}
          </p>
        )
      )}
      {connection && !connected && (
        <p role="status">
          {!connection.ready
            ? 'Microsoft Teams ist noch nicht eingerichtet.'
            : 'Bitte dein Microsoft-Konto verbinden oder erneut anmelden.'}{' '}
          <a className="underline" href="/settings/general">
            Zu den allgemeinen Einstellungen
          </a>
        </p>
      )}
      {connection && !connection.live && (
        <p>Sequenzen werden in dieser Umgebung nicht ausgeführt.</p>
      )}
      {preview.data && (
        <div>
          <p className="mb-2 text-sm font-medium">Nachricht</p>
          <div className="max-h-64 overflow-auto whitespace-pre-wrap rounded-lg border p-3 text-sm">
            {preview.data.body}
          </div>
        </div>
      )}
      {!operation && connected && (
        <fieldset className="flex min-w-0 flex-col gap-2">
          <legend className="mb-2 font-medium">Teams-Kanäle</legend>
          <Input
            aria-label="Kanäle suchen"
            placeholder="Team oder Kanal suchen…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {channels.isPending && <p>Kanäle werden geladen…</p>}
          {channels.error && <p role="alert">{teamsError(channels.error)}</p>}
          {channels.data?.warnings.map((warning) => (
            <p key={warning} role="status" className="text-sm">
              {warning}
            </p>
          ))}
          <div className="max-h-52 overflow-y-auto rounded-lg border p-2">
            {filtered.map((channel) => (
              <label
                key={channelKey(channel)}
                className="flex items-center gap-2 p-2 text-sm"
              >
                <input
                  type="checkbox"
                  checked={selectedKeys.has(channelKey(channel))}
                  onChange={() => choose(channel)}
                  disabled={busy}
                />
                {channel.label}
              </label>
            ))}
            {channels.isSuccess && filtered.length === 0 && (
              <p className="p-2 text-sm">Keine passenden Kanäle gefunden.</p>
            )}
          </div>
          <Button
            type="button"
            variant="outline"
            disabled={channels.isFetching || busy}
            onClick={() => void channels.refetch()}
          >
            Kanäle neu laden
          </Button>
        </fieldset>
      )}
      {operation && (
        <div className="flex flex-col gap-3" aria-label="Zustellungen">
          {operation.destinations.map((destination) => (
            <div key={destination.id} className="rounded-lg border p-3 text-sm">
              <p className="font-medium">{destination.label}</p>
              <p>{deliveryLabel[destination.status] ?? destination.status}</p>
              {destination.error && <p>{destination.error}</p>}
              {destination.retryAfter && destination.status !== 'sent' && (
                <p>
                  Erneut möglich ab{' '}
                  {new Date(destination.retryAfter).toLocaleTimeString('de-DE')}
                  .
                </p>
              )}
              {teamsLink(destination.messageUrl) && (
                <a
                  href={teamsLink(destination.messageUrl)}
                  target="_blank"
                  rel="noreferrer"
                  className="underline"
                >
                  In Teams öffnen
                </a>
              )}
              {['unknown', 'posting'].includes(destination.status) && !busy && (
                <div className="mt-2 flex flex-wrap gap-2">
                  <p className="w-full">
                    Bitte den Kanal in Teams prüfen und das Ergebnis bestätigen:
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() =>
                      review.mutate({
                        destinationId: destination.id,
                        delivered: true,
                      })
                    }
                  >
                    In Teams geprüft: angekommen
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() =>
                      review.mutate({
                        destinationId: destination.id,
                        delivered: false,
                      })
                    }
                  >
                    In Teams geprüft: nicht angekommen
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      {(send.error || review.error) && (
        <p role="alert">{teamsError(send.error || review.error)}</p>
      )}
      {completed ? (
        <p role="status">
          Die Nachricht wurde zugestellt. Die Aufgabe ist erledigt.
        </p>
      ) : (
        <Button
          type="button"
          disabled={
            !connected ||
            !connection?.live ||
            busy ||
            Boolean(unknown) ||
            Boolean(throttled) ||
            (!operation && selected.length === 0)
          }
          onClick={() => send.mutate()}
        >
          {busy
            ? 'Wird gesendet…'
            : operation
              ? 'Offene Zustellungen erneut senden'
              : 'Nachricht senden'}
        </Button>
      )}
    </div>
  );
}
