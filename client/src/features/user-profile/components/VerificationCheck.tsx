import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';
type VerificationCheckProps = {
  verified: boolean;
  email: string;
};

const VerificationCheck = ({ verified, email }: VerificationCheckProps) => {
  return (
    <>
      {!verified && (
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
      <p className="text-black mb-2">
        Email: <span className="text-black">{email}</span>
      </p>
    </>
  );
};

export default VerificationCheck;
