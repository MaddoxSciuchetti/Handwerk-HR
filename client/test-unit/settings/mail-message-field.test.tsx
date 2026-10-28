import { DepartureMailForm } from '@/features/settings/departure-mail/DepartureMailForm';
import { MailMessageField } from '@/features/settings/mail-template/MailMessageField';
import { MAIL_PLACEHOLDER_DRAG } from '@/features/settings/mail-template/mailPlaceholders';
import { WelcomeMailForm } from '@/features/settings/welcome-mail/WelcomeMailForm';
import type { WelcomeMailPageData } from '@/features/settings/welcome-mail/welcomeMail.api';
import { fireEvent, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { renderWithProviders } from 'test-unit/test-utils';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/features/settings/welcome-mail/useWelcomeMail', () => ({
  useSaveWelcomeMail: () => ({
    mutate: vi.fn(),
    isPending: false,
    isError: false,
    isSuccess: false,
  }),
}));

vi.mock('@/features/settings/departure-mail/useDepartureMail', () => ({
  useSaveDepartureMail: () => ({
    mutate: vi.fn(),
    isPending: false,
    isError: false,
    isSuccess: false,
  }),
}));

const page: WelcomeMailPageData = {
  settings: {
    senderAddress: 'admin@firma.de',
    groupId: 'team-1',
    groupName: 'Büro',
    subject: 'Willkommen',
    body: 'Hallo {{Vorname}}',
  },
  groups: [{ id: 'team-1', displayName: 'Büro' }],
  groupsError: null,
};

function MessageHarness() {
  const [value, setValue] = useState('Hallo');
  return (
    <>
      <label id="message-label" htmlFor="message">
        Nachricht
      </label>
      <MailMessageField
        id="message"
        labelledBy="message-label"
        value={value}
        placeholders={['Vorname', 'Nachname']}
        onChange={setValue}
      />
    </>
  );
}

function createDataTransfer() {
  const store = new Map<string, string>();
  return {
    store,
    setData(type: string, value: string) {
      store.set(type, value);
    },
    getData(type: string) {
      return store.get(type) ?? '';
    },
    effectAllowed: 'copy',
    dropEffect: 'copy',
    types: [MAIL_PLACEHOLDER_DRAG],
  };
}

describe('mail message field', () => {
  it('accepts typed messages without Microsoft data', async () => {
    const user = userEvent.setup();
    renderWithProviders(<WelcomeMailForm page={{ settings: null, groups: [], groupsError: null }} />);
    const editor = screen.getByRole('textbox', { name: 'Nachricht' });
    expect(editor).toHaveAttribute('contenteditable', 'true');
    await user.type(editor, 'Willkommen im Team');
    expect(editor).toHaveTextContent('Willkommen im Team');
    await user.click(screen.getByRole('button', { name: 'Vorname' }));
    expect(editor).toHaveTextContent('Willkommen im Team Vorname');
  });

  it('allows editing departure messages containing placeholder pills', async () => {
    const user = userEvent.setup();
    renderWithProviders(<DepartureMailForm page={page} />);
    const editor = screen.getByRole('textbox', { name: 'Nachricht' });
    await user.click(editor);
    const caret = document.createRange();
    caret.selectNodeContents(editor);
    caret.collapse(false);
    window.getSelection()?.removeAllRanges();
    window.getSelection()?.addRange(caret);
    await user.keyboard(', alles Gute!');
    expect(editor).toHaveTextContent('Hallo Vorname, alles Gute!');
    expect(editor.querySelector('[data-mail-placeholder="Vorname"]')).toBeTruthy();
  });

  it('drops a placeholder pill into the message and saves the token', () => {
    renderWithProviders(<MessageHarness />);
    const dataTransfer = createDataTransfer();
    const pill = screen.getByRole('button', { name: 'Vorname' });
    const editor = screen.getByRole('textbox', { name: 'Nachricht' });

    fireEvent.dragStart(pill, { dataTransfer });
    fireEvent.drop(editor, { dataTransfer });

    expect(dataTransfer.getData(MAIL_PLACEHOLDER_DRAG)).toBe('Vorname');
    expect(editor.querySelector('[data-mail-placeholder="Vorname"]')).toBeTruthy();
    expect(editor).toHaveTextContent('Hallo Vorname');
    expect(editor).not.toHaveTextContent('{{Vorname}}');
  });

  it('moves an existing placeholder pill inside the message', () => {
    function Harness() {
      const [value, setValue] = useState('Hallo {{Vorname}} Team');
      return (
        <>
          <label id="move-label" htmlFor="move-message">
            Nachricht
          </label>
          <MailMessageField
            id="move-message"
            labelledBy="move-label"
            value={value}
            placeholders={['Vorname', 'Nachname']}
            onChange={setValue}
          />
          <output data-testid="body">{value}</output>
        </>
      );
    }

    renderWithProviders(<Harness />);
    const editor = screen.getByRole('textbox', { name: 'Nachricht' });
    const pill = editor.querySelector(
      '[data-mail-placeholder="Vorname"]'
    ) as HTMLElement;
    expect(pill).toBeTruthy();
    expect(pill.draggable).toBe(true);

    const dataTransfer = createDataTransfer();
    dataTransfer.effectAllowed = 'move';
    fireEvent.dragStart(pill, { dataTransfer });
    expect(dataTransfer.getData(MAIL_PLACEHOLDER_DRAG)).toBe('Vorname');

    // jsdom has no caretRangeFromPoint; a null drop range inserts at the end.
    fireEvent.drop(editor, { dataTransfer });

    expect(editor.querySelectorAll('[data-mail-placeholder="Vorname"]')).toHaveLength(
      1
    );
    expect(screen.getByTestId('body')).toHaveTextContent('Hallo Team {{Vorname}}');
  });

  it('hides the team hint and shows saved placeholders as pills', async () => {
    const user = userEvent.setup();
    renderWithProviders(<WelcomeMailForm page={page} />);

    expect(
      screen.queryByText(/Alle Personen in diesem Microsoft-Team/)
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText(/Die Mail geht über dieses Microsoft-Postfach/)
    ).not.toBeInTheDocument();
    expect(screen.queryByText(/\{\{Vorname\}\}/)).not.toBeInTheDocument();
    expect(
      screen.getByRole('textbox', { name: 'Nachricht' })
    ).toHaveTextContent('Hallo Vorname');

    await user.click(screen.getByRole('button', { name: 'Eintritt' }));
    expect(
      screen.getByRole('textbox', { name: 'Nachricht' })
    ).toHaveTextContent('Hallo Vorname Eintritt');
  });

  it('allows editing the sender without Microsoft data while team selection and saving remain disabled', async () => {
    const user = userEvent.setup();
    renderWithProviders(<WelcomeMailForm page={{ settings: null, groups: [], groupsError: null }} />);

    const sender = screen.getByRole('textbox', { name: 'Absender' });
    expect(sender).toBeEnabled();
    expect(sender).toHaveValue('');
    await user.type(sender, 'personal@firma.de');
    expect(sender).toHaveValue('personal@firma.de');
    expect(screen.getByRole('combobox', { name: 'Team' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Speichern' })).toBeDisabled();
  });

  it('uses departure pills without the template explanation', () => {
    renderWithProviders(
      <DepartureMailForm
        page={{ ...page, settings: { ...page.settings!, body: '' } }}
      />
    );

    expect(
      screen.queryByText(/erhalten die Entlassungsmail/)
    ).not.toBeInTheDocument();
    expect(screen.queryByText(/Diese Vorlage gilt nur/)).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Entlassung' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Eintritt' })).not.toBeInTheDocument();
  });
});
