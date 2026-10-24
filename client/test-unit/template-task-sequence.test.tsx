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

  expect(screen.queryByText('Sequenz')).not.toBeInTheDocument();

  await user.click(document.getElementById('integrationProvider')!);
  await user.click(await screen.findByRole('option', { name: 'Microsoft' }));

  expect(screen.getByText('Sequenz')).toBeInTheDocument();
  await user.click(document.getElementById('sequence')!);
  await user.click(await screen.findByRole('option', { name: 'E-Mail senden' }));
  expect(screen.getByText('E-Mail-Vorlage')).toBeInTheDocument();

  await user.click(document.getElementById('integrationProvider')!);
  await user.click(await screen.findByRole('option', { name: 'Keine' }));

  expect(screen.queryByText('Sequenz')).not.toBeInTheDocument();
  expect(screen.queryByText('E-Mail-Vorlage')).not.toBeInTheDocument();
});
