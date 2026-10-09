import LoadingAlert from '@/components/alerts/LoadingAlert';
import { SettingsPageHeader } from '@/features/settings/components/SettingsPageHeader';
import { Table } from '@/features/settings/components/Table';
import { Microsoft365AutomationCard } from './Microsoft365AutomationCard';
import { useMicrosoft365Automation } from './useMicrosoft365Automation';

export function AutomationPage() {
  const { data, isLoading, isError } = useMicrosoft365Automation();

  if (isLoading) {
    return <LoadingAlert />;
  }

  return (
    <div className="mx-auto flex h-full min-h-0 flex-col overflow-hidden rounded-2xl bg-card p-6 text-card-foreground md:max-w-8xl">
      <div className="flex h-full min-h-0 w-full flex-col items-center">
        <SettingsPageHeader
          title="Automatisierung"
          description="Automatisierungen, die nach einem Schritt im Onboarding laufen"
        />
        <Table className="min-h-0 w-200 flex-1">
          {isError || !data ? (
            <p className="px-3 py-6 text-sm text-destructive">
              Automatisierung konnte nicht geladen werden.
            </p>
          ) : (
            <Microsoft365AutomationCard automation={data} />
          )}
        </Table>
      </div>
    </div>
  );
}
