import { HOUR_KEYS, type TemplateItem } from './questionnaireTemplate.types';

export type QuestionnaireBlock = {
  id: string;
  items: TemplateItem[];
};

const hourKeySet = new Set<string>(HOUR_KEYS);

export function isHourField(item: TemplateItem) {
  return item.kind === 'field' && hourKeySet.has(item.key);
}

export function blocksFromItems(items: TemplateItem[]): QuestionnaireBlock[] {
  const blocks: QuestionnaireBlock[] = [];
  let index = 0;
  while (index < items.length) {
    const item = items[index];
    if (!item) break;
    if (isHourField(item)) {
      const hours: TemplateItem[] = [];
      while (index < items.length && items[index] && isHourField(items[index])) {
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
