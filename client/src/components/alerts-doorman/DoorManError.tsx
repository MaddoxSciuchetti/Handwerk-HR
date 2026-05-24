import DoorManWrapper from '@/features/auth/components/resuable/DoorManCard';
import { useNavigate } from '@tanstack/react-router';
import { Button } from '../ui/button';

export function DoorManCard({
  title,
  message,
  alternativeMessage,
  actiontext,
  actionUrl,
}: {
  title: string;
  message: string;
  alternativeMessage: string;
  actiontext: string;
  actionUrl: string;
}) {
  const navigate = useNavigate();
  return (
    <DoorManWrapper>
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">{title}</h2>
        <p className="text-sm text-muted-foreground">
          {message || alternativeMessage}
        </p>
        <Button className="w-full" onClick={() => navigate({ to: actionUrl })}>
          {actiontext}
        </Button>
      </div>
    </DoorManWrapper>
  );
}
