import { QuestionnaireForm } from '@/features/questionnaire/QuestionnaireForm';
import {
  clearAnswerDraft,
  readAnswerDraft,
  writeAnswerDraft,
} from '@/features/questionnaire/questionnaireAnswerDraft';
import { apiJson } from '@/config/apiClient';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from 'test-unit/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/config/apiClient', () => ({
  apiJson: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

const token = 'draft-token';

describe('questionnaire answer drafts', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.mocked(apiJson.get).mockResolvedValue({
      success: true,
      data: {
        status: 'sent',
        intro: '',
        questions: [
          {
            key: 'lastName',
            label: 'Familienname',
            section: 'Persönliche Angaben',
            type: 'text',
            required: true,
          },
          {
            key: 'declaration',
            label: 'Erklärung',
            section: 'Erklärung',
            type: 'check',
            required: true,
          },
        ],
      },
    });
    vi.mocked(apiJson.post).mockResolvedValue({
      success: true,
      data: { status: 'completed' },
    });
  });

  it('persists typed answers under the token key and restores them on reload', async () => {
    const user = userEvent.setup();
    const { unmount } = renderWithProviders(
      <QuestionnaireForm token={token} />
    );

    const field = await screen.findByLabelText('Familienname *');
    await user.clear(field);
    await user.type(field, 'Müller');

    await waitFor(() => {
      expect(readAnswerDraft(token)?.values.lastName).toBe('Müller');
    });

    unmount();
    renderWithProviders(<QuestionnaireForm token={token} />);

    expect(await screen.findByLabelText('Familienname *')).toHaveValue(
      'Müller'
    );
  });

  it('clears the draft after a successful submit', async () => {
    writeAnswerDraft(token, {
      values: { lastName: 'Alt', declaration: '' },
      rows: {},
    });
    const user = userEvent.setup();
    renderWithProviders(<QuestionnaireForm token={token} />);

    const field = await screen.findByLabelText('Familienname *');
    expect(field).toHaveValue('Alt');
    await user.click(
      screen.getByRole('checkbox', {
        name: /Erklärung der beschäftigten Person/,
      })
    );
    await user.click(screen.getByRole('button', { name: 'Absenden' }));

    expect(
      await screen.findByText('Danke, Ihre Angaben wurden übermittelt.')
    ).toBeInTheDocument();
    expect(readAnswerDraft(token)).toBeNull();
  });

  it('does not restore a draft once the form is already completed', async () => {
    writeAnswerDraft(token, {
      values: { lastName: 'Alt' },
      rows: {},
    });
    vi.mocked(apiJson.get).mockResolvedValue({
      success: true,
      data: { status: 'completed' },
    });

    renderWithProviders(<QuestionnaireForm token={token} />);

    expect(
      await screen.findByText('Danke, Ihre Angaben wurden übermittelt.')
    ).toBeInTheDocument();
    expect(screen.queryByLabelText('Familienname *')).not.toBeInTheDocument();
    await waitFor(() => {
      expect(readAnswerDraft(token)).toBeNull();
    });
  });

  it('ignores invalid stored draft payloads', () => {
    localStorage.setItem(`fragebogen-answers:v1:${token}`, '{not-json');
    expect(readAnswerDraft(token)).toBeNull();
    clearAnswerDraft(token);
    expect(localStorage.getItem(`fragebogen-answers:v1:${token}`)).toBeNull();
  });

  it('does not write one token\'s answers into another token\'s draft', async () => {
    const other = 'other-token';
    writeAnswerDraft(other, {
      values: { lastName: 'Andere' },
      rows: {},
    });
    vi.mocked(apiJson.get).mockImplementation(async (path: string) => {
      if (path.endsWith(other)) {
        return {
          success: true,
          data: {
            status: 'sent',
            intro: '',
            questions: [
              {
                key: 'lastName',
                label: 'Familienname',
                section: 'Persönliche Angaben',
                type: 'text',
                required: true,
              },
            ],
          },
        };
      }
      return {
        success: true,
        data: {
          status: 'sent',
          intro: '',
          questions: [
            {
              key: 'lastName',
              label: 'Familienname',
              section: 'Persönliche Angaben',
              type: 'text',
              required: true,
            },
          ],
        },
      };
    });

    const user = userEvent.setup();
    const { rerender } = renderWithProviders(
      <QuestionnaireForm token={token} />
    );
    const field = await screen.findByLabelText('Familienname *');
    await user.clear(field);
    await user.type(field, 'Müller');
    await waitFor(() => {
      expect(readAnswerDraft(token)?.values.lastName).toBe('Müller');
    });

    rerender(<QuestionnaireForm token={other} />);
    expect(await screen.findByLabelText('Familienname *')).toHaveValue(
      'Andere'
    );
    await waitFor(() => {
      expect(readAnswerDraft(other)?.values.lastName).toBe('Andere');
    });
    expect(readAnswerDraft(token)?.values.lastName).toBe('Müller');
  });
});
