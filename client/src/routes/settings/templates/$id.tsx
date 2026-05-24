import { TemplateTasks } from '@/features/template-tasks/components/template-items/TemplateTasks';
import { createFileRoute } from '@tanstack/react-router';
import z from 'zod/v3';

export const Route = createFileRoute('/settings/templates/$id')({
  validateSearch: z.object({
    name: z.string(),
  }),
  component: RouteComponent,
});

function RouteComponent() {
  const { id } = Route.useParams();
  const { name } = Route.useSearch();
  return <TemplateTasks templateId={id} name={name} />;
}
