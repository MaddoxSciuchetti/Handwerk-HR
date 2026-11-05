import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, it, vi } from 'vitest';
import { renderWithProviders } from 'test-unit/test-utils';
import { EMPTY_TEMPLATE_TASK } from '@/features/template-tasks/schemas/templateTaskForm.schema';
import { getIntegrations } from '@/features/settings/integrations/integrations.api';
import { listMailTemplates } from '@/features/settings/mail-template/mailTemplate.api';
import { specificEmployeeData } from '@/features/employee-overview/api/employee-overview.api';
import { TaskSidebar } from '@/features/worker-task-management/components/tasks/TaskSidebar';

vi.mock('@/features/settings/integrations/integrations.api', () => ({
  getIntegrations: vi.fn(),
}));
vi.mock('@/features/settings/mail-template/mailTemplate.api', () => ({
  listMailTemplates: vi.fn(),
}));
vi.mock('@/features/employee-overview/api/employee-overview.api', () => ({
  specificEmployeeData: vi.fn(),
}));

function renderSidebar() {
  return renderWithProviders(
    <TaskSidebar
      isOpen
      setIsOpen={vi.fn()}
      templateId="template"
      templateTaskState="create"
      editTemplateTask={EMPTY_TEMPLATE_TASK}
    />
  );
}

it('hides the sequence picker while the integration is Keine', async () => {
  const user = userEvent.setup();
  vi.mocked(getIntegrations).mockResolvedValue([
    {
      provider: 'microsoft_graph',
      enabled: true,
      tenantId: 'tenant',
      clientId: 'client',
      domain: 'example.onmicrosoft.com',
      licenseSkuId: 'sku',
      crewId: '',
      hasClientSecret: true,
      hasToken: false,
      ready: true,
      live: true,
    },
  ]);
  vi.mocked(listMailTemplates).mockResolvedValue([]);
  vi.mocked(specificEmployeeData).mockResolvedValue([]);

  renderSidebar();

  expect(screen.getByText('Automatisierung')).toBeInTheDocument();
  expect(screen.queryByText('Typ')).not.toBeInTheDocument();

  await user.click(document.getElementById('integrationProvider')!);
  await user.click(await screen.findByRole('option', { name: 'Microsoft' }));

  expect(screen.getByText('Typ')).toBeInTheDocument();
  expect(screen.getByRole('textbox')).toHaveValue('Microsoft');
  await user.click(document.getElementById('sequence')!);
  await user.click(
    await screen.findByRole('option', { name: 'E-Mail senden' })
  );
  expect(screen.getByText('E-Mail-Vorlage')).toBeInTheDocument();
  expect(screen.getByRole('textbox')).toHaveValue('Microsoft: E-Mail senden');

  await user.clear(screen.getByRole('textbox'));
  await user.type(screen.getByRole('textbox'), 'Eigene Aufgabe');
  expect(screen.getByRole('textbox')).toHaveValue('Eigene Aufgabe');

  await user.click(document.getElementById('sequence')!);
  await user.click(
    await screen.findByRole('option', { name: 'Konto anlegen' })
  );
  expect(screen.getByRole('textbox')).toHaveValue('Microsoft: Konto anlegen');

  await user.click(document.getElementById('integrationProvider')!);
  await user.click(await screen.findByRole('option', { name: 'Keine' }));

  expect(screen.queryByText('Typ')).not.toBeInTheDocument();
  expect(screen.queryByText('E-Mail-Vorlage')).not.toBeInTheDocument();
  expect(screen.getByRole('textbox')).toHaveValue('Microsoft: Konto anlegen');
});

it('offers Crewmeister account deactivation without email-template fields', async () => {
  vi.mocked(getIntegrations).mockResolvedValue([
    {
      provider: 'crewmeister',
      enabled: true,
      tenantId: '',
      clientId: '',
      domain: '',
      licenseSkuId: '',
      crewId: '42',
      hasClientSecret: false,
      hasToken: true,
      ready: true,
      live: true,
    },
  ]);
  vi.mocked(listMailTemplates).mockResolvedValue([]);
  vi.mocked(specificEmployeeData).mockResolvedValue([]);
  const user = userEvent.setup();
  renderSidebar();
  await user.click(document.getElementById('integrationProvider')!);
  await user.click(await screen.findByRole('option', { name: 'Crewmeister' }));
  await user.click(document.getElementById('sequence')!);
  await user.click(
    await screen.findByRole('option', { name: 'Konto deaktivieren' })
  );
  expect(document.getElementById('sequence')).toHaveTextContent(
    'Konto deaktivieren'
  );
  expect(screen.getByRole('textbox')).toHaveValue(
    'Crewmeister: Konto deaktivieren'
  );
  expect(screen.queryByText('E-Mail-Vorlage')).not.toBeInTheDocument();
});
