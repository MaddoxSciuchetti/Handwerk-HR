import { Alert, AlertDescription } from '@/components/ui/alert';
import ResetPasswordForm from '@/features/auth/components/ResetPasswordForm';
import { useNavigate, useSearch } from '@tanstack/react-router';
import { AlertCircle } from 'lucide-react';
import { currentDate } from '../utils/dateNow';
import DoorManCard from './resuable/DoorManCard';

const ResetPassword = () => {
  const navigate = useNavigate();
  const search = useSearch({ from: '/password/reset' }) as {
    code?: string;
    exp?: string | number;
  };

  const code = search.code as string | undefined;
  const exp = search.exp ? Number(search.exp) : undefined;

  const linkIsValid = code && exp && exp > currentDate;
  if (linkIsValid) {
    return <ResetPasswordForm code={code} />;
  }

  return (
    <DoorManCard>
      <div className="flex flex-col items-center space-y-4 text-center">
        <Alert variant="destructive" className="w-fit rounded-xl">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Invalid Link</AlertDescription>
        </Alert>
        <p className="text-muted-foreground">
          The link is either invalid or expired.
        </p>
        <button
          onClick={() => navigate({ to: '/password/forgot' })}
          className="text-primary underline hover:text-primary/80"
        >
          Request a new password reset link
        </button>
      </div>
    </DoorManCard>
  );
};

export { ResetPassword };
