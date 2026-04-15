import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/settings/templates/$id')({
  component: RouteComponent,
});

function RouteComponent() {
  const { id } = Route.useParams();
  return (
    <div className="p-6">
      <p className="typo-body-sm text-text-secondary">Template-ID</p>
      <p className="typo-body-lg text-text-primary">{id}</p>
    </div>
  );
}
