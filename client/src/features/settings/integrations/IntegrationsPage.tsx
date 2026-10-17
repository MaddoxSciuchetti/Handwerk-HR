import LoadingAlert from '@/components/alerts/LoadingAlert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SettingsPageHeader } from '@/features/settings/components/SettingsPageHeader';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
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
    <label className="flex items-center gap-2 text-sm">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
      {checked ? 'Aktiv' : 'Inaktiv'}
    </label>
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
      toast.error(error.message || 'Microsoft konnte nicht gespeichert werden.');
    },
  });

  return (
    <form
      className="flex flex-col gap-3 border-b border-border px-3 py-6"
      onSubmit={(event) => {
        event.preventDefault();
        save.mutate();
      }}
    >
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-base font-semibold">Microsoft</h2>
        <EnabledSwitch checked={enabled} onChange={setEnabled} />
      </div>
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
      <Button type="submit" className="w-fit rounded-full" disabled={save.isPending}>
        Speichern
      </Button>
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
      className="flex flex-col gap-3 px-3 py-6"
      onSubmit={(event) => {
        event.preventDefault();
        save.mutate();
      }}
    >
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-base font-semibold">Crewmeister</h2>
        <EnabledSwitch checked={enabled} onChange={setEnabled} />
      </div>
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
      <Button type="submit" className="w-fit rounded-full" disabled={save.isPending}>
        Speichern
      </Button>
    </form>
  );
}

export function IntegrationsPage() {
  const query = useQuery({ queryKey: QUERY_KEY, queryFn: getIntegrations });

  if (query.isLoading) return <LoadingAlert />;

  const integrations = query.data ?? [];
  const microsoft = integrations.find(
    (item) => item.provider === 'microsoft_graph'
  );
  const crewmeister = integrations.find((item) => item.provider === 'crewmeister');

  return (
    <div className="mx-auto flex h-full min-h-0 flex-col overflow-hidden rounded-2xl bg-card p-6 text-card-foreground md:max-w-8xl">
      <SettingsPageHeader title="Integrationen" />
      {query.isError || !microsoft || !crewmeister ? (
        <p className="px-3 py-6 text-sm text-destructive">
          Integrationen konnten nicht geladen werden.
        </p>
      ) : (
        <div className="min-h-0 w-full flex-1 overflow-y-auto">
          {!microsoft.live ? (
            <p className="px-3 pt-4 text-sm text-muted-foreground">
              Sequenzen werden in dieser Umgebung nicht ausgeführt.
            </p>
          ) : null}
          <MicrosoftForm key={microsoft.tenantId} integration={microsoft} />
          <CrewmeisterForm key={crewmeister.crewId} integration={crewmeister} />
        </div>
      )}
    </div>
  );
}
