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
          className="w-fit rounded-xl mb-3 border-yellow-200 bg-yellow-50"
        >
          <AlertTriangle className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-800">
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
