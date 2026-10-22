import { createFileRoute } from '@tanstack/react-router';
import { GeneralSettings } from '@/features/settings/general/GeneralSettings';

export const Route = createFileRoute('/settings/general')({
  component: GeneralSettings,
});
