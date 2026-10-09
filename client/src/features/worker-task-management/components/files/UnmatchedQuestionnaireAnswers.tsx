import { Button } from '@/components/ui/button';
import type { UnmatchedQuestionnaireAnswer } from '../../api/employmentContract.api';
import {
  QUESTIONNAIRE_ANSWER_DRAG_TYPE,
  setDraggedQuestionnaireAnswer,
} from './questionnaireAnswerDrag';

type UnmatchedQuestionnaireAnswersProps = {
  answers: UnmatchedQuestionnaireAnswer[];
  onEditMaster: () => void;
};

export function UnmatchedQuestionnaireAnswers({
  answers,
  onEditMaster,
}: UnmatchedQuestionnaireAnswersProps) {
  return (
    <aside className="flex w-60 shrink-0 flex-col gap-3 overflow-auto">
      <div>
        <h3 className="text-sm font-medium">Nicht zugeordnet</h3>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">
          Diese Angaben aus dem Fragebogen konnten keinem Feld zugeordnet
          werden. Ziehen Sie eine Angabe auf das passende Feld im Vertrag.
        </p>
      </div>
      <ul className="flex flex-col gap-2">
        {answers.map((answer) => (
          <li key={answer.key}>
            <span
              draggable
              onDragStart={(event) => {
                setDraggedQuestionnaireAnswer({ value: answer.value });
                event.dataTransfer.setData(
                  QUESTIONNAIRE_ANSWER_DRAG_TYPE,
                  answer.value
                );
                event.dataTransfer.effectAllowed = 'copy';
              }}
              onDragEnd={() => {
                queueMicrotask(() => setDraggedQuestionnaireAnswer(null));
              }}
              className="block cursor-grab rounded-md border border-border bg-muted px-2 py-1.5 active:cursor-grabbing"
            >
              <span className="block text-xs text-muted-foreground">
                {answer.label}
              </span>
              <span className="block text-sm">{answer.value}</span>
            </span>
          </li>
        ))}
      </ul>
      <div className="mt-auto flex flex-col gap-2 border-t border-border pt-3">
        <p className="text-xs leading-5 text-muted-foreground">
          Fehlt das Feld im Vertrag, ergänzen Sie die Eingabe im Mustervertrag
          und kehren Sie danach hierher zurück.
        </p>
        <Button
          type="button"
          variant="outline"
          className="rounded-2xl"
          onClick={onEditMaster}
        >
          Mustervertrag ergänzen
        </Button>
      </div>
    </aside>
  );
}
