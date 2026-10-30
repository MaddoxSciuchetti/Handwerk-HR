import { AddDocumentMasterDialog } from '@/features/settings/documents/AddDocumentMasterDialog';
import { DocumentMasterList } from '@/features/settings/documents/DocumentMasterList';
import { DocumentsPage } from '@/features/settings/documents/DocumentsPage';
import {
  deleteDocumentMaster,
  setPrimaryDocumentMaster,
} from '@/features/settings/documents/documentMasters.api';
import { listDocumentMasters } from '@/features/settings/documents/documentMasters.api';
import {
  createDocumentMaster,
  importSharePointDocumentMaster,
  searchSharePointFiles,
} from '@/features/settings/documents/documentMasters.api';
import { fromSegments } from '@/features/settings/documents/styledDocument';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from 'test-unit/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const navigate = vi.fn();
const teamsMocks = vi.hoisted(() => ({
  getConnection: vi.fn(),
  connectTeams: vi.fn(),
}));

vi.mock('@tanstack/react-router', async (importOriginal) => {
  const actual =
    await importOriginal<typeof import('@tanstack/react-router')>();
  return {
    ...actual,
    useNavigate: () => navigate,
  };
});

vi.mock('@/features/user-profile/hooks/useAuth', () => ({
  default: () => ({
    user: { id: 'user-1', organizationId: 'org-1' },
    isLoading: false,
    isError: false,
  }),
}));

vi.mock('@/features/microsoft-teams/teams.api', () => ({
  connectionKey: (userId?: string, organizationId?: string) => [
    'microsoft-teams',
    organizationId,
    userId,
  ],
  getConnection: teamsMocks.getConnection,
  connectTeams: teamsMocks.connectTeams,
  teamsError: (error: unknown) =>
    error &&
    typeof error === 'object' &&
    'message' in error &&
    typeof error.message === 'string'
      ? error.message
      : 'Microsoft Teams ist derzeit nicht verfügbar.',
}));

vi.mock('@/features/settings/documents/documentMasters.api', () => ({
  listDocumentMasters: vi.fn(),
  setPrimaryDocumentMaster: vi.fn(),
  createDocumentMaster: vi.fn(),
  deleteDocumentMaster: vi.fn(),
  searchSharePointFiles: vi.fn(),
  importSharePointDocumentMaster: vi.fn(),
}));

