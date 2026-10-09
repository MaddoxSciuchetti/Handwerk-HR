export const QUESTIONNAIRE_ANSWER_DRAG_TYPE = 'application/x-questionnaire-answer';

type DraggedQuestionnaireAnswer = {
  value: string;
};

let draggedQuestionnaireAnswer: DraggedQuestionnaireAnswer | null = null;

export function setDraggedQuestionnaireAnswer(
  value: DraggedQuestionnaireAnswer | null
) {
  draggedQuestionnaireAnswer = value;
}

export function getDraggedQuestionnaireAnswer() {
  return draggedQuestionnaireAnswer;
}
