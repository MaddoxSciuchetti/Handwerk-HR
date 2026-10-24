import { useQuery } from '@tanstack/react-query';
import useAuth from '@/features/user-profile/hooks/useAuth';
import { getMicrosoftLicenseAvailability } from '../../api/microsoftLicenses.api';

export function MicrosoftLicenseStatus() {
  const { user } = useAuth();
  const licenses = useQuery({
    queryKey: ['microsoft-license-availability', user?.organizationId],
    queryFn: getMicrosoftLicenseAvailability,
    enabled: Boolean(user?.organizationId),
    staleTime: 0,
    refetchInterval: 60_000,
    retry: false,
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
      Microsoft 365 - {label}
    </p>
  );
}
