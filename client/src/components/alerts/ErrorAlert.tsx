import { Button } from '@/components/ui/button';
import { Link } from '@tanstack/react-router';

type IsErrorProps = {
  title?: string;
  suggestion?: string;
  message?: string;
};

const ErrorAlert = ({
  title = 'Fehler beim Laden',
  suggestion = 'Versuche es erneut, indem du dich neu einloggst.',
  message,
}: IsErrorProps) => {
  return (
    <>
      <div className="flex flex-col items-center mt-16 space-y-2">
        <h1 className="text-3xl font-bold">{title}</h1>
        <p className="text-destructive">{suggestion}</p>
        <p>{message}</p>
        <Button asChild className="mt-2" variant="outline" type="button">
          <Link to="/login">Zurück zum Login</Link>
        </Button>
      </div>
    </>
  );
};

export default ErrorAlert;
