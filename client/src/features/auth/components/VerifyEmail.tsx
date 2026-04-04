import LoadingAlert from '@/components/alerts/LoadingAlert';
import { useQuery } from '@tanstack/react-query';
import { useNavigate, useParams } from '@tanstack/react-router';
import { verifyEmail } from '../api/auth.api';
import DoorManCard from './resuable/DoorManCard';

function VerifyEmail() {
  const code = useParams({ from: '/email/verify/$code' });

  const navigate = useNavigate();
  const { isPending, isSuccess, isError } = useQuery({
    queryKey: ['emailVerification', code],
    queryFn: () => verifyEmail(code),
    refetchOnWindowFocus: false,
    staleTime: Infinity,
  });

  if (isPending) return <LoadingAlert />;

  return (
    <DoorManCard>
      <div className="text-center">
        <div className="flex flex-col items-center space-y-4">
          <p
            className={`w-fit rounded-xl px-4 py-2 ${
              isSuccess
                ? 'border border-[var(--status-success-foreground)] bg-[var(--status-success-bg)] text-[var(--status-success-foreground)]'
                : 'border border-[var(--status-error-foreground)] bg-[var(--status-error-bg)] text-[var(--status-error-foreground)]'
            }`}
          >
            {isSuccess ? 'Email Verified!' : 'Invalid Link'}
          </p>
          {isError && (
            <p className="text-muted-foreground">
              The link is either invalid or expired.{' '}
              <button
                onClick={() => navigate({ to: '/' })}
                className="text-foreground underline hover:text-accent-foreground"
              >
                Get a new link
              </button>
            </p>
          )}
          <button
            onClick={() => navigate({ to: '/' })}
            className="text-foreground hover:text-accent-foreground"
          >
            Jetzt Einloggen
          </button>
        </div>
      </div>
    </DoorManCard>
  );
}

export { VerifyEmail };
