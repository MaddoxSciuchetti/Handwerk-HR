import { QuestionnaireForm } from '@/features/questionnaire/QuestionnaireForm';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/fragebogen/$token')({
  component: RouteComponent,
});

function RouteComponent() {
  const { token } = Route.useParams();
  return <QuestionnaireForm token={token} />;
}
