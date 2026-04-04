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
          className="mb-3 w-fit rounded-xl border border-[var(--status-warning-foreground)] bg-[var(--status-warning-bg)]"
        >
          <AlertTriangle className="h-4 w-4 text-[var(--status-warning-foreground)]" />
          <AlertDescription className="text-[var(--status-warning-foreground)]">
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
