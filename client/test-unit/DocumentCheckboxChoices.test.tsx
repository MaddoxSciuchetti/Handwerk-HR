import { useState } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { fromSegments, type StyledDocument } from '@shared/document';
import { StyledDocumentEditor } from '@/features/settings/documents/StyledDocumentEditor';
import { documentCheckboxChoices } from '@/features/settings/documents/util/documentCheckboxChoices';

const box = (key: string, label: string) => ({
  type: 'input' as const,
  key,
  label,
  fieldType: 'checkbox' as const,
  required: false,
});
const text = (value: string) => ({ type: 'text' as const, text: value });
const document = fromSegments([
  box('fixed', 'Befristet'),
  text(' in einem befristeten Arbeitsverhältnis\n'),
  box('permanent', 'Unbefristet'),
  text(' in einem unbefristeten Arbeitsverhältnis\n\n'),
  text('Der Arbeitsplatz ist ein '),
  box('full', 'Vollzeit'),
  text(' Vollzeitarbeitsplatz / '),
  box('part', 'Teilzeit'),
  text(' Teilzeitarbeitsplatz\n\n'),
  box('notify', 'Vorgesetzten informieren'),
  text(' Melden Sie Ihre Arbeitsunfähigkeit.\n'),
  box('doctor', 'Ärztlich feststellen lassen'),
  text(' Lassen Sie Ihre Arbeitsunfähigkeit feststellen.'),
]);

function Review({ value = document }: { value?: StyledDocument }) {
  const [values, setValues] = useState({
    permanent: 'true',
    full: 'true',
    notify: 'true',
    doctor: 'true',
  });
  return (
    <StyledDocumentEditor
      document={value}
      values={values}
      onValueChange={(key, next) =>
        setValues((current) => ({ ...current, [key]: next }))
      }
    />
  );
}

describe('document checkbox choices', () => {
  it.each([false, true])(
    'clears only the selected alternative, with imported glyphs: %s',
    async (glyphs) => {
      const value = structuredClone(document);
      if (glyphs) {
        for (const paragraph of value.content.content ?? [])
          for (const node of paragraph.content ?? [])
            if (node.type === 'documentField') node.attrs!.checkboxGlyph = '☐';
      }
      render(<Review value={value} />);
      const fixed = await screen.findByRole('checkbox', { name: 'Befristet' });
      const permanent = screen.getByRole('checkbox', { name: 'Unbefristet' });
      expect(permanent).toBeChecked();
      fireEvent.click(fixed);
      expect(fixed).toBeChecked();
      expect(permanent).not.toBeChecked();
      fireEvent.click(permanent);
      expect(permanent).toBeChecked();
      expect(fixed).not.toBeChecked();

      fireEvent.click(screen.getByRole('checkbox', { name: 'Teilzeit' }));
      expect(
        screen.getByRole('checkbox', { name: 'Vollzeit' })
      ).not.toBeChecked();
      expect(permanent).toBeChecked();
      expect(
        screen.getByRole('checkbox', { name: 'Vorgesetzten informieren' })
      ).toBeChecked();
      expect(
        screen.getByRole('checkbox', { name: 'Ärztlich feststellen lassen' })
      ).toBeChecked();
      fireEvent.click(
        screen.getByRole('checkbox', { name: 'Vorgesetzten informieren' })
      );
      expect(
        screen.getByRole('checkbox', { name: 'Ärztlich feststellen lassen' })
      ).toBeChecked();
    }
  );

  it('keeps separate questions about the same topic in separate groups', () => {
    const value = fromSegments([
      box('one-yes', 'Ja'),
      text(' Ja '),
      box('one-no', 'Nein'),
      text(' Nein\n\n'),
      box('two-yes', 'Ja'),
      text(' Ja '),
      box('two-no', 'Nein'),
      text(' Nein'),
    ]);
    expect(documentCheckboxChoices(value)).toEqual([
      ['one-yes', 'one-no'],
      ['two-yes', 'two-no'],
    ]);
  });

  it('recognizes inline choices with arbitrary labels separated by oder', () => {
    expect(
      documentCheckboxChoices(
        fromSegments([
          box('a', 'Option A'),
          text(' Option A oder '),
          box('b', 'Option B'),
          text(' Option B'),
        ])
      )
    ).toEqual([['a', 'b']]);
  });
});
