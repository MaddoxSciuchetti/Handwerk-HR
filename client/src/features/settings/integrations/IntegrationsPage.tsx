import { MicrosoftSimulationNotice } from './MicrosoftSimulationNotice';
import crewmeisterLogo from './crewmeister-logo.png';
import useAuth from '@/features/user-profile/hooks/useAuth';
import { TeamsConnectionCard } from '@/features/microsoft-teams/TeamsConnectionCard';
import { IntegrationsSkeleton } from './IntegrationsSkeleton';
import { ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SettingsPageHeader } from '@/features/settings/components/SettingsPageHeader';
import { IntegrationSwitch } from './IntegrationSwitch';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useId, useState, type ReactNode } from 'react';
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
  const [expanded, setExpanded] = useState(false);
  const contentId = useId();
  return (
    <section className="min-w-0 w-full">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="min-w-0">
          <button
            type="button"
            aria-expanded={expanded}
            aria-controls={contentId}
            onClick={() => setExpanded((value) => !value)}
            className="flex min-h-12 items-center gap-2 rounded-lg border-0 py-1 text-left text-base font-semibold outline-none focus-visible:underline focus-visible:underline-offset-4"
          >
            <span
              className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-border bg-background"
              aria-hidden="true"
            >
              {icon}
            </span>
            {title}
            <ChevronDown
              aria-hidden="true"
              className={`size-4 shrink-0 text-muted-foreground ${expanded ? 'rotate-180' : ''}`}
            />
          </button>
        </h3>
        <div className="flex flex-wrap items-center gap-3">{actions}</div>
      </div>
      <div id={contentId} hidden={!expanded}>
        <div className="flex min-w-0 flex-col gap-3 pt-4">{children}</div>
      </div>
    </section>
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
    onSuccess: (saved) => {
      setClientSecret('');
      queryClient.setQueryData<OrganizationIntegration[]>(
        QUERY_KEY,
        (current) =>
          current?.map((item) =>
            item.provider === saved.provider ? saved : item
          )
      );
      void queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      void queryClient.invalidateQueries({ queryKey: ['microsoft-teams'] });
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
        {integration.simulated && <MicrosoftSimulationNotice />}
        <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,2fr)] items-center gap-x-6 gap-y-3">
          <Label htmlFor="microsoft-tenant">Tenant-ID</Label>
          <Input
            autoComplete="off"
            spellCheck={false}
            id="microsoft-tenant"
            value={tenantId}
            onChange={(event) => setTenantId(event.target.value)}
          />
          <Label htmlFor="microsoft-client">Client-ID</Label>
          <Input
            autoComplete="off"
            spellCheck={false}
            id="microsoft-client"
            value={clientId}
            onChange={(event) => setClientId(event.target.value)}
          />
          <Label htmlFor="microsoft-secret">Client-Geheimnis</Label>
          <Input
            autoComplete="off"
            spellCheck={false}
            id="microsoft-secret"
            type="text"
            value={clientSecret}
            onChange={(event) => setClientSecret(event.target.value)}
          />
          <Label htmlFor="microsoft-domain">Domäne (für Kontoanlage)</Label>
          <Input
            autoComplete="off"
            spellCheck={false}
            id="microsoft-domain"
            value={domain}
            onChange={(event) => setDomain(event.target.value)}
          />
          <Label htmlFor="microsoft-sku">Lizenz-SKU (für Kontoanlage)</Label>
          <Input
            autoComplete="off"
            spellCheck={false}
            id="microsoft-sku"
            value={licenseSkuId}
            onChange={(event) => setLicenseSkuId(event.target.value)}
          />
        </div>
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
  const [tokenDraft, setToken] = useState<string | null>(null);
  const token = tokenDraft ?? integration.token ?? '';
  const [crewId, setCrewId] = useState(integration.crewId);
  const save = useMutation({
    mutationFn: () =>
      saveIntegration('crewmeister', { enabled, token, crewId }),
    onSuccess: (saved) => {
      setToken(null);
      queryClient.setQueryData<OrganizationIntegration[]>(
        QUERY_KEY,
        (current) =>
          current?.map((item) =>
            item.provider === saved.provider ? saved : item
          )
      );
      void queryClient.invalidateQueries({ queryKey: QUERY_KEY });
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
            src={crewmeisterLogo}
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
        <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,2fr)] items-center gap-x-6 gap-y-3">
          <Label htmlFor="crewmeister-token">
            Token{integration.hasToken ? ' (gespeichert)' : ''}
          </Label>
          <Input
            autoComplete="off"
            spellCheck={false}
            id="crewmeister-token"
            type="text"
            value={token}
            onChange={(event) => setToken(event.target.value)}
          />
          <Label htmlFor="crewmeister-crew">
            Crew-ID, wenn der Token mehrere Crews sieht
          </Label>
          <Input
            autoComplete="off"
            spellCheck={false}
            id="crewmeister-crew"
            value={crewId}
            onChange={(event) => setCrewId(event.target.value)}
          />
        </div>
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
          {integrations.some((item) => !item.live && !item.simulated) && (
            <p role="note" className="px-3 pt-4 text-sm text-muted-foreground">
              Zugangsdaten können gespeichert werden. Live-Sequenzen werden in
              dieser Umgebung nicht ausgeführt.
            </p>
          )}
          <MicrosoftForm key={microsoft.provider} integration={microsoft} />
          <CrewmeisterForm
            key={crewmeister.provider}
            integration={crewmeister}
          />
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
      <div className="min-h-0 min-w-0 w-full flex-1 overflow-x-hidden overflow-y-auto overscroll-contain [overflow-anchor:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
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
