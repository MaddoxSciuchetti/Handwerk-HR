import { ChevronDown } from 'lucide-react';
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from '@/components/ui/popover';
import { useState, type ReactNode } from 'react';
import { MicrosoftLicenseStatus } from './MicrosoftLicenseStatus';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '@/components/ui/accordion';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Alert, AlertTitle } from '@/components/ui/alert';
import {
  isMailSequence,
  sequenceLabel,
} from '@/features/settings/integrations/integration.consts';
import {
  connectTeams,
  getChannels,
  getConnection,
} from '@/features/microsoft-teams/teams.api';
import useAuth from '@/features/user-profile/hooks/useAuth';
import {
  engagementMailKey,
  getEngagementMailRecipients,
  getMicrosoftMailAddresses,
  recipientKey,
  type MailRecipient,
} from '../../api/engagementMail.api';
import type {
  AutomationChoice,
  TemplatePreview,
} from '../../api/templateApplication.api';

const emailAuthenticationHelp =
  'Microsoft hat die Anmeldung der Organisation abgelehnt. Bitte unter Einstellungen → Integrationen die Mandanten-ID, Client-ID und das Client-Secret prüfen und korrigieren oder die Administration darum bitten.';
const teamsSignInHelp =
  'Dein Microsoft-Konto ist für Teams nicht verbunden oder muss erneut angemeldet werden. Melde dich erneut bei Microsoft an, um die Verbindung zu Teams wiederherzustellen und die Kanäle zu laden.';
const microsoftConfigurationHelp =
  'Die Microsoft-Integration der Organisation ist nicht vollständig eingerichtet. Bitte unter Einstellungen → Integrationen die Mandanten-ID, Client-ID und das Client-Secret prüfen und speichern oder die Administration darum bitten.';

function mailErrorMessage(message: string) {
  if (message === 'Microsoft Graph hat die Anmeldung abgelehnt.')
    return emailAuthenticationHelp;
  if (
    message === 'Die Zugangsdaten sind unvollständig.' ||
    message === 'Die Integration ist deaktiviert.'
  )
    return microsoftConfigurationHelp;
  return message;
}
function selectionLabel(labels: string[]) {
  if (labels.length === 0) return 'Wählen';
  if (labels.length === 1) return labels[0];
  return `${labels.length} ausgewählt`;
}

function FieldRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      <span className="w-20 shrink-0 text-xs text-muted-foreground">
        {label}:
      </span>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}

function errorCode(error: unknown) {
  if (!error || typeof error !== 'object') return '';
  if ('code' in error) return String(error.code);
  return 'errorCode' in error ? String(error.errorCode) : '';
}

