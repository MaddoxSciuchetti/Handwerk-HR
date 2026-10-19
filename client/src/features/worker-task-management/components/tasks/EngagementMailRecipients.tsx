import { Label } from '@/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverAnchor,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { useId, useRef, useState } from 'react';
import {
  engagementMailKey,
  getEngagementMailRecipients,
  recipientKey,
  saveEngagementMailRecipients,
  type EngagementMailPage,
  type MailRecipient,
} from '@/features/worker-task-management/api/engagementMail.api';
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
  const users = (page.licensedUsers ?? []).map((user) => ({
    kind: 'microsoft_user' as const,
    label: user.displayName,
    address: user.email,
    microsoftUserId: user.id,
    workerId: null,
    groupId: null,
  }));
  const listed = new Set(
    [...groups, ...channels, ...users].map((choice) => recipientKey(choice))
  );
  const kept = page.selected.filter(
    (choice) =>
      choice.kind !== 'worker_private' &&
      choice.kind !== 'worker_work' &&
      !listed.has(recipientKey(choice))
  );
  return [...users, ...groups, ...channels, ...kept];
}

export function EngagementMailRecipients({
  engagementId,
}: EngagementMailRecipientsProps) {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const optionsRef = useRef<HTMLDivElement>(null);
  const optionsId = useId();
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
  const normalize = (value: string) =>
    value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLocaleLowerCase('de');
  const terms = normalize(search.trim()).split(/\s+/).filter(Boolean);
  const matches = choices.filter((choice) => {
    const text = normalize(`${choice.label} ${choice.address ?? ''}`);
    return terms.every((term) => text.includes(term));
  });
  const visible = matches.slice(0, 10);
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
      <Label htmlFor={`${optionsId}-input`} className="ds-label-base">
        Empfänger
      </Label>
      <Popover
        open={open}
        onOpenChange={(nextOpen) => {
          setOpen(nextOpen);
          if (!nextOpen) setSearch('');
        }}
      >
        <PopoverAnchor asChild>
          <div className="relative">
            <Input
              ref={inputRef}
              id={`${optionsId}-input`}
              role="combobox"
              aria-label="Empfänger suchen"
              aria-expanded={open}
              aria-controls={optionsId}
              aria-haspopup="dialog"
              aria-autocomplete="list"
              autoComplete="off"
              placeholder="Name oder E-Mail eingeben…"
              className="h-8 rounded-xl pr-9"
              value={search}
              onFocus={() => setOpen(true)}
              onChange={(event) => {
                setSearch(event.target.value);
                setOpen(true);
              }}
              onKeyDown={(event) => {
                if (event.key === 'ArrowDown') {
                  event.preventDefault();
                  setOpen(true);
                  optionsRef.current
                    ?.querySelector<HTMLInputElement>('input:not(:disabled)')
                    ?.focus();
                }
                if (event.key === 'Escape') {
                  setOpen(false);
                  setSearch('');
                }
                if (event.key === 'Enter') event.preventDefault();
              }}
            />
            <PopoverTrigger asChild>
              <button
                type="button"
                aria-label="Empfängeroptionen öffnen"
                className="absolute inset-y-0 right-0 flex w-9 items-center justify-center rounded-r-xl text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <ChevronDownIcon className="size-4" />
              </button>
            </PopoverTrigger>
          </div>
        </PopoverAnchor>
        <PopoverContent
          align="start"
          className="w-(--radix-popover-trigger-width) gap-2"
          onOpenAutoFocus={(event) => event.preventDefault()}
          onCloseAutoFocus={(event) => event.preventDefault()}
          onInteractOutside={(event) => {
            if (event.target === inputRef.current) event.preventDefault();
          }}
        >
          <div
            ref={optionsRef}
            id={optionsId}
            className="max-h-64 overflow-y-auto"
            role="group"
            aria-label="Empfängeroptionen"
          >
            {visible.length === 0 ? (
              <p className="px-2 py-1.5 text-sm text-muted-foreground">
                {page.isLoading
                  ? 'Empfänger werden geladen…'
                  : search.trim()
                    ? 'Keine passenden Empfänger gefunden.'
                    : 'Keine E-Mail-Adressen oder Gruppen gefunden.'}
              </p>
            ) : (
              visible.map((choice) => {
                const key = recipientKey(choice);
                return (
                  <label
                    key={key}
                    className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 hover:bg-accent focus-within:bg-accent"
                  >
                    <input
                      type="checkbox"
                      className="size-3.5 shrink-0 accent-primary"
                      checked={selectedKeys.has(key)}
                      disabled={save.isPending}
                      onChange={() => toggle(choice)}
                    />
                    <span className="min-w-0">
                      <span className="block truncate">{choice.label}</span>
                      {choice.address ? (
                        <span className="block truncate text-xs text-muted-foreground">
                          {choice.address}
                        </span>
                      ) : null}
                    </span>
                  </label>
                );
              })
            )}
          </div>
          {matches.length > visible.length ? (
            <p className="px-2 text-xs text-muted-foreground" role="status">
              {visible.length} von {matches.length} Empfängern. Suche
              verfeinern, um weitere zu finden.
            </p>
          ) : null}
        </PopoverContent>
      </Popover>
      {summary ? (
        <p className="text-xs text-muted-foreground">Ausgewählt: {summary}</p>
      ) : null}
      {page.isError ? (
        <p className="text-xs text-destructive">
          Empfänger konnten nicht geladen werden.
        </p>
      ) : null}
      {page.data?.licensedUsersError ? (
        <p className="text-xs text-destructive">
          {page.data.licensedUsersError}
        </p>
      ) : null}
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
