import { IntegrationsPage } from '@/features/settings/integrations/IntegrationsPage';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/settings/integrations')({
  component: IntegrationsPage,
});