export function TemplateAutomationConfirmation({
  template,
  engagementId,
  busy,
  onApply,
}: {
  template: TemplatePreview;
  engagementId: string;
  busy: boolean;
  onApply: (
    runAutomation: boolean,
    choices: Record<string, AutomationChoice>
  ) => void;
}) {
  const { user } = useAuth();
  const [startingAutomation, setStartingAutomation] = useState(false);
  const [choices, setChoices] = useState<Record<string, AutomationChoice>>({});
  const automated = template.items.filter(
    (item) => item.sequence && item.integrationProvider
  );
  const hasMail = automated.some((item) => isMailSequence(item.sequence));
  const hasTeams = automated.some(
    (item) => item.sequence === 'microsoft_send_teams_message'
  );
  const senders = useQuery({
    queryKey: ['template-mail-senders', user?.organizationId],
    queryFn: getMicrosoftMailAddresses,
    enabled: hasMail,
  });
  const mail = useQuery({
    queryKey: engagementMailKey(engagementId),
    queryFn: () => getEngagementMailRecipients(engagementId),
    enabled: hasMail,
  });
  const connection = useQuery({
    queryKey: ['template-teams-connection', user?.organizationId, user?.id],
    queryFn: getConnection,
    enabled: hasTeams,
  });
  const channels = useQuery({
    queryKey: ['template-teams-channels', user?.organizationId, user?.id],
    queryFn: getChannels,
    enabled:
      hasTeams &&
      connection.data?.status === 'connected' &&
      connection.data.ready,
  });
  const reconnect = useMutation({
    mutationFn: connectTeams,
    onSuccess: ({ url }) => window.location.assign(url),
  });
  const recipients = new Map<string, MailRecipient>();
  for (const recipient of mail.data?.selected ?? [])
    recipients.set(recipientKey(recipient), recipient);
  for (const group of mail.data?.groups ?? []) {
    const recipient: MailRecipient = {
      kind: 'microsoft_group',
      label: group.displayName,
      groupId: group.id,
      address: null,
      workerId: null,
    };
    recipients.set(recipientKey(recipient), recipient);
  }
  for (const channel of mail.data?.channels ?? []) {
    const recipient: MailRecipient = {
      kind: 'teams_channel',
      label: `${channel.teamName} · ${channel.displayName}`,
      groupId: channel.id,
      address: channel.email,
      workerId: null,
    };
    recipients.set(recipientKey(recipient), recipient);
  }
  const effectiveChoices = Object.fromEntries(
    automated.map((item) => [
      item.id,
      {
        ...choices[item.id],
        ...(isMailSequence(item.sequence)
          ? {
              recipients:
                choices[item.id]?.recipients ?? mail.data?.selected ?? [],
            }
          : {}),
      },
    ])
  );
  const ready = automated.every((item) => {
    const choice = effectiveChoices[item.id];
    if (item.blockedReason) return false;
    if (isMailSequence(item.sequence))
      return Boolean(
        senders.isSuccess &&
        mail.isSuccess &&
        choice.senderAddress &&
        choice.recipients?.length
      );
    if (item.sequence === 'microsoft_send_teams_message')
      return Boolean(
        connection.data?.status === 'connected' &&
        connection.data.ready &&
        connection.data.live &&
        channels.isSuccess &&
        choice.destinations?.length
      );
    return true;
  });
  const mailErrors = hasMail
    ? [
        ...new Set(
          [
            senders.data?.error,
            mail.data?.groupsError,
            mail.data?.channelsError,
            ...automated
              .filter((item) => isMailSequence(item.sequence))
              .map((item) => item.blockedReason),
            ...(mail.isError || senders.isError
              ? [
                  'E-Mail-Auswahl konnte nicht geladen werden. Bitte erneut versuchen.',
                ]
              : []),
          ]
            .filter((error): error is string => Boolean(error))
            .map(mailErrorMessage)
        ),
      ]
    : [];
  const teamsLookupError = connection.error || channels.error;
  const teamsNeedsSignIn =
    hasTeams &&
    ((connection.data?.ready && connection.data.status !== 'connected') ||
      [
        'connection_required',
        'reconnect_required',
        'consent_required',
        'login_required',
        'interaction_required',
      ].includes(errorCode(teamsLookupError)));
  const teamsConfigurationError =
    hasTeams &&
    ((connection.isSuccess && !connection.data.ready) ||
      errorCode(teamsLookupError) === 'not_configured');
  const teamsBlockedReasons = [
    ...new Set(
      automated
        .filter((item) => item.sequence === 'microsoft_send_teams_message')
        .map((item) => item.blockedReason)
        .filter((reason): reason is string => Boolean(reason))
    ),
  ];
  const teamsMessage = !hasTeams
    ? null
    : teamsConfigurationError
      ? microsoftConfigurationHelp
      : teamsNeedsSignIn
        ? teamsSignInHelp
        : teamsLookupError
          ? 'Teams-Kanäle konnten nicht geladen werden. Bitte erneut versuchen. Falls das Problem weiterhin besteht, bitte die Administration, den Zugriff auf die Teams-Kanäle zu prüfen.'
          : connection.isSuccess && !connection.data.live
            ? 'Sequenzen werden in dieser Umgebung nicht ausgeführt.'
            : connection.isPending
              ? null
              : (teamsBlockedReasons[0] ?? null);
  const otherBlockedReasons = [
    ...new Set(
      automated
        .filter(
          (item) =>
            !isMailSequence(item.sequence) &&
            item.sequence !== 'microsoft_send_teams_message'
        )
        .map((item) => item.blockedReason)
        .filter((reason): reason is string => Boolean(reason))
    ),
  ];
  const retryTeams = async () => {
    const result = await connection.refetch();
    if (result.data?.ready && result.data.status === 'connected')
      await channels.refetch();
  };
  const change = (id: string, patch: AutomationChoice) =>
    setChoices((current) => ({
      ...current,
      [id]: { ...current[id], ...patch },
    }));

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium">{template.name}</p>
      {template.mocked && (
        <p className="text-xs text-muted-foreground">
          Lokale Simulation · Erfolg nach ca. 10 Sekunden. Es werden keine
          Nachrichten gesendet oder Konten bei Microsoft oder Crewmeister
          geändert.
        </p>
      )}
      {automated.length > 0 && (
        <Accordion type="multiple" className="gap-2">
          {automated.map((item) => {
            const choice = effectiveChoices[item.id];
            const isMail = isMailSequence(item.sequence);
            const isTeams = item.sequence === 'microsoft_send_teams_message';
            return (
              <AccordionItem
                value={item.id}
                key={item.id}
                className="min-w-0 rounded-lg border border-border p-2"
              >
                <AccordionTrigger disabled={busy} className="py-0">
                  {item.title}
                </AccordionTrigger>
                <AccordionContent>
                  <fieldset
                    disabled={busy}
                    aria-label={item.title}
                    className="mt-2 min-w-0 space-y-2"
                  >
                    <FieldRow label="Aktion">
                      <p className="truncate text-right text-xs">
                        {sequenceLabel(item.sequence)}
                      </p>
                    </FieldRow>
                    {item.sequence === 'microsoft_create_account' && (
                      <MicrosoftLicenseStatus />
                    )}
                    {(isMail || isTeams) && (
                      <FieldRow label="Absender">
                        {isMail ? (
                          <Select
                            value={choice.senderAddress ?? ''}
                            onValueChange={(value) =>
                              change(item.id, { senderAddress: value })
                            }
                            disabled={busy}
                          >
                            <SelectTrigger
                              aria-label={`Absender für ${item.title}`}
                              className="h-8 w-full text-xs"
                            >
                              <SelectValue placeholder="Wählen" />
                            </SelectTrigger>
                            <SelectContent>
                              {senders.data?.addresses
                                .filter((sender) => sender.kind === 'mailbox')
                                .map((sender) => (
                                  <SelectItem
                                    key={sender.email}
                                    value={sender.email}
                                  >
                                    {sender.label}
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <p className="truncate text-right text-xs">
                            {connection.data?.account?.username ??
                              'Nicht verbunden'}
                          </p>
                        )}
                      </FieldRow>
                    )}
                    {isMail && (
                      <FieldRow label="Empfänger">
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              type="button"
                              variant="outline"
                              disabled={busy}
                              aria-label={`Empfänger für ${item.title}`}
                              className="h-8 w-full justify-between px-2 text-xs font-normal"
                            >
                              <span className="truncate">
                                {selectionLabel(
                                  (choice.recipients ?? []).map(
                                    (recipient) => recipient.label
                                  )
                                )}
                              </span>
                              <ChevronDown
                                className="size-4 shrink-0 text-muted-foreground"
                                aria-hidden="true"
                              />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent
                            align="end"
                            className="w-[var(--radix-popover-trigger-width)] p-2"
                            aria-label={`Empfänger für ${item.title}`}
                          >
                            <div className="max-h-60 space-y-1 overflow-y-auto">
                              {[...recipients.values()].map((recipient) => {
                                const key = recipientKey(recipient);
                                const checked =
                                  choice.recipients?.some(
                                    (selected) => recipientKey(selected) === key
                                  ) ?? false;
                                return (
                                  <Label
                                    key={key}
                                    className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-2 text-xs hover:bg-accent hover:text-accent-foreground focus-within:bg-accent focus-within:text-accent-foreground"
                                  >
                                    <Checkbox
                                      disabled={busy}
                                      checked={checked}
                                      onCheckedChange={() =>
                                        change(item.id, {
                                          recipients: checked
                                            ? choice.recipients?.filter(
                                                (selected) =>
                                                  recipientKey(selected) !== key
                                              )
                                            : [
                                                ...(choice.recipients ?? []),
                                                recipient,
                                              ],
                                        })
                                      }
                                    />
                                    {recipient.label}
                                  </Label>
                                );
                              })}
                              {mail.isSuccess &&
                                mailErrors.length === 0 &&
                                recipients.size === 0 && (
                                  <p className="text-xs">
                                    Keine Empfänger vorhanden.
                                  </p>
                                )}
                            </div>
                          </PopoverContent>
                        </Popover>
                      </FieldRow>
                    )}
                    {isTeams && (
                      <FieldRow label="Empfänger">
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              type="button"
                              variant="outline"
                              disabled={busy}
                              aria-label={`Empfänger für ${item.title}`}
                              className="h-8 w-full justify-between px-2 text-xs font-normal"
                            >
                              <span className="truncate">
                                {selectionLabel(
                                  (choice.destinations ?? []).map(
                                    (destination) =>
                                      channels.data?.channels.find(
                                        (channel) =>
                                          channel.teamId ===
                                            destination.teamId &&
                                          channel.channelId ===
                                            destination.channelId
                                      )?.label ?? 'Kanal'
                                  )
                                )}
                              </span>
                              <ChevronDown
                                className="size-4 shrink-0 text-muted-foreground"
                                aria-hidden="true"
                              />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent
                            align="end"
                            className="w-[var(--radix-popover-trigger-width)] p-2"
                            aria-label="Teams-Kanäle"
                          >
                            <div className="max-h-60 space-y-1 overflow-y-auto">
                              {channels.data?.channels.map((channel) => {
                                const matches = (destination: {
                                  teamId: string;
                                  channelId: string;
                                }) =>
                                  destination.teamId === channel.teamId &&
                                  destination.channelId === channel.channelId;
                                const checked =
                                  choice.destinations?.some(matches) ?? false;
                                return (
                                  <Label
                                    key={`${channel.teamId}:${channel.channelId}`}
                                    className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-2 text-xs hover:bg-accent hover:text-accent-foreground focus-within:bg-accent focus-within:text-accent-foreground"
                                  >
                                    <Checkbox
                                      disabled={busy}
                                      checked={checked}
                                      onCheckedChange={() =>
                                        change(item.id, {
                                          destinations: checked
                                            ? choice.destinations?.filter(
                                                (destination) =>
                                                  !matches(destination)
                                              )
                                            : [
                                                ...(choice.destinations ?? []),
                                                {
                                                  teamId: channel.teamId,
                                                  channelId: channel.channelId,
                                                },
                                              ],
                                        })
                                      }
                                    />
                                    {channel.label}
                                  </Label>
                                );
                              })}
                              {channels.isSuccess &&
                                channels.data.channels.length === 0 && (
                                  <p className="text-xs">
                                    Keine Kanäle vorhanden.
                                  </p>
                                )}
                            </div>
                          </PopoverContent>
                        </Popover>
                      </FieldRow>
                    )}
                  </fieldset>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      )}
      {(mailErrors.length > 0 ||
        teamsMessage ||
        otherBlockedReasons.length > 0) && (
        <section
          aria-label="Probleme mit Automatisierungen"
          className="space-y-3"
        >
          {mailErrors.length > 0 && (
            <Alert variant="destructive" className="space-y-2 text-xs">
              <AlertTitle>E-Mail-Versand nicht bereit</AlertTitle>
              {mailErrors.map((error) => (
                <p key={error}>{error}</p>
              ))}
              <a
                href="/settings/integrations"
                className="inline-block underline"
              >
                Microsoft-Zugangsdaten prüfen
              </a>
            </Alert>
          )}
          {teamsMessage && (
            <Alert variant="destructive" className="space-y-2 text-xs">
              <AlertTitle>Teams-Versand nicht bereit</AlertTitle>
              <p>{teamsMessage}</p>
              {teamsConfigurationError ? (
                <a
                  href="/settings/integrations"
                  className="inline-block underline"
                >
                  Microsoft-Zugangsdaten prüfen
                </a>
              ) : teamsNeedsSignIn ? (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={busy || reconnect.isPending}
                    onClick={() => reconnect.mutate()}
                  >
                    {reconnect.isPending && (
                      <Spinner className="size-4" aria-hidden="true" />
                    )}
                    Erneut bei Microsoft anmelden
                  </Button>
                  {reconnect.isError && (
                    <p>
                      Die Microsoft-Anmeldung konnte nicht gestartet werden.
                      Bitte erneut versuchen oder die Teams-Verbindung unter
                      Einstellungen → Integrationen prüfen.{' '}
                      <a href="/settings/integrations" className="underline">
                        Teams-Einstellungen öffnen
                      </a>
                    </p>
                  )}
                </>
              ) : teamsLookupError ? (
                <Button
                  type="button"
                  variant="outline"
                  disabled={
                    busy || connection.isFetching || channels.isFetching
                  }
                  onClick={() => void retryTeams()}
                >
                  Teams-Verbindung erneut prüfen
                </Button>
              ) : null}
            </Alert>
          )}
          {otherBlockedReasons.map((reason) => (
            <Alert key={reason} variant="destructive" className="text-xs">
              {reason}
            </Alert>
          ))}
        </section>
      )}
      <div className="flex flex-col gap-1">
        {automated.length > 0 && (
          <Button
            type="button"
            disabled={busy || !ready}
            aria-busy={busy && startingAutomation}
            onClick={() => {
              setStartingAutomation(true);
              onApply(true, effectiveChoices);
            }}
          >
            {busy && startingAutomation && (
              <Spinner className="size-4" aria-hidden="true" />
            )}
            Automatisierung starten
          </Button>
        )}
        <Button
          type="button"
          variant={automated.length ? 'outline' : 'default'}
          disabled={busy}
          aria-busy={busy && !startingAutomation}
          onClick={() => {
            setStartingAutomation(false);
            onApply(false, {});
          }}
        >
          {busy && !startingAutomation && (
            <Spinner className="size-4" aria-hidden="true" />
          )}
          {automated.length ? 'Ohne Automatisierung' : 'Aufgaben erstellen'}
        </Button>
      </div>
    </div>
  );
}
