import { QuestionnaireTemplatePage } from '@/features/settings/questionnaire/QuestionnaireTemplatePage';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/settings/questionnaire')({
  component: RouteComponent,
});

function RouteComponent() {
  return <QuestionnaireTemplatePage />;
}
