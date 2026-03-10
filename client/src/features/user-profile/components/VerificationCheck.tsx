import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';
import { User } from '../types/auth.type';
type VerificationCheckProps = {
  user: User;
};

const VerificationCheck = ({ user }: VerificationCheckProps) => {
  return (
    <>
      {!user.verified && (
        <Alert
          variant="default"
          className="mb-3 w-fit rounded-xl border border-(--status-warning-foreground) bg-(--status-warning-bg)"
        >
          <AlertTriangle className="h-4 w-4 text-(--status-warning-foreground)" />
          <AlertDescription className="text-(--status-warning-foreground)">
            Verifiziere deine email
          </AlertDescription>
        </Alert>
      )}
      <p className="mb-2 text-foreground">
        Email: <span className="text-foreground">{user.email}</span>
      </p>
    </>
  );
};

export default VerificationCheck;
