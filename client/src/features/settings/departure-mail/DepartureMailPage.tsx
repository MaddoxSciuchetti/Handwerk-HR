import LoadingAlert from '@/components/alerts/LoadingAlert';
import { SettingsPageHeader } from '@/features/settings/components/SettingsPageHeader';
import { Table } from '@/features/settings/components/Table';
import { DepartureMailForm } from './DepartureMailForm';
import { useDepartureMail } from './useDepartureMail';

export function DepartureMailPage() {
  const { data, isLoading, isError } = useDepartureMail();

  if (isLoading) {
    return <LoadingAlert />;
  }

  return (
    <div className="mx-auto flex h-full min-h-0 flex-col overflow-hidden rounded-2xl bg-card p-6 text-card-foreground md:max-w-8xl">
      <div className="flex h-full min-h-0 w-full flex-col items-center">
        <SettingsPageHeader
          title="Infomail Entlassung"
          description="Mail an das Team, wenn ein Mitarbeiter entlassen wird"
        />
        <Table className="min-h-0 w-200 flex-1 overflow-auto">
          {isError || !data ? (
            <p className="px-3 py-6 text-sm text-destructive">
              Die Entlassungsmail konnte nicht geladen werden.
            </p>
          ) : (
            <DepartureMailForm page={data} />
          )}
        </Table>
      </div>
    </div>
  );
}
