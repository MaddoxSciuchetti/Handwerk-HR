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
                ? 'bg-green-100 text-green-800 border border-green-200'
                : 'bg-red-100 text-red-800 border border-red-200'
            }`}
          >
            {isSuccess ? 'Email Verified!' : 'Invalid Link'}
          </p>
          {isError && (
            <p className="text-gray-400">
              The link is either invalid or expired.{' '}
              <button
                onClick={() => navigate({ to: '/' })}
                className="text-white underline"
              >
                Get a new link
              </button>
            </p>
          )}
          <button onClick={() => navigate({ to: '/' })} className="text-white ">
            Back to home
          </button>
        </div>
      </div>
    </DoorManCard>
  );
}

export { VerifyEmail };
