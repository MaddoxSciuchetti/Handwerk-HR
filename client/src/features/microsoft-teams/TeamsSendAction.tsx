import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ChevronDownIcon } from 'lucide-react';
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
type TeamsSendProps = {
  taskId: string;
  disabled?: boolean;
  beforeSend?: () => Promise<boolean>;
};

export function TeamsSendAction(props: TeamsSendProps) {
  return <TeamsSendForm key={props.taskId} {...props} sidebar />;
}

export function TeamsSendForm({
  taskId,
  disabled = false,
  beforeSend,
  sidebar = false,
}: TeamsSendProps & { sidebar?: boolean }) {
  const showDiagnostics = !import.meta.env.PROD;
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [channelPickerOpen, setChannelPickerOpen] = useState(false);
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
    mutationFn: async () => {
      if (beforeSend && !(await beforeSend())) return;
      // Saving task edits can change the message template or connection state.
      const latest = await queryClient.fetchQuery({
        queryKey: previewKey,
        queryFn: () => getTeamsPreview(taskId),
        staleTime: 0,
      });
      if (latest.completed || latest.operation?.status === 'completed') return;
      if (
        !latest.connection.ready ||
        latest.connection.status !== 'connected' ||
        !latest.connection.live
      ) {
        throw new Error('Microsoft Teams ist derzeit nicht verfügbar.');
      }
      return sendTeams(taskId, {
        idempotencyKey: latest.operation?.idempotencyKey ?? idempotencyKey,
        destinations: (latest.operation?.destinations ?? selected).map(
          ({ teamId, channelId }) => ({ teamId, channelId })
        ),
      });
    },
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
      {showDiagnostics &&
        (operation ? (
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
        ))}
      {showDiagnostics && connection && !connected && (
        <p role="status">
          {!connection.ready
            ? 'Microsoft Teams ist noch nicht eingerichtet.'
            : 'Bitte dein Microsoft-Konto verbinden oder erneut anmelden.'}{' '}
          <a className="underline" href="/settings/integrations">
            Zu den allgemeinen Einstellungen
          </a>
        </p>
      )}
      {showDiagnostics && connection && !connection.live && (
        <p>Sequenzen werden in dieser Umgebung nicht ausgeführt.</p>
      )}
      {preview.data && !operation && (
        <fieldset className="flex min-w-0 flex-col gap-2">
          <legend className="mb-2 font-medium">
            {sidebar ? 'Teams-Kanal' : 'Teams-Kanäle'}
          </legend>
          {connected && (
            <>
              {sidebar ? (
                <Popover
                  open={channelPickerOpen}
                  onOpenChange={setChannelPickerOpen}
                >
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      aria-label="Teams-Kanal"
                      className="h-9 w-full min-w-0 justify-between rounded-2xl font-normal"
                      disabled={
                        disabled ||
                        busy ||
                        channels.isPending ||
                        !channels.data?.channels.length
                      }
                    >
                      <span className="truncate">
                        {selected[0]?.label || 'Kanal auswählen…'}
                      </span>
                      <ChevronDownIcon
                        className="size-4 shrink-0 text-muted-foreground"
                        aria-hidden
                      />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent
                    align="start"
                    aria-label="Teams-Kanal auswählen"
                    className="max-h-(--radix-popover-content-available-height) w-(--radix-popover-trigger-width) overflow-y-auto"
                  >
                    {channels.data?.channels.map((channel) => (
                      <label
                        key={channelKey(channel)}
                        className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 hover:bg-accent focus-within:bg-accent"
                      >
                        <input
                          type="checkbox"
                          className="size-3.5 shrink-0 accent-primary"
                          checked={selectedKeys.has(channelKey(channel))}
                          disabled={disabled || busy}
                          onChange={() => {
                            setSelected(
                              selectedKeys.has(channelKey(channel))
                                ? []
                                : [channel]
                            );
                            setChannelPickerOpen(false);
                          }}
                        />
                        <span className="min-w-0 break-words">
                          {channel.label}
                        </span>
                      </label>
                    ))}
                  </PopoverContent>
                </Popover>
              ) : (
                <Input
                  aria-label="Kanäle suchen"
                  placeholder="Team oder Kanal suchen…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              )}
              {channels.isPending && <p>Kanäle werden geladen…</p>}
              {sidebar &&
                channels.isSuccess &&
                !channels.data.channels.length && (
                  <p className="text-sm">Keine Kanäle verfügbar.</p>
                )}
              {channels.error && (
                <p role="alert">{teamsError(channels.error)}</p>
              )}
              {channels.data?.warnings.map((warning) => (
                <p key={warning} role="status" className="text-sm">
                  {warning}
                </p>
              ))}
              {!sidebar && (
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
                    <p className="p-2 text-sm">
                      Keine passenden Kanäle gefunden.
                    </p>
                  )}
                </div>
              )}
              {(showDiagnostics || channels.isError) && (
                <Button
                  type="button"
                  variant="outline"
                  disabled={channels.isFetching || busy}
                  onClick={() => void channels.refetch()}
                >
                  Kanäle neu laden
                </Button>
              )}
            </>
          )}
          {!connected && <p className="text-sm">Keine Kanäle verfügbar.</p>}
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
      {preview.data && !sidebar && (
        <div>
          <p className="mb-2 text-sm font-medium">Nachricht</p>
          <div className="max-h-64 overflow-auto whitespace-pre-wrap rounded-lg border p-3 text-sm">
            {preview.data.body}
          </div>
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
            disabled ||
            preview.isPending ||
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
              : sidebar
                ? 'Teams-Nachricht senden'
                : 'Nachricht senden'}
        </Button>
      )}
    </div>
  );
}
