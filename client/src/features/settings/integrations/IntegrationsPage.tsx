import useAuth from '@/features/user-profile/hooks/useAuth';
import { TeamsConnectionCard } from '@/features/microsoft-teams/TeamsConnectionCard';
import { IntegrationsSkeleton } from './IntegrationsSkeleton';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SettingsPageHeader } from '@/features/settings/components/SettingsPageHeader';
import { IntegrationSwitch } from './IntegrationSwitch';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';
import { toast } from 'sonner';
import {
  getIntegrations,
  saveIntegration,
  type OrganizationIntegration,
} from './integrations.api';

const QUERY_KEY = ['settings', 'integrations'];

function IntegrationFields({
  title,
  icon,
  actions,
  children,
}: {
  title: string;
  icon: ReactNode;
  actions: ReactNode;
  children: ReactNode;
}) {
  return (
    <Accordion type="single" collapsible className="min-w-0">
      <AccordionItem value="settings" className="border-0">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <AccordionTrigger
            type="button"
            className="w-fit flex-none items-center gap-2 py-1 text-base font-semibold hover:no-underline"
          >
            <span
              className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-border bg-background"
              aria-hidden="true"
            >
              {icon}
            </span>
            {title}
          </AccordionTrigger>
          <div className="flex flex-wrap items-center gap-3">{actions}</div>
        </div>
        <AccordionContent className="flex h-auto flex-col gap-3 pt-4 pb-0">
          {children}
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}

function MicrosoftForm({
  integration,
}: {
  integration: OrganizationIntegration;
}) {
  const queryClient = useQueryClient();
  const [enabled, setEnabled] = useState(integration.enabled);
  const [tenantId, setTenantId] = useState(integration.tenantId);
  const [clientId, setClientId] = useState(integration.clientId);
  const [domain, setDomain] = useState(integration.domain);
  const [licenseSkuId, setLicenseSkuId] = useState(integration.licenseSkuId);
  const [clientSecret, setClientSecret] = useState('');
  const save = useMutation({
    mutationFn: () =>
      saveIntegration('microsoft_graph', {
        enabled,
        tenantId,
        clientId,
        domain,
        licenseSkuId,
        clientSecret,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      toast.success('Microsoft 365 wurde gespeichert.');
    },
    onError: (error: { message?: string }) => {
      toast.error(
        error.message || 'Microsoft 365 konnte nicht gespeichert werden.'
      );
    },
  });

  return (
    <form
      className="flex min-w-0 flex-col gap-3 border-b border-border px-3 py-6"
      onSubmit={(event) => {
        event.preventDefault();
        save.mutate();
      }}
    >
      <IntegrationFields
        title="Microsoft 365"
        icon={
          <svg viewBox="0 0 24 24" className="size-7" fill="none">
            <path fill="#F25022" d="M1 1h10v10H1z" />
            <path fill="#7FBA00" d="M13 1h10v10H13z" />
            <path fill="#00A4EF" d="M1 13h10v10H1z" />
            <path fill="#FFB900" d="M13 13h10v10H13z" />
          </svg>
        }
        actions={
          <>
            <IntegrationSwitch
              label="Microsoft 365"
              checked={enabled}
              onChange={setEnabled}
            />
            <Button type="submit" disabled={save.isPending}>
              Speichern
            </Button>
          </>
        }
      >
        <Label htmlFor="microsoft-tenant">Tenant-ID</Label>
        <Input
          id="microsoft-tenant"
          value={tenantId}
          onChange={(event) => setTenantId(event.target.value)}
        />
        <Label htmlFor="microsoft-client">Client-ID</Label>
        <Input
          id="microsoft-client"
          value={clientId}
          onChange={(event) => setClientId(event.target.value)}
        />
        <Label htmlFor="microsoft-secret">Client-Geheimnis</Label>
        <Input
          id="microsoft-secret"
          type="text"
          autoComplete="off"
          spellCheck={false}
          value={clientSecret}
          placeholder={
            integration.hasClientSecret ? 'Neues Geheimnis eingeben' : ''
          }
          onChange={(event) => setClientSecret(event.target.value)}
        />
        <p className="text-sm text-muted-foreground">
          {clientSecret.trim()
            ? 'Dieser Text ersetzt das gespeicherte Geheimnis.'
            : integration.hasClientSecret
              ? 'Leer lassen behält das gespeicherte Geheimnis.'
              : 'Das Geheimnis wird so gespeichert, wie es hier steht.'}
        </p>
        <Label htmlFor="microsoft-domain">Domäne (für Kontoanlage)</Label>
        <Input
          id="microsoft-domain"
          value={domain}
          onChange={(event) => setDomain(event.target.value)}
        />
        <Label htmlFor="microsoft-sku">Lizenz-SKU (für Kontoanlage)</Label>
        <Input
          id="microsoft-sku"
          value={licenseSkuId}
          onChange={(event) => setLicenseSkuId(event.target.value)}
        />
      </IntegrationFields>
    </form>
  );
}

function CrewmeisterForm({
  integration,
}: {
  integration: OrganizationIntegration;
}) {
  const queryClient = useQueryClient();
  const [enabled, setEnabled] = useState(integration.enabled);
  const [token, setToken] = useState('');
  const [crewId, setCrewId] = useState(integration.crewId);
  const save = useMutation({
    mutationFn: () =>
      saveIntegration('crewmeister', { enabled, token, crewId }),
    onSuccess: async () => {
      setToken('');
      await queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      toast.success('Crewmeister wurde gespeichert.');
    },
    onError: (error: { message?: string }) => {
      toast.error(
        error.message || 'Crewmeister konnte nicht gespeichert werden.'
      );
    },
  });

  return (
    <form
      className="flex min-w-0 flex-col gap-3 px-3 py-6"
      onSubmit={(event) => {
        event.preventDefault();
        save.mutate();
      }}
    >
      <IntegrationFields
        title="Crewmeister"
        icon={
          <img
            src="/assets/crewmeister-logo.png"
            alt=""
            width={28}
            height={28}
            className="size-7 rounded-md"
          />
        }
        actions={
          <>
            <IntegrationSwitch
              label="Crewmeister"
              checked={enabled}
              onChange={setEnabled}
            />
            <Button type="submit" disabled={save.isPending}>
              Speichern
            </Button>
          </>
        }
      >
        <Label htmlFor="crewmeister-token">
          Token{integration.hasToken ? ' (gespeichert)' : ''}
        </Label>
        <Input
          id="crewmeister-token"
          type="password"
          autoComplete="new-password"
          value={token}
          placeholder={integration.hasToken ? 'Unverändert lassen' : ''}
          onChange={(event) => setToken(event.target.value)}
        />
        <Label htmlFor="crewmeister-crew">
          Crew-ID, wenn der Token mehrere Crews sieht
        </Label>
        <Input
          id="crewmeister-crew"
          value={crewId}
          onChange={(event) => setCrewId(event.target.value)}
        />
      </IntegrationFields>
    </form>
  );
}

function OrganizationIntegrations() {
  const query = useQuery({ queryKey: QUERY_KEY, queryFn: getIntegrations });

  const integrations = query.data ?? [];
  const microsoft = integrations.find(
    (item) => item.provider === 'microsoft_graph'
  );
  const crewmeister = integrations.find(
    (item) => item.provider === 'crewmeister'
  );

  return (
    <>
      {query.isLoading ? (
        <IntegrationsSkeleton />
      ) : query.isError || !microsoft || !crewmeister ? (
        <p className="px-3 py-6 text-sm text-destructive">
          Integrationen konnten nicht geladen werden.
        </p>
      ) : (
        <div className="min-w-0 w-full">
          <MicrosoftForm key={microsoft.tenantId} integration={microsoft} />
          <CrewmeisterForm key={crewmeister.crewId} integration={crewmeister} />
        </div>
      )}
    </>
  );
}

export function IntegrationsPage() {
  const { user } = useAuth();

  return (
    <div className="mx-auto flex h-full min-h-0 min-w-0 w-full max-w-full flex-col overflow-hidden rounded-2xl bg-card p-4 text-card-foreground sm:p-6 md:max-w-8xl">
      <SettingsPageHeader title="Integrationen" />
      <div className="min-h-0 min-w-0 w-full flex-1 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {user?.membershipRole === 'admin' && <OrganizationIntegrations />}
        {user && (
          <section aria-labelledby="plugins-heading" className="mt-6 pb-6">
            <h2 id="plugins-heading" className="typo-h4 mb-5 font-bold">
              Plugins
            </h2>
            <TeamsConnectionCard user={user} />
          </section>
        )}
      </div>
    </div>
  );
}
