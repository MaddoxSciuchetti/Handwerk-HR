import type { ReactNode, ComponentProps } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { DrawerLayer, DrawerStackProvider } from '@/components/ui/drawer-stack';
import { DocumentMasterRow } from '@/features/settings/documents/components/DocumentMasterRow';
import { TemplateItem } from '@/features/template-tasks/components/TemplateItem';
import { MailTemplateTable } from '@/features/template-tasks/components/MailTemplateTable';

const navigate = vi.hoisted(() => vi.fn());
vi.mock('@tanstack/react-router', () => ({ useNavigate: () => navigate }));
vi.mock('@/features/settings/documents/LazyDocumentMasterEditor', () => ({
  LazyDocumentMasterEditor: ({ id }: { id: string }) => (
    <p>Document editor {id}</p>
  ),
}));
vi.mock('@/features/settings/documents/DocumentMasterEditor', () => ({
  DocumentMasterEditor: ({ id }: { id: string }) => <p>Document editor {id}</p>,
}));
vi.mock(
  '@/features/template-tasks/components/template-items/TemplateTasks',
  () => ({
    TemplateTasks: ({ templateId }: { templateId: string }) => (
      <p>Task editor {templateId}</p>
    ),
  })
);
vi.mock('@/features/settings/mail-template/MailTemplatePage', () => ({
  MailTemplatePage: ({ templateId }: { templateId: string }) => (
    <p>Mail editor {templateId}</p>
  ),
}));
vi.mock('@/features/template-tasks/components/MailTemplateSidebar', () => ({
  MailTemplateSidebar: () => null,
}));
vi.mock('@/features/template-tasks/hooks/useDeleteTemplate', () => ({
  useDeleteTemplate: () => ({ deleteTemplate: vi.fn() }),
}));
vi.mock('@/features/settings/mail-template/useMailTemplates', () => ({
  useMailTemplates: () => ({
    data: [{ id: 'mail-1', name: 'Welcome mail', description: '' }],
    isLoading: false,
    isError: false,
  }),
  useDeleteMailTemplate: () => ({ mutate: vi.fn() }),
}));

function Stack({ children }: { children: ReactNode }) {
  return (
    <DrawerStackProvider>
      <DrawerLayer open title="List" onClose={vi.fn()}>
        {children}
      </DrawerLayer>
    </DrawerStackProvider>
  );
}

describe('Cockpit item navigation', () => {
  it('opens a document editor without leaving the list route', () => {
    render(
      <Stack>
        <table>
          <tbody>
            <DocumentMasterRow
              master={
                {
                  id: 'doc-1',
                  name: 'Contract',
                  kind: 'employment_contract',
                  isPrimary: false,
                } as ComponentProps<typeof DocumentMasterRow>['master']
              }
              isSelected={false}
              onToggle={vi.fn()}
            />
          </tbody>
        </table>
      </Stack>
    );
    fireEvent.click(screen.getByText('Contract'));
    expect(screen.getByText('Document editor doc-1')).toBeInTheDocument();
    expect(screen.getByRole('dialog', { name: 'Contract' })).toHaveAttribute(
      'data-drawer-layer',
      '2'
    );
    expect(navigate).not.toHaveBeenCalled();
  });

  it('opens template tasks in a second layer', () => {
    render(
      <Stack>
        <table>
          <tbody>
            <TemplateItem
              templates={[
                { id: 'template-1', name: 'Onboarding', description: null },
              ]}
              setIsEditTemplate={vi.fn()}
              setIsOpen={vi.fn()}
              setTemplateState={vi.fn()}
            />
          </tbody>
        </table>
      </Stack>
    );
    fireEvent.click(screen.getByText('Onboarding'));
    expect(screen.getByText('Task editor template-1')).toBeInTheDocument();
    expect(navigate).not.toHaveBeenCalled();
  });

  it('opens mail content in a second layer', () => {
    render(
      <Stack>
        <MailTemplateTable />
      </Stack>
    );
    fireEvent.click(screen.getByText('Welcome mail'));
    expect(screen.getByText('Mail editor mail-1')).toBeInTheDocument();
    expect(navigate).not.toHaveBeenCalled();
  });
});
