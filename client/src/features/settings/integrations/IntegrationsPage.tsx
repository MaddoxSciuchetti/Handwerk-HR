import { IntegrationsSkeleton } from './IntegrationsSkeleton';
import { MicrosoftSimulationNotice } from './MicrosoftSimulationNotice';
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
import { cn } from '@/lib/utils';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';
import { toast } from 'sonner';
import {
  getIntegrations,
  saveIntegration,
  type OrganizationIntegration,
} from './integrations.api';

const QUERY_KEY = ['settings', 'integrations'];

function EnabledSwitch({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={checked ? 'Aktiv' : 'Inaktiv'}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative h-5 w-9 shrink-0 rounded-full border outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring/50',
          checked ? 'border-primary bg-primary' : 'border-border bg-muted'
        )}
      >
        <span
          className={cn(
            'absolute top-1/2 left-0.5 size-3.5 -translate-y-1/2 rounded-full transition-transform',
            checked ? 'translate-x-4 bg-primary-foreground' : 'bg-foreground'
          )}
        />
      </button>
      <span className="text-sm text-muted-foreground">
        {checked ? 'Aktiv' : 'Inaktiv'}
      </span>
    </div>
  );
}

function CredentialFields({ children }: { children: ReactNode }) {
  return (
    <Accordion type="single" collapsible className="min-w-0">
      <AccordionItem value="credentials" className="border-0">
        <AccordionTrigger
          type="button"
          className="w-fit flex-none gap-1.5 py-1 hover:no-underline"
        >
          Zugangsdaten
        </AccordionTrigger>
        <AccordionContent className="flex flex-col gap-3 pt-2 pb-0">
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
      setClientSecret('');
      await queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      toast.success('Microsoft wurde gespeichert.');
    },
    onError: (error: { message?: string }) => {
      toast.error(
        error.message || 'Microsoft konnte nicht gespeichert werden.'
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
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-base font-semibold">Microsoft</h2>
        <div className="flex flex-wrap items-center gap-3">
          <EnabledSwitch checked={enabled} onChange={setEnabled} />
          <Button type="submit" disabled={save.isPending}>
            Speichern
          </Button>
        </div>
      </div>
      {integration.simulated && <MicrosoftSimulationNotice />}
      <CredentialFields>
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
        <Label htmlFor="microsoft-secret">
          Client-Geheimnis
          {integration.hasClientSecret ? ' (gespeichert)' : ''}
        </Label>
        <Input
          id="microsoft-secret"
          type="password"
          autoComplete="new-password"
          value={clientSecret}
          placeholder={integration.hasClientSecret ? 'Unverändert lassen' : ''}
          onChange={(event) => setClientSecret(event.target.value)}
        />
        <Label htmlFor="microsoft-domain">Domäne</Label>
        <Input
          id="microsoft-domain"
          value={domain}
          onChange={(event) => setDomain(event.target.value)}
        />
        <Label htmlFor="microsoft-sku">Lizenz-SKU</Label>
        <Input
          id="microsoft-sku"
          value={licenseSkuId}
          onChange={(event) => setLicenseSkuId(event.target.value)}
        />
      </CredentialFields>
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
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-base font-semibold">Crewmeister</h2>
        <div className="flex flex-wrap items-center gap-3">
          <EnabledSwitch checked={enabled} onChange={setEnabled} />
          <Button type="submit" disabled={save.isPending}>
            Speichern
          </Button>
        </div>
      </div>
      <CredentialFields>
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
      </CredentialFields>
    </form>
  );
}

export function IntegrationsPage() {
  const query = useQuery({ queryKey: QUERY_KEY, queryFn: getIntegrations });

  const integrations = query.data ?? [];
  const microsoft = integrations.find(
    (item) => item.provider === 'microsoft_graph'
  );
  const crewmeister = integrations.find(
    (item) => item.provider === 'crewmeister'
  );

  return (
    <div className="mx-auto flex h-full min-h-0 min-w-0 w-full max-w-full flex-col overflow-hidden rounded-2xl bg-card p-4 text-card-foreground sm:p-6 md:max-w-8xl">
      <SettingsPageHeader title="Integrationen" />
      {query.isLoading ? (
        <IntegrationsSkeleton />
      ) : query.isError || !microsoft || !crewmeister ? (
        <p className="px-3 py-6 text-sm text-destructive">
          Integrationen konnten nicht geladen werden.
        </p>
      ) : (
        <div className="min-h-0 min-w-0 w-full flex-1 overflow-y-auto">
          {integrations.some(
            (integration) => !integration.live && !integration.simulated
          ) && (
            <p role="note" className="px-3 pt-4 text-sm text-muted-foreground">
              Zugangsdaten können gespeichert werden. Live-Sequenzen werden in
              dieser Umgebung nicht ausgeführt.
            </p>
          )}
          <MicrosoftForm key={microsoft.tenantId} integration={microsoft} />
          <CrewmeisterForm key={crewmeister.crewId} integration={crewmeister} />
        </div>
      )}
    </div>
  );
}
