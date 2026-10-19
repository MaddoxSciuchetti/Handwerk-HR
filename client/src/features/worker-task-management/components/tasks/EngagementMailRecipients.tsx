import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  engagementMailKey,
  getEngagementMailRecipients,
  recipientKey,
  saveEngagementMailRecipients,
  type EngagementMailPage,
  type MailRecipient,
} from '@/features/worker-task-management/api/engagementMail.api';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

type EngagementMailRecipientsProps = {
  engagementId: string;
  title: string;
};

function choicesFromPage(page: EngagementMailPage): MailRecipient[] {
  const workers = page.workers.flatMap((worker) => {
    const name = `${worker.firstName} ${worker.lastName}`.trim();
    const rows: MailRecipient[] = [];
    if (worker.email.trim()) {
      rows.push({
        kind: 'worker_private',
        label: `${name} · E-Mail`,
        address: worker.email.trim(),
        workerId: worker.id,
        groupId: null,
      });
    }
    if (worker.workEmail?.trim()) {
      rows.push({
        kind: 'worker_work',
        label: `${name} · Arbeits-E-Mail`,
        address: worker.workEmail.trim(),
        workerId: worker.id,
        groupId: null,
      });
    }
    return rows;
  });
  const groups = page.groups.map((group) => ({
    kind: 'microsoft_group' as const,
    label: group.displayName,
    address: null,
    workerId: null,
    groupId: group.id,
  }));
  const channels = page.channels.map((channel) => ({
    kind: 'teams_channel' as const,
    label: `${channel.teamName} · ${channel.displayName}`,
    address: channel.email,
    workerId: null,
    groupId: channel.id,
  }));
  const listed = new Set(
    [...workers, ...groups, ...channels].map((choice) => recipientKey(choice))
  );
  const kept = page.selected.filter((choice) => !listed.has(recipientKey(choice)));
  return [...workers, ...groups, ...channels, ...kept];
}

export function EngagementMailRecipients({
  engagementId,
  title,
}: EngagementMailRecipientsProps) {
  const queryClient = useQueryClient();
  const page = useQuery({
    queryKey: engagementMailKey(engagementId),
    queryFn: () => getEngagementMailRecipients(engagementId),
  });
  const save = useMutation({
    mutationFn: (recipients: MailRecipient[]) =>
      saveEngagementMailRecipients(engagementId, recipients),
    onSuccess: (selected) => {
      queryClient.setQueryData<EngagementMailPage>(
        engagementMailKey(engagementId),
        (current) => (current ? { ...current, selected } : current)
      );
    },
  });

  const selected = page.data?.selected ?? [];
  const choices = page.data ? choicesFromPage(page.data) : [];
  const selectedKeys = new Set(selected.map((choice) => recipientKey(choice)));
  const summary = selected.map((choice) => choice.label).join(', ');

  const toggle = (choice: MailRecipient) => {
    const key = recipientKey(choice);
    const next = selectedKeys.has(key)
      ? selected.filter((item) => recipientKey(item) !== key)
      : [...selected, choice];
    save.mutate(next);
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="min-w-0">
        <p className="text-sm font-medium">{title}</p>
        <p className="truncate text-sm text-muted-foreground">
          {page.isLoading
            ? 'Empfänger werden geladen…'
            : summary || 'Keine Empfänger gewählt'}
        </p>
      </div>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            className="rounded-2xl"
            disabled={page.isLoading || page.isError}
          >
            Empfänger
          </Button>
        </PopoverTrigger>
        <PopoverContent align="end" className="max-h-80 w-80 overflow-y-auto">
          {choices.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Keine E-Mail-Adressen oder Gruppen gefunden.
            </p>
          ) : (
            <ul className="flex flex-col">
              {choices.map((choice) => {
                const key = recipientKey(choice);
                const pressed = selectedKeys.has(key);
                return (
                  <li key={key}>
                    <button
                      type="button"
                      aria-pressed={pressed}
                      className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-muted"
                      onClick={() => toggle(choice)}
                    >
                      <span
                        aria-hidden
                        className={
                          pressed
                            ? 'size-3.5 rounded-sm bg-primary'
                            : 'size-3.5 rounded-sm ring-1 ring-foreground/30'
                        }
                      />
                      <span className="min-w-0">
                        <span className="block truncate">{choice.label}</span>
                        {choice.address ? (
                          <span className="block truncate text-xs text-muted-foreground">
                            {choice.address}
                          </span>
                        ) : null}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
          {page.data?.groupsError ? (
            <p className="text-xs text-destructive">{page.data.groupsError}</p>
          ) : null}
          {page.data?.channelsError ? (
            <p className="text-xs text-muted-foreground">
              {page.data.channelsError}
            </p>
          ) : null}
          {save.isError ? (
            <p className="text-xs text-destructive">
              Empfänger konnten nicht gespeichert werden.
            </p>
          ) : null}
        </PopoverContent>
      </Popover>
    </div>
  );
}
