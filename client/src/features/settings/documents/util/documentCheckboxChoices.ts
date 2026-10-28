import type { DocumentNode, StyledDocument } from '@shared/document';

// Imported contracts do not carry radio-group metadata. Recognize alternatives
// from their wording, rather than treating every checkbox as one global choice.
const alternativeTopics = [
  /\b(?:un)?befristet\w*\b/u,
  /\b(?:vollzeit|teilzeit)\w*\b/u,
  /\b(?:gewerblich\w*|angestellt\w*)\b/u,
  /\b(?:je|pro)\s+(?:stunde|monat|jahr|woche)\b/u,
  /\b(?:mit|ohne)\b.*\b(?:berufsausbildung|abschluss)\b/u,
  /^(?:ja|nein)\b/u,
];

export function documentCheckboxChoices(document: StyledDocument): string[][] {
  const groups: string[][] = [];
  let previous: { topic: number; keys: string[] } | undefined;
  const visit = (node: DocumentNode) => {
    if (!['paragraph', 'heading', 'lineGroup'].includes(node.type)) {
      node.content?.forEach(visit);
      previous = undefined;
      return;
    }
    const boxes: { key: string; text: string }[] = [];
    let text = '';
    const collect = (child: DocumentNode) => {
      if (child.type === 'text') {
        text += child.text ?? '';
        if (boxes.length) boxes.at(-1)!.text += child.text ?? '';
      }
      if (
        child.type === 'documentField' &&
        child.attrs?.fieldType === 'checkbox'
      ) {
        boxes.push({
          key: String(child.attrs.key),
          text: String(child.attrs.label ?? '') + ' ',
        });
      }
      child.content?.forEach(collect);
    };
    collect(node);
    if (boxes.length === 0) {
      previous = undefined;
      return;
    }
    if (boxes.length > 1 && /\/|\boder\b/iu.test(text)) {
      groups.push(boxes.map((box) => box.key));
      previous = undefined;
      return;
    }
    for (const box of boxes) {
      const wording = box.text.toLowerCase().trim();
      const topic = alternativeTopics.findIndex((pattern) =>
        pattern.test(wording)
      );
      if (topic >= 0 && previous?.topic === topic) {
        if (previous.keys.length === 1) groups.push(previous.keys);
        if (!previous.keys.includes(box.key)) previous.keys.push(box.key);
      } else {
        previous = topic >= 0 ? { topic, keys: [box.key] } : undefined;
      }
    }
  };
  for (const section of [document.header, document.content, document.footer]) {
    previous = undefined;
    visit(section);
  }
  return groups;
}
