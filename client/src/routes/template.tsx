import TemplateTasks from '@/features/template-tasks/components/TemplateTask';
import { RouterContext } from '@/router';
import { createFileRoute, redirect } from '@tanstack/react-router';

export const Route = createFileRoute('/template')({
  beforeLoad: ({ context }: { context: RouterContext }) => {
    if (context.auth.user?.user_permission !== 'CHEF') {
      throw redirect({ to: '/login' });
    }
  },
  component: RouteComponent,
});

function RouteComponent() {
  return <TemplateTasks />;
}
