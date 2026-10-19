import { Label } from '@/components/ui/label';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  engagementMailKey,
  getEngagementMailRecipients,
  recipientKey,
  saveEngagementMailRecipients,
  type EngagementMailPage,
  type MailRecipient,
} from '@/features/worker-task-management/api/engagementMail.api';
import { cn } from '@/lib/utils';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ChevronDownIcon } from 'lucide-react';

type EngagementMailRecipientsProps = {
  engagementId: string;
};

function choicesFromPage(page: EngagementMailPage): MailRecipient[] {
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
    [...groups, ...channels].map((choice) => recipientKey(choice))
  );
  const kept = page.selected.filter(
    (choice) =>
      choice.kind !== 'worker_private' &&
      choice.kind !== 'worker_work' &&
      !listed.has(recipientKey(choice))
  );
  return [...groups, ...channels, ...kept];
}

export function EngagementMailRecipients({
  engagementId,
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

  const selected = (page.data?.selected ?? []).filter(
    (choice) =>
      choice.kind !== 'worker_private' && choice.kind !== 'worker_work'
  );
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
    <div className="flex flex-col gap-2">
      <Label className="ds-label-base">Empfänger</Label>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="flex h-8 w-full items-center justify-between gap-1.5 rounded-xl border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={page.isLoading}
          >
            <span
              className={cn(
                'min-w-0 truncate text-left',
                !summary && 'text-muted-foreground'
              )}
            >
              {page.isLoading
                ? 'Empfänger werden geladen…'
                : summary || 'Empfänger wählen'}
            </span>
            <ChevronDownIcon className="size-4 shrink-0 text-muted-foreground" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="start"
          className="max-h-80 w-(--radix-dropdown-menu-trigger-width) overflow-y-auto"
        >
          {choices.length === 0 ? (
            <p className="px-2 py-1.5 text-sm text-muted-foreground">
              Keine E-Mail-Adressen oder Gruppen gefunden.
            </p>
          ) : (
            choices.map((choice) => {
              const key = recipientKey(choice);
              const pressed = selectedKeys.has(key);
              return (
                <DropdownMenuItem
                  key={key}
                  aria-checked={pressed}
                  role="menuitemcheckbox"
                  onSelect={(event) => {
                    event.preventDefault();
                    toggle(choice);
                  }}
                >
                  <span
                    aria-hidden
                    className={
                      pressed
                        ? 'size-3.5 shrink-0 rounded-sm bg-primary'
                        : 'size-3.5 shrink-0 rounded-sm ring-1 ring-foreground/30'
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
                </DropdownMenuItem>
              );
            })
          )}
        </DropdownMenuContent>
      </DropdownMenu>
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
    </div>
  );
}
