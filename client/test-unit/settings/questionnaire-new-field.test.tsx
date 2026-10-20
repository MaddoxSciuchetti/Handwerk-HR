import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, it, vi } from 'vitest';
import { NewQuestionForm } from '@/features/settings/questionnaire/NewQuestionForm';
import type { TemplateItem } from '@/features/settings/questionnaire/questionnaireTemplate.types';

it.each(['text', 'date', 'single', 'check', 'file', 'table', 'weekly-hours'])(
  'applies the office-only option when creating a %s field',
  async (type) => {
    const onAdd = vi.fn();
    const user = userEvent.setup();
    render(<NewQuestionForm existingKeys={[]} onAdd={onAdd} />);
    await user.selectOptions(
      screen.getByRole('combobox', { name: 'Antworttyp' }),
      type
    );
    if (type !== 'weekly-hours') {
      await user.type(screen.getByPlaceholderText('Frage'), 'Neue Angabe');
    }
    await user.click(screen.getByRole('switch', { name: 'Nur vom Betrieb' }));
    await user.click(screen.getByRole('button', { name: 'Hinzufügen' }));
    expect(onAdd).toHaveBeenCalledTimes(1);
    const items = onAdd.mock.calls[0][0] as TemplateItem[];
    expect(items.length).toBeGreaterThan(0);
    for (const item of items) {
      if (item.kind === 'repeater') {
        expect(item.columns.every((column) => column.officeOnly === true)).toBe(
          true
        );
      } else {
        expect(item.officeOnly).toBe(true);
      }
    }
  }
);
