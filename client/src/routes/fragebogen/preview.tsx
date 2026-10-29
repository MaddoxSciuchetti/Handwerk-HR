import { QuestionnaireForm } from '@/features/questionnaire/QuestionnaireForm';
import {
  candidateItems,
  readQuestionnaireDraft,
} from '@/features/questionnaire/questionnairePreview';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/fragebogen/preview')({
  component: RouteComponent,
});

function RouteComponent() {
  const draft = readQuestionnaireDraft();
  if (!draft) {
    return (
      <div className="min-h-dvh px-4 py-8">
        <p className="mx-auto max-w-3xl text-sm text-muted-foreground">
          Die Vorschau ist leer. Öffnen Sie sie aus dem Fragebogen.
        </p>
      </div>
    );
  }

  return (
    <QuestionnaireForm
      preview={{
        name: draft.name,
        intro: draft.intro,
        items: candidateItems(draft.items),
      }}
    />
  );
}
