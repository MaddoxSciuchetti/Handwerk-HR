import { fireEvent, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, it, vi } from 'vitest';
import { renderWithProviders } from './test-utils';
import { StyledDocumentEditor } from '@/features/settings/documents/StyledDocumentEditor';
import { fromSegments } from '@/features/settings/documents/styledDocument';

it('lets the master rename a dragged field key from the details popover', async () => {
  const user = userEvent.setup();
  const document = fromSegments([
    {
      type: 'input',
      key: 'contract.feld',
      label: 'Probezeit',
      fieldType: 'text',
    },
  ]);
  const onChange = vi.fn();
  renderWithProviders(
    <StyledDocumentEditor document={document} master onChange={onChange} />
  );

  await user.click(await screen.findByText('Probezeit'));
  const dialog = screen.getByRole('dialog');
  const key = within(dialog).getByLabelText('Feldschlüssel');
  expect(key).toHaveValue('contract.feld');
  fireEvent.change(key, { target: { value: 'anzahl_probezeit' } });
  await user.click(within(dialog).getByRole('button', { name: 'Übernehmen' }));

  expect(onChange).toHaveBeenCalled();
  const saved = onChange.mock.calls.at(-1)?.[0];
  expect(JSON.stringify(saved)).toContain('"key":"anzahl_probezeit"');
  expect(JSON.stringify(saved)).not.toContain('"key":"contract.feld"');
});
