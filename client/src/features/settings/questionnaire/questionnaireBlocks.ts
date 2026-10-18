import { isWeeklyHoursKey } from '@shared/weeklyHours';
import type { TemplateItem } from './questionnaireTemplate.types';

export type QuestionnaireBlock = {
  id: string;
  items: TemplateItem[];
};

export function isWeeklyHoursItem(item: TemplateItem) {
  return item.kind === 'field' && isWeeklyHoursKey(item.key);
}

export function blocksFromItems(items: TemplateItem[]): QuestionnaireBlock[] {
  const blocks: QuestionnaireBlock[] = [];
  let index = 0;
  while (index < items.length) {
    const item = items[index];
    if (!item) break;
    if (isWeeklyHoursItem(item)) {
      const hours: TemplateItem[] = [];
      while (index < items.length && items[index] && isWeeklyHoursItem(items[index]!)) {
        hours.push(items[index]!);
        index += 1;
      }
      blocks.push({ id: 'hours', items: hours });
      continue;
    }
    blocks.push({ id: item.key, items: [item] });
    index += 1;
  }
  return blocks;
}

export function itemsFromBlocks(blocks: QuestionnaireBlock[]) {
  return blocks.flatMap((block) => block.items);
}
