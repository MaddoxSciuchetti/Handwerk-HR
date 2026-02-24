import MitarbeiterÜbersicht from '@/features/Mitarbeiter-Uebersicht';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/mitarbeiter-uebersicht')({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <>
      <MitarbeiterÜbersicht />
    </>
  );
}
