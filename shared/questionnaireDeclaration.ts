export const QUESTIONNAIRE_DECLARATION_HEADING = 'Erklärung der beschäftigten Person:';
export const QUESTIONNAIRE_DECLARATION_TEXT =
  'Ich versichere, dass die vorstehenden Angaben der Wahrheit entsprechen. Ich verpflichte mich, meinem Arbeitgeber alle Änderungen, insbesondere in Bezug auf weitere Beschäftigungen (in Bezug auf Art, Dauer und Entgelt) unverzüglich mitzuteilen.';

export const QUESTIONNAIRE_DECLARATION = {
  key: 'declaration',
  label: `${QUESTIONNAIRE_DECLARATION_HEADING} ${QUESTIONNAIRE_DECLARATION_TEXT}`,
  section: 'Erklärung',
  type: 'check',
  required: true,
} as const;
