import { useQuery } from '@tanstack/react-query';
import { useNavigate, useParams } from '@tanstack/react-router';
import { verifyEmail } from '../api/auth.api';

function VerifyEmail() {
  const code = useParams({ from: '/email/verify/$code' });
  console.log(code);

  const navigate = useNavigate();
  const { isPending, isSuccess, isError } = useQuery({
    queryKey: ['emailVerification', code],
    queryFn: () => verifyEmail(code),
    refetchOnWindowFocus: false,
    staleTime: Infinity,
  });

  return (
    <div className="min-h-screen flex justify-center mt-12">
      <div className="mx-auto max-w-md py-12 px-6 text-center">
        {isPending ? (
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto" />
        ) : (
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
                  className="text-blue-500 hover:text-blue-700 underline"
                >
                  Get a new link
                </button>
              </p>
            )}
            <button
              onClick={() => navigate({ to: '/' })}
              className="text-blue-500 hover:text-blue-700 underline"
            >
              Back to home
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export { VerifyEmail };
