import { useMutation, useQuery } from '@tanstack/react-query';
import useAuth from '@/features/user-profile/hooks/useAuth';
import { toast } from 'sonner';
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
      : `${licenses.data?.occupied ?? '–'}/${licenses.data?.occupied != null && count != null ? licenses.data.occupied + count : '–'}`;
  return (
    <div className="flex items-center gap-2">
      <p
        className={`text-xs whitespace-nowrap ${count === 0 || error ? 'text-destructive' : 'text-muted-foreground'}`}
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
      {count === 0 && !error && engagementId && (
        <button
          type="button"
          className="text-xs text-blue-600 underline underline-offset-2 disabled:opacity-50"
          disabled={ping.isPending || ping.isSuccess}
          onClick={() => ping.mutate()}
          title="Administration um eine neue Microsoft-Lizenz für diesen Mitarbeiter bitten"
        >
          {ping.isPending ? 'Sendet…' : ping.isSuccess ? 'Gesendet' : 'Ping'}
        </button>
      )}
    </div>
  );
}
