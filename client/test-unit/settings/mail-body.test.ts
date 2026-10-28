import {
  createMailPill,
  insertMailPlaceholder,
  paintMailBody,
  readMailBody,
  removeMailPill,
} from '@/features/settings/mail-template/mailBody';
import { welcomeMailPlaceholders } from '@/features/settings/mail-template/mailPlaceholders';
import { describe, expect, it } from 'vitest';

const tokens = welcomeMailPlaceholders;

describe('mail body placeholders', () => {
  it('stores a dragged pill as a placeholder token', () => {
    const root = document.createElement('div');
    paintMailBody(root, 'Hallo', tokens);
    const range = document.createRange();
    range.selectNodeContents(root);
    range.collapse(false);
    insertMailPlaceholder(root, 'Vorname', range);

    expect(readMailBody(root)).toBe('Hallo {{Vorname}}');
    expect(root.querySelector('[data-mail-placeholder="Vorname"]')?.textContent).toBe(
      'Vorname'
    );
    expect(root.textContent).not.toContain('{{');
  });

  it('renders a saved placeholder as a pill and reads it back', () => {
    const root = document.createElement('div');
    const body = 'Hallo {{Vorname}} {{Nachname}}\nEintritt {{Eintritt}}';
    paintMailBody(root, body, tokens);

    expect(root.textContent).toBe('Hallo Vorname NachnameEintritt Eintritt');
    expect(root.textContent).not.toContain('{{');
    expect(readMailBody(root)).toBe(body);
  });

  it('creates draggable pills so they can be moved inside the editor', () => {
    const pill = createMailPill('Vorname');
    expect(pill.draggable).toBe(true);
    expect(pill.contentEditable).toBe('false');
  });

  it('removes a pill without leaving a double space', () => {
    const root = document.createElement('div');
    paintMailBody(root, 'Hallo {{Vorname}} Team', tokens);
    const pill = root.querySelector(
      '[data-mail-placeholder="Vorname"]'
    ) as HTMLElement;
    removeMailPill(pill);
    expect(readMailBody(root)).toBe('Hallo Team');
  });

  it('keeps line breaks that the browser wraps in divs', () => {
    const root = document.createElement('div');
    const first = document.createElement('div');
    first.textContent = 'Erste Zeile';
    const second = document.createElement('div');
    const pill = document.createElement('span');
    pill.dataset.mailPlaceholder = 'Nachname';
    pill.textContent = 'Nachname';
    second.append(pill);
    root.append(first, second);

    expect(readMailBody(root)).toBe('Erste Zeile\n{{Nachname}}');
  });
});
