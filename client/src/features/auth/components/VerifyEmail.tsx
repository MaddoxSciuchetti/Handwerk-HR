import LoadingAlert from '@/components/alerts/LoadingAlert';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { useNavigate, useParams } from '@tanstack/react-router';
import { verifyEmail } from '../api/auth.api';
import DoorManWrapper from './resuable/DoorManCard';

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
    <DoorManWrapper>
      <div className="text-center">
        <div className="flex flex-col items-center space-y-4">
          <p
            className={`w-fit rounded-xl px-4 py-2 ${
              isSuccess
                ? 'border border-(--status-success-foreground) bg-(--status-success-bg) text-(--status-success-foreground)'
                : 'border border-(--status-error-foreground) bg-(--status-error-bg) text-(--status-error-foreground)'
            }`}
          >
            {isSuccess ? 'Email Verified!' : 'Invalid Link'}
          </p>
          {isError && (
            <p className="text-muted-foreground">
              The link is either invalid or expired.{' '}
              <Button
                type="button"
                variant="link"
                onClick={() => navigate({ to: '/' })}
                className="h-auto p-0 text-foreground underline hover:bg-transparent hover:text-accent-foreground"
              >
                Get a new link
              </Button>
            </p>
          )}
          <Button
            type="button"
            variant="link"
            onClick={() => navigate({ to: '/' })}
            className="h-auto p-0 text-foreground hover:bg-transparent hover:text-accent-foreground hover:no-underline"
          >
            Jetzt Einloggen
          </Button>
        </div>
      </div>
    </DoorManWrapper>
  );
}

export { VerifyEmail };
