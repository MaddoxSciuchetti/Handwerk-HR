import { useMutation, useQuery } from '@tanstack/react-query';
import useAuth from '@/features/user-profile/hooks/useAuth';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  getMicrosoftLicenseAvailability,
  pingMicrosoftLicenseAdmin,
} from '../../api/microsoftLicenses.api';

export function MicrosoftLicenseStatus({
  showAvailable = false,
  engagementId,
}: {
  showAvailable?: boolean;
  engagementId?: string;
}) {
  const { user } = useAuth();
  const licenses = useQuery({
    queryKey: ['microsoft-license-availability', user?.organizationId],
    queryFn: getMicrosoftLicenseAvailability,
    enabled: Boolean(user?.organizationId),
    staleTime: 0,
    refetchInterval: 60_000,
    retry: false,
  });
  const ping = useMutation({
    mutationFn: () => pingMicrosoftLicenseAdmin(engagementId!),
    onSuccess: () =>
      toast.success('Administration wurde per E-Mail informiert.'),
    onError: (error: { message?: string }) =>
      toast.error(
        error.message ||
          'E-Mail konnte nicht gesendet werden. Bitte erneut versuchen.'
      ),
  });
  const count = licenses.data?.available;
  const error = licenses.isError
    ? 'Microsoft-Lizenzen konnten nicht geladen werden. Bitte erneut versuchen.'
    : licenses.data?.error;
  const label = licenses.isPending
    ? 'Wird geladen…'
    : error
      ? 'Nicht verfügbar'
      : count == null
        ? '–'
        : String(count);
  const pingLabel = ping.isPending
    ? 'Sendet…'
    : ping.isSuccess
      ? 'Gesendet'
      : 'ping admin';
  return (
    <div className="grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
      <p
        className={`m-0 text-xs leading-none whitespace-nowrap ${count === 0 || error ? 'text-destructive' : 'text-muted-foreground'}`}
        role={count === 0 || error ? 'alert' : 'status'}
        title={
          error ||
          (count === 0
            ? 'Die Administration muss eine neue Microsoft-Lizenz kaufen.'
            : undefined)
        }
      >
        {showAvailable
          ? licenses.isPending
            ? 'Microsoft-Lizenzen werden geladen…'
            : error || count == null
              ? 'Microsoft-Lizenzanzahl nicht verfügbar'
              : `${count} ${count === 1 ? 'Microsoft-Lizenz' : 'Microsoft-Lizenzen'} verfügbar`
          : `Microsoft 365 - ${label}`}
      </p>
      {count === 0 && !error && engagementId ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="justify-self-end"
          disabled={ping.isPending || ping.isSuccess}
          onClick={() => ping.mutate()}
          title="Sendet eine E-Mail an die Administration mit der Bitte um eine neue Microsoft-Lizenz für diesen Mitarbeiter"
          aria-label={pingLabel}
        >
          {pingLabel}
        </Button>
      ) : null}
    </div>
  );
}
