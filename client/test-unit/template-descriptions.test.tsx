import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, expect, it, vi } from 'vitest';
import { renderWithProviders } from './test-utils';
import { MailTemplateSidebar } from '@/features/template-tasks/components/MailTemplateSidebar';
import { TemplateSidebar } from '@/features/worker-task-management/components/tasks/task-sidebar/TemplateSidebar';
const mocks = vi.hoisted(() => ({
  createMail: vi.fn(),
  updateMail: vi.fn(),
  createTemplate: vi.fn(),
  updateTemplate: vi.fn(),
  navigate: vi.fn(),
}));
vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => mocks.navigate,
}));
vi.mock(
  '@/features/settings/mail-template/mailTemplate.api',
  async (original) => ({
    ...(await original<
      typeof import('@/features/settings/mail-template/mailTemplate.api')
    >()),
    createMailTemplate: mocks.createMail,
    updateMailTemplateDetails: mocks.updateMail,
  })
);
vi.mock('@/features/template-tasks/api', () => ({
  createTemplateTaskV2: mocks.createTemplate,
  updateTemplate: mocks.updateTemplate,
  deleteTemplate: vi.fn(),
}));
beforeEach(() => {
  vi.clearAllMocks();
  mocks.createMail.mockResolvedValue({
    id: 'mail',
    name: 'Welcome',
    description: '',
  });
  mocks.updateMail.mockResolvedValue({
    id: 'mail',
    name: 'Welcome',
    description: 'Saved description',
  });
  mocks.createTemplate.mockResolvedValue({
    name: 'Welcome',
    description: null,
  });
  mocks.updateTemplate.mockResolvedValue({
    name: 'Welcome',
    description: 'Saved description',
  });
});
it.each(['create', 'edit'] as const)(
  'saves email templates without a description field (%s)',
  async (mode) => {
    renderWithProviders(
      <MailTemplateSidebar
        isOpen
        setIsOpen={vi.fn()}
        mode={mode}
        editState={{
          id: 'mail',
          name: 'Welcome',
          description: 'Saved description',
        }}
      />
    );
    expect(screen.queryByLabelText(/Beschreibung/)).not.toBeInTheDocument();
    const user = userEvent.setup();
    if (mode === 'create')
      await user.type(screen.getByRole('textbox'), 'Welcome');
    await user.click(screen.getByRole('button', { name: 'Speichern' }));
    const saved = mode === 'create' ? mocks.createMail : mocks.updateMail;
    await waitFor(() => expect(saved).toHaveBeenCalled());
    expect(
      mode === 'create' ? saved.mock.calls[0][0] : saved.mock.calls[0][1]
    ).toEqual({
      name: 'Welcome',
      description: mode === 'create' ? '' : 'Saved description',
    });
  }
);
it.each(['create', 'edit'] as const)(
  'saves task collections without requiring a description (%s)',
  async (mode) => {
    renderWithProviders(
      <TemplateSidebar
        isOpen
        setIsOpen={vi.fn()}
        templateState={mode}
        templateEditState={{
          templateId: 'template',
          name: 'Welcome',
          description: mode === 'create' ? null : 'Saved description',
        }}
      />
    );
    expect(screen.queryByLabelText(/Beschreibung/)).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Speichern' }));
    await waitFor(() =>
      expect(
        mode === 'create' ? mocks.createTemplate : mocks.updateTemplate
      ).toHaveBeenCalled()
    );
  }
);
