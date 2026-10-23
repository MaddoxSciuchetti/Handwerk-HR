import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { isMailSequence } from '@/features/settings/integrations/integration.consts';
import {
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

const descriptions: Record<string, string> = {
  microsoft_create_account:
    'Legt ein Microsoft-365-Konto an und weist eine Lizenz zu.',
  crewmeister_create_account: 'Legt ein Crewmeister-Konto an.',
  microsoft_send_email:
    'Sendet die hinterlegte E-Mail-Vorlage an die gewählten Empfänger.',
  microsoft_send_onboarding_email:
    'Sendet die Onboarding-E-Mail an die gewählten Empfänger.',
  microsoft_send_offboarding_email:
    'Sendet die Offboarding-E-Mail an die gewählten Empfänger.',
  microsoft_send_teams_message:
    'Sendet die hinterlegte Nachricht an die gewählten Teams-Kanäle.',
  microsoft_deactivate_account: 'Sperrt die Anmeldung am Microsoft-365-Konto.',
};
const inputClass =
  'h-8 w-full rounded-lg border border-input bg-card px-2 text-sm';

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
  const change = (id: string, patch: AutomationChoice) =>
    setChoices((current) => ({
      ...current,
      [id]: { ...current[id], ...patch },
    }));

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium">{template.name}</p>
      {automated.length > 0 && (
        <>
          <p className="text-sm">Automatisierung starten?</p>
          <details className="text-xs">
            <summary className="cursor-pointer">Mehr anzeigen</summary>
            <ul className="mt-2 space-y-2">
              {automated.map((item) => (
                <li key={item.id}>
                  <span className="font-medium">{item.title}</span>
                  <p className="text-muted-foreground">
                    {descriptions[item.sequence!] ??
                      'Führt die konfigurierte Aktion aus.'}
                  </p>
                </li>
              ))}
            </ul>
            <p className="mt-2 text-muted-foreground">
              Diese Aktionen werden nach dem Start sofort ausgeführt.
            </p>
          </details>
          {automated.map((item) => {
            const choice = effectiveChoices[item.id];
            const isMail = isMailSequence(item.sequence);
            const isTeams = item.sequence === 'microsoft_send_teams_message';
            if (!isMail && !isTeams && !item.blockedReason) return null;
            return (
              <fieldset
                key={item.id}
                disabled={busy}
                className="min-w-0 space-y-2 rounded-lg border p-2"
              >
                <legend className="px-1 text-xs font-medium">
                  {item.title}
                </legend>
                {item.blockedReason && (
                  <p role="alert" className="text-xs text-destructive">
                    {item.blockedReason}
                  </p>
                )}
                {isMail && (
                  <>
                    <select
                      aria-label={`Absender für ${item.title}`}
                      className={inputClass}
                      value={choice.senderAddress ?? ''}
                      onChange={(event) =>
                        change(item.id, {
                          senderAddress: event.target.value || undefined,
                        })
                      }
                    >
                      <option value="">Absender wählen</option>
                      {senders.data?.addresses
                        .filter((sender) => sender.kind === 'mailbox')
                        .map((sender) => (
                          <option key={sender.email} value={sender.email}>
                            {sender.label}
                          </option>
                        ))}
                    </select>
                    <details>
                      <summary className="cursor-pointer text-xs">
                        Empfänger wählen ({choice.recipients?.length ?? 0})
                      </summary>
                      <div className="mt-1 max-h-36 space-y-1 overflow-y-auto">
                        {[...recipients.values()].map((recipient) => {
                          const key = recipientKey(recipient);
                          const checked =
                            choice.recipients?.some(
                              (selected) => recipientKey(selected) === key
                            ) ?? false;
                          return (
                            <label
                              key={key}
                              className="flex items-center gap-2 text-xs"
                            >
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() =>
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
                            </label>
                          );
                        })}
                        {mail.isSuccess && recipients.size === 0 && (
                          <p className="text-xs">Keine Empfänger vorhanden.</p>
                        )}
                      </div>
                    </details>
                    {(mail.isError || senders.isError) && (
                      <p role="alert" className="text-xs text-destructive">
                        E-Mail-Auswahl konnte nicht geladen werden.
                      </p>
                    )}
                    {mail.data?.groupsError && (
                      <p role="alert" className="text-xs text-destructive">
                        {mail.data.groupsError}
                      </p>
                    )}
                    {mail.data?.channelsError && (
                      <p role="alert" className="text-xs text-destructive">
                        {mail.data.channelsError}
                      </p>
                    )}
                  </>
                )}
                {isTeams && (
                  <>
                    {connection.isSuccess &&
                      !item.blockedReason &&
                      (connection.data.status !== 'connected' ||
                        !connection.data.ready) && (
                        <p role="alert" className="text-xs text-destructive">
                          Bitte Microsoft Teams in den Einstellungen verbinden.
                        </p>
                      )}
                    {connection.data?.account && (
                      <p className="text-xs">
                        {connection.data.account.username}
                      </p>
                    )}
                    <details>
                      <summary className="cursor-pointer text-xs">
                        Teams-Kanäle wählen ({choice.destinations?.length ?? 0})
                      </summary>
                      <div className="mt-1 max-h-36 space-y-1 overflow-y-auto">
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
                            <label
                              key={`${channel.teamId}:${channel.channelId}`}
                              className="flex items-center gap-2 text-xs"
                            >
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() =>
                                  change(item.id, {
                                    destinations: checked
                                      ? choice.destinations?.filter(
                                          (destination) => !matches(destination)
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
                            </label>
                          );
                        })}
                        {channels.isSuccess &&
                          channels.data.channels.length === 0 && (
                            <p className="text-xs">Keine Kanäle vorhanden.</p>
                          )}
                      </div>
                    </details>
                    {(connection.isError || channels.isError) && (
                      <p role="alert" className="text-xs text-destructive">
                        Teams-Auswahl konnte nicht geladen werden.
                      </p>
                    )}
                  </>
                )}
              </fieldset>
            );
          })}
        </>
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
            {busy && startingAutomation && <Spinner className="size-4" aria-hidden="true" />}
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
          {busy && !startingAutomation && <Spinner className="size-4" aria-hidden="true" />}
          {automated.length ? 'Ohne Automatisierung' : 'Aufgaben erstellen'}
        </Button>
      </div>
    </div>
  );
}
