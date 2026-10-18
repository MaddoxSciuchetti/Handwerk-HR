import { apiJson } from '@/config/apiClient';
import { QuestionnaireForm } from '@/features/questionnaire/QuestionnaireForm';
import {
  candidateItems,
  type PreviewItem,
} from '@/features/questionnaire/questionnairePreview';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from 'test-unit/test-utils';
import { expect, it, vi } from 'vitest';

vi.mock('@/config/apiClient', () => ({
  apiJson: { get: vi.fn(), post: vi.fn() },
}));

it('disables all BSB-only question types and allows recipients to submit without filling them', async () => {
  vi.mocked(apiJson.get).mockResolvedValue({
    success: true,
    data: {
      status: 'sent',
      questions: [
        {
          key: 'salary',
          label: 'Gehalt',
          type: 'text',
          section: 'BSB',
          required: true,
          bsbOnly: true,
        },
        {
          key: 'entry',
          label: 'Eintritt',
          type: 'date',
          section: 'BSB',
          required: true,
          bsbOnly: true,
        },
        {
          key: 'extent',
          label: 'Vertragsart',
          type: 'single',
          options: ['Befristet', 'Unbefristet'],
          section: 'BSB',
          required: true,
          bsbOnly: true,
        },
        {
          key: 'check',
          label: 'Bestätigung',
          type: 'check',
          section: 'BSB',
          required: true,
          bsbOnly: true,
        },
        {
          key: 'file',
          label: 'Dokument',
          type: 'file',
          section: 'BSB',
          required: true,
          bsbOnly: true,
        },
        {
          key: 'hours',
          label: 'Montag',
          type: 'text',
          layout: 'inline',
          section: 'Stunden',
          required: true,
          bsbOnly: true,
        },
        {
          key: 'lastName',
          label: 'Nachname',
          type: 'text',
          section: 'Persönlich',
          required: true,
        },
      ],
    },
  });
  vi.mocked(apiJson.post).mockResolvedValue({
    success: true,
    data: { status: 'completed' },
  });
  renderWithProviders(<QuestionnaireForm token="token" />);
  expect(await screen.findByRole('textbox', { name: 'Gehalt' })).toBeDisabled();
  expect(screen.getByLabelText('Eintritt')).toBeDisabled();
  expect(screen.getByRole('radio', { name: 'Befristet' })).toBeDisabled();
  expect(screen.getByRole('radio', { name: 'Unbefristet' })).toBeDisabled();
  expect(screen.getByRole('checkbox', { name: 'Bestätigung' })).toBeDisabled();
  expect(screen.getByLabelText('Dokument')).toBeDisabled();
  expect(screen.getByRole('textbox', { name: 'Montag' })).toBeDisabled();
  expect(screen.getAllByText('Nur von BSB auszufüllen').length).toBeGreaterThan(
    0
  );
  const user = userEvent.setup();
  expect(screen.getByRole('button', { name: 'Absenden' })).toBeDisabled();
  await user.type(
    screen.getByRole('textbox', { name: 'Nachname *' }),
    'Muster'
  );
  expect(screen.getByRole('button', { name: 'Absenden' })).toBeEnabled();
  await user.click(screen.getByRole('button', { name: 'Absenden' }));
  await screen.findByText('Danke, Ihre Angaben wurden übermittelt.');
});

it('shows an empty BSB-only required field as locked and optional in the candidate preview', () => {
  const items: PreviewItem[] = [
    {
      kind: 'field',
      key: 'custom.bsb-salary',
      label: 'Gehalt',
      section: 'BSB',
      type: 'text',
      required: true,
      bsbOnly: true,
    },
  ];
  expect(candidateItems(items)[0]).toMatchObject({
    bsbOnly: true,
    employerFilled: true,
    required: false,
  });
  renderWithProviders(
    <QuestionnaireForm preview={{ intro: '', items: candidateItems(items) }} />
  );
  expect(screen.getByRole('textbox', { name: /Gehalt/ })).toBeDisabled();
  expect(screen.getByText('Von BSB für die Person')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Absenden' })).toBeEnabled();
});
