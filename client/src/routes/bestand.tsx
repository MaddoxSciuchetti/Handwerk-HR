import { BestandPage } from '@/features/bestand/BestandPage';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/bestand')({
  component: RouteComponent,
});

function RouteComponent() {
  return <BestandPage />;
}
