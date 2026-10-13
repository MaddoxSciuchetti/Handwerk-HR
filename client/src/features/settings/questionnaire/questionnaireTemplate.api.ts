import { apiJson } from '@/config/apiClient';
import type { QuestionnaireTemplatePage, TemplateItem } from './questionnaireTemplate.types';

type TemplateResponse = {
  success: boolean;
  data: QuestionnaireTemplatePage;
};

export function getQuestionnaireTemplate() {
  return apiJson
    .get<TemplateResponse>('/automation/questionnaire')
    .then((response) => response.data);
}

export function saveQuestionnaireTemplate(items: TemplateItem[]) {
  return apiJson
    .put<TemplateResponse>('/automation/questionnaire', { items })
    .then((response) => response.data);
}
