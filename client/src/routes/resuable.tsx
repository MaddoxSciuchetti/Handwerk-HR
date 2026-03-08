import DoorManCard from '@/features/auth/components/resuable/doorManCard';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/resuable')({
  component: RouteComponent,
});

function RouteComponent() {
  return <DoorManCard />;
}