describe('document settings', () => {
  beforeEach(() => {
    navigate.mockClear();
    vi.mocked(createDocumentMaster).mockReset();
    vi.mocked(searchSharePointFiles).mockReset();
    vi.mocked(importSharePointDocumentMaster).mockReset();
    teamsMocks.getConnection.mockReset();
    teamsMocks.connectTeams.mockReset();
    teamsMocks.getConnection.mockResolvedValue({
      organizationId: 'org-1',
      userId: 'user-1',
      ready: true,
      live: true,
      status: 'connected',
      account: { displayName: 'Ada', username: 'ada@example.test' },
    });
  });
  it('requires a chosen name instead of copying a generated upload filename', async () => {
    const user = userEvent.setup();
    const file = new File(
      ['contract'],
      '1728896800-086dd584-78be-47d7-bf77-67d09eea79e1.pdf',
      { type: 'application/pdf' }
    );
    renderWithProviders(<AddDocumentMasterDialog onClose={vi.fn()} />);
    await user.upload(screen.getByLabelText('Datei'), file);
    expect(screen.getByRole('textbox', { name: 'Name' })).toHaveValue('');
    expect(screen.getByRole('button', { name: 'Anlegen' })).toBeDisabled();
    await user.type(
      screen.getByRole('textbox', { name: 'Name' }),
      'Arbeitsvertrag Montage'
    );
    expect(screen.getByRole('button', { name: 'Anlegen' })).toBeEnabled();
    vi.mocked(createDocumentMaster).mockResolvedValue({
      id: 'chosen-contract',
    } as Awaited<ReturnType<typeof createDocumentMaster>>);
    fireEvent.submit(
      screen.getByRole('button', { name: 'Anlegen' }).closest('form')!
    );
    await waitFor(() =>
      expect(createDocumentMaster).toHaveBeenCalledWith({
        kind: 'employment_contract',
        name: 'Arbeitsvertrag Montage',
        file,
      })
    );
    await waitFor(() =>
      expect(navigate).toHaveBeenCalledWith({
        to: '/settings/documents/$id',
        params: { id: 'chosen-contract' },
      })
    );
  });

  it('imports a selected SharePoint file into the document editor', async () => {
    const user = userEvent.setup();
    vi.mocked(searchSharePointFiles).mockResolvedValue({
      files: [
        {
          id: 'item-1',
          driveId: 'drive-1',
          name: 'Montagevertrag.docx',
          size: 1000,
          lastModified: null,
          mimeType:
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          webUrl: null,
          libraryName: 'Vorlagen',
        },
      ],
    });
    vi.mocked(importSharePointDocumentMaster).mockResolvedValue({
      id: 'sharepoint-master',
    } as Awaited<ReturnType<typeof importSharePointDocumentMaster>>);

    renderWithProviders(<AddDocumentMasterDialog onClose={vi.fn()} />);

    const sharePointSearch = await screen.findByLabelText('SharePoint');
    fireEvent.change(sharePointSearch, {
      target: { value: 'Montagevertrag' },
    });
    await waitFor(
      () =>
        expect(searchSharePointFiles).toHaveBeenCalledWith('Montagevertrag'),
      { timeout: 2000 }
    );
    await user.click(
      await screen.findByRole('option', { name: /Montagevertrag\.docx/i })
    );
    expect(screen.getByRole('textbox', { name: 'Name' })).toHaveValue(
      'Montagevertrag'
    );
    fireEvent.submit(
      screen.getByRole('button', { name: 'Anlegen' }).closest('form')!
    );
    await waitFor(() =>
      expect(importSharePointDocumentMaster).toHaveBeenCalledWith({
        kind: 'employment_contract',
        name: 'Montagevertrag',
        driveId: 'drive-1',
        itemId: 'item-1',
      })
    );
    await waitFor(() =>
      expect(navigate).toHaveBeenCalledWith({
        to: '/settings/documents/$id',
        params: { id: 'sharepoint-master' },
      })
    );
  });

  it('chooses the new document type from a dropdown containing Arbeitszeugnis', async () => {
    const user = userEvent.setup();
    renderWithProviders(<AddDocumentMasterDialog onClose={vi.fn()} />);

    const typeSelect = screen.getByRole('combobox', { name: 'Art' });
    expect(typeSelect).toHaveValue('Arbeitsvertrag');

    await user.click(typeSelect);
    expect(
      await screen.findByRole('option', { name: 'Arbeitszeugnis' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('option', { name: 'Verschwiegenheitsvereinbarung' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('option', { name: 'Dienstanweisung' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('option', { name: 'KFZ-Überlassungsvertrag' })
    ).toBeInTheDocument();

    await user.clear(typeSelect);
    await user.type(typeSelect, 'Abmahnung');
    expect(
      await screen.findByRole('option', { name: '„Abmahnung“ hinzufügen' })
    ).toBeInTheDocument();
    await user.click(
      screen.getByRole('option', { name: '„Abmahnung“ hinzufügen' })
    );
    expect(typeSelect).toHaveValue('Abmahnung');

    await user.click(typeSelect);
    expect(
      await screen.findByRole('option', { name: 'Abmahnung' })
    ).toBeInTheDocument();
  });

  it('creates one template per uploaded file and keeps each chosen type', async () => {
    const user = userEvent.setup();
    const nda = new File(['nda'], 'geheimhaltung.docx', {
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    });
    const instruction = new File(['order'], 'dienstanweisung.docx', {
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    });
    vi.mocked(createDocumentMaster)
      .mockResolvedValueOnce({
        id: 'nda-1',
      } as Awaited<ReturnType<typeof createDocumentMaster>>)
      .mockResolvedValueOnce({
        id: 'instruction-1',
      } as Awaited<ReturnType<typeof createDocumentMaster>>);
    renderWithProviders(<AddDocumentMasterDialog onClose={vi.fn()} />);

    await user.upload(screen.getByLabelText('Datei'), [nda, instruction]);
    await user.click(screen.getByRole('combobox', { name: 'Art 1' }));
    await user.click(
      await screen.findByRole('option', { name: 'Verschwiegenheitsvereinbarung' })
    );
    await user.click(screen.getByRole('combobox', { name: 'Art 2' }));
    await user.click(
      await screen.findByRole('option', { name: 'Dienstanweisung' })
    );
    await user.type(screen.getByRole('textbox', { name: 'Name 1' }), 'NDA Werkstatt');
    await user.type(
      screen.getByRole('textbox', { name: 'Name 2' }),
      'Dienstanweisung Werkstatt'
    );
    fireEvent.submit(
      screen.getByRole('button', { name: 'Anlegen' }).closest('form')!
    );

    await waitFor(() =>
      expect(createDocumentMaster).toHaveBeenNthCalledWith(1, {
        kind: 'verschwiegenheitsvereinbarung',
        name: 'NDA Werkstatt',
        file: nda,
      })
    );
    expect(createDocumentMaster).toHaveBeenNthCalledWith(2, {
      kind: 'dienstanweisung',
      name: 'Dienstanweisung Werkstatt',
      file: instruction,
    });
    expect(navigate).not.toHaveBeenCalled();
  });

  it('shows each document type as a rounded tag in the list', () => {
    renderWithProviders(
      <DocumentMasterList
        masters={[
          {
            id: 'master-1',
            name: 'Qualifiziertes Zeugnis',
            kind: 'arbeitszeugnis',
            isPrimary: false,
            updatedAt: '2026-10-11T00:00:00.000Z',
          },
        ]}
        selectedIds={[]}
        onToggle={() => undefined}
        onSelectAll={() => undefined}
        emptyLabel="Noch keine Vorlagen."
      />
    );

    expect(screen.getByText('Arbeitszeugnis')).toHaveClass('rounded-full');
  });

  it('deletes a selected document without opening it', async () => {
    const user = userEvent.setup();
    vi.mocked(deleteDocumentMaster).mockResolvedValue();
    vi.mocked(listDocumentMasters).mockResolvedValue([
      {
        id: 'master-1',
        name: 'Qualifiziertes Zeugnis',
        kind: 'arbeitszeugnis',
        isPrimary: false,
        updatedAt: '2026-10-11T00:00:00.000Z',
      },
    ]);
    renderWithProviders(<DocumentsPage />);

    await user.click(
      await screen.findByRole('checkbox', { name: 'Qualifiziertes Zeugnis auswählen' })
    );
    await user.click(
      screen.getByRole('button', { name: 'Ausgewählte Dokumente löschen' })
    );

    await waitFor(() =>
      expect(deleteDocumentMaster).toHaveBeenCalledWith('master-1')
    );
    expect(navigate).not.toHaveBeenCalled();
    expect(
      screen.queryByRole('button', { name: 'Als Hauptvertrag' })
    ).not.toBeInTheDocument();
  });

  it('keeps a template visible until deletion succeeds and keeps it absent after reloading the list', async () => {
    const user = userEvent.setup();
    const master = {
      id: 'persistent-delete',
      name: 'Alte Vorlage',
      kind: 'employment_contract' as const,
      isPrimary: true,
      updatedAt: '2026-10-14T00:00:00.000Z',
    };
    let masters = [master];
    vi.mocked(listDocumentMasters).mockImplementation(async () => masters);
    let finishDelete!: () => void;
    vi.mocked(deleteDocumentMaster).mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          finishDelete = () => {
            masters = [];
            resolve();
          };
        })
    );
    const view = renderWithProviders(<DocumentsPage />);
    await user.click(
      await screen.findByRole('checkbox', { name: 'Alte Vorlage auswählen' })
    );
    await user.click(
      screen.getByRole('button', { name: 'Ausgewählte Dokumente löschen' })
    );
    expect(screen.getByText('Alte Vorlage')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Ausgewählte Dokumente löschen' })
    ).toBeDisabled();
    finishDelete();
    await waitFor(() =>
      expect(screen.queryByText('Alte Vorlage')).not.toBeInTheDocument()
    );
    view.unmount();
    renderWithProviders(<DocumentsPage />);
    expect(await screen.findByText('Noch keine Dokumente.')).toBeInTheDocument();
    expect(screen.queryByText('Alte Vorlage')).not.toBeInTheDocument();
  });

  it('marks one employment contract as the template used for sending', async () => {
    const user = userEvent.setup();
    const masters = [
      {
        id: 'current',
        name: 'Rahmenvertrag',
        kind: 'employment_contract' as const,
        isPrimary: true,
        updatedAt: '2026-10-11T00:00:00.000Z',
      },
      {
        id: 'next',
        name: 'Saisonvertrag',
        kind: 'employment_contract' as const,
        isPrimary: false,
        updatedAt: '2026-10-12T00:00:00.000Z',
      },
    ];
    vi.mocked(listDocumentMasters).mockResolvedValue(masters);
    vi.mocked(setPrimaryDocumentMaster).mockImplementation(async (id) => {
      masters.forEach((master) => {
        master.isPrimary = master.id === id;
      });
      return {
        ...masters.find((master) => master.id === id)!,
        text: '',
        segments: [],
        document: fromSegments([]),
        revision: 1,
        approvedAt: null,
      };
    });

    renderWithProviders(<DocumentsPage />);

    expect(await screen.findByText('Hauptvertrag')).toBeInTheDocument();
    expect(
      screen.queryByRole('columnheader', { name: 'Hauptvertrag' })
    ).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /löschen$/ })).not.toBeInTheDocument();

    await user.click(
      screen.getByRole('checkbox', { name: 'Saisonvertrag auswählen' })
    );
    await user.click(screen.getByRole('button', { name: 'Als Hauptvertrag' }));

    expect(setPrimaryDocumentMaster).toHaveBeenCalledWith('next');
    expect(
      await screen.findByRole('button', { name: 'Als Hauptvertrag' })
    ).toBeDisabled();
    expect(navigate).not.toHaveBeenCalled();
  });
});
