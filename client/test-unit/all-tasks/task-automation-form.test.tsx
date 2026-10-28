import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MicrosoftAccountIdField } from '@/features/all-tasks/components/MicrosoftAccountIdField';
import { useWatch } from 'react-hook-form';
import { useTasks } from '@/features/all-tasks/hooks/useTasks';
import {
  EMPTY_TASK_EDIT_STATE,
  type TaskEditState,
} from '@/features/all-tasks/hooks/useTaskSidebar';

const { createTask, updateTask, close, runAction, fetchEngagements } =
  vi.hoisted(() => ({
    createTask: vi.fn(),
    updateTask: vi.fn(),
    close: vi.fn(),
    runAction: vi.fn(),
    fetchEngagements: vi.fn(),
  }));
vi.mock('@/features/all-tasks/hooks/useFetchEngagements', () => ({
  useFetchEngagements: fetchEngagements,
}));
vi.mock('@/features/all-tasks/hooks/useCreateTask', () => ({
  useCreateTask: () => ({ mutateAsync: createTask, isPending: false }),
}));
vi.mock('@/features/all-tasks/hooks/useUpdateTask', () => ({
  useUpdateTask: () => ({ mutateAsync: updateTask, isPending: false }),
}));

function Form({
  seed,
  mode = 'create',
}: {
  seed?: Partial<TaskEditState>;
  mode?: 'create' | 'edit';
}) {
  const {
    register,
    onSubmit,
    saveForAction,
    errors,
    control,
    storedMicrosoftAccountId,
  } = useTasks(
    {
      ...EMPTY_TASK_EDIT_STATE,
      title: 'Test',
      workerEngagementId: 'engagement-1',
      assigneeUserId: 'user-1',
      ...seed,
    },
    mode,
    close
  );
  const sequence = useWatch({ control, name: 'sequence' });
  return (
    <form onSubmit={onSubmit}>
      <select aria-label="Automation" {...register('sequence')}>
        <option value="none">Keine</option>
        <option value="microsoft_send_email">E-Mail senden</option>
        <option value="microsoft_deactivate_account">Konto deaktivieren</option>
      </select>
      <input aria-label="E-Mail-Vorlage" {...register('mailTemplateId')} />
      <MicrosoftAccountIdField
        sequence={sequence}
        storedMicrosoftAccountId={storedMicrosoftAccountId}
        register={register}
        errors={errors}
      />
      <input aria-label="Absender" {...register('mailSenderAddress')} />
      {errors.mailTemplateId ? <p>{errors.mailTemplateId.message}</p> : null}
      {errors.mailSenderAddress ? (
        <p>{errors.mailSenderAddress.message}</p>
      ) : null}
      <button type="submit">Speichern</button>
      <button
        type="button"
        onClick={async () => {
          if (await saveForAction()) runAction();
        }}
      >
        Ausführen
      </button>
    </form>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  fetchEngagements.mockReturnValue({ data: [] });
});

describe('task automation form', () => {
  it('saves current edits before running an action without closing the task', async () => {
    let finishSave!: () => void;
    updateTask.mockImplementationOnce(
      () =>
        new Promise<void>((resolve) => {
          finishSave = resolve;
        })
    );
    render(
      <Form
        mode="edit"
        seed={{
          taskId: 'task-1',
          microsoftAccountId: '12345678-1234-1234-1234-123456789abc',
        }}
      />
    );
    fireEvent.change(screen.getByRole('combobox'), {
      target: { value: 'microsoft_deactivate_account' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Ausführen' }));
    await waitFor(() =>
      expect(updateTask).toHaveBeenCalledWith({
        taskId: 'task-1',
        data: expect.objectContaining({
          sequence: 'microsoft_deactivate_account',
        }),
      })
    );
    expect(runAction).not.toHaveBeenCalled();
    finishSave();
    await waitFor(() => expect(runAction).toHaveBeenCalledOnce());
    expect(close).not.toHaveBeenCalled();
  });

  it('runs account deactivation without a Zuständigkeit', async () => {
    updateTask.mockResolvedValueOnce({});
    render(
      <Form
        mode="edit"
        seed={{
          taskId: 'task-1',
          assigneeUserId: '',
          microsoftAccountId: '12345678-1234-1234-1234-123456789abc',
          sequence: 'microsoft_deactivate_account',
        }}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: 'Ausführen' }));
    await waitFor(() => expect(runAction).toHaveBeenCalledOnce());
    expect(
      screen.queryByText('Bitte wähle eine Zuständigkeit aus')
    ).not.toBeInTheDocument();
  });

  it('does not run an action when saving fails', async () => {
    updateTask.mockRejectedValueOnce(new Error('Save failed'));
    render(<Form mode="edit" seed={{ taskId: 'task-1' }} />);
    fireEvent.click(screen.getByRole('button', { name: 'Ausführen' }));
    await waitFor(() => expect(updateTask).toHaveBeenCalledOnce());
    expect(runAction).not.toHaveBeenCalled();
    expect(close).not.toHaveBeenCalled();
  });

  it('validates the current configuration before running an action', async () => {
    render(<Form mode="edit" seed={{ taskId: 'task-1' }} />);
    fireEvent.change(screen.getByRole('combobox'), {
      target: { value: 'microsoft_send_email' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Ausführen' }));
    expect(
      await screen.findByText('Bitte wähle eine E-Mail-Vorlage')
    ).toBeInTheDocument();
    expect(updateTask).not.toHaveBeenCalled();
    expect(runAction).not.toHaveBeenCalled();
  });

  it('only shows the required Microsoft ID for deactivation and saves a valid ID', async () => {
    render(<Form />);
    expect(
      screen.queryByLabelText('Microsoft-Konto-ID (erforderlich)')
    ).not.toBeInTheDocument();
    fireEvent.change(screen.getByRole('combobox'), {
      target: { value: 'microsoft_deactivate_account' },
    });
    fireEvent.change(
      screen.getByLabelText('Microsoft-Konto-ID (erforderlich)'),
      {
        target: { value: '  12345678-1234-1234-1234-123456789abc  ' },
      }
    );
    fireEvent.click(screen.getByRole('button', { name: 'Speichern' }));
    await waitFor(() =>
      expect(createTask).toHaveBeenCalledWith(
        expect.objectContaining({
          microsoftAccountId: '12345678-1234-1234-1234-123456789abc',
        })
      )
    );
  });

  it('rejects an email address as a Microsoft ID', async () => {
    render(<Form seed={{ sequence: 'microsoft_deactivate_account' }} />);
    fireEvent.change(
      screen.getByLabelText('Microsoft-Konto-ID (erforderlich)'),
      {
        target: { value: 'worker@example.com' },
      }
    );
    fireEvent.click(screen.getByRole('button', { name: 'Speichern' }));
    expect(
      await screen.findByText('Bitte gib eine gültige Microsoft-Konto-ID ein')
    ).toBeInTheDocument();
    expect(createTask).not.toHaveBeenCalled();
  });

  it('hides a Microsoft ID saved on the task and uses it for execution', async () => {
    updateTask.mockResolvedValueOnce({});
    render(
      <Form
        mode="edit"
        seed={{
          taskId: 'task-1',
          sequence: 'microsoft_deactivate_account',
          microsoftAccountId: '12345678-1234-1234-1234-123456789abc',
        }}
      />
    );
    expect(
      screen.queryByLabelText('Microsoft-Konto-ID (erforderlich)')
    ).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Ausführen' }));
    await waitFor(() => expect(runAction).toHaveBeenCalledOnce());
    expect(updateTask).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          microsoftAccountId: '12345678-1234-1234-1234-123456789abc',
        }),
      })
    );
  });

  it('requires a Microsoft ID before execution when none is stored', async () => {
    render(
      <Form
        mode="edit"
        seed={{ taskId: 'task-1', sequence: 'microsoft_deactivate_account' }}
      />
    );
    expect(
      screen.getByLabelText('Microsoft-Konto-ID (erforderlich)')
    ).toHaveAttribute('aria-required', 'true');
    fireEvent.click(screen.getByRole('button', { name: 'Ausführen' }));
    expect(
      await screen.findByText('Bitte gib eine Microsoft-Konto-ID ein')
    ).toBeInTheDocument();
    expect(updateTask).not.toHaveBeenCalled();
    expect(runAction).not.toHaveBeenCalled();

    fireEvent.change(
      screen.getByLabelText('Microsoft-Konto-ID (erforderlich)'),
      {
        target: { value: '12345678-1234-1234-1234-123456789abc' },
      }
    );
    fireEvent.click(screen.getByRole('button', { name: 'Ausführen' }));
    await waitFor(() => expect(runAction).toHaveBeenCalledOnce());
  });

  it('hides the input and permits execution with the selected worker’s stored ID', async () => {
    fetchEngagements.mockReturnValue({
      data: [
        {
          id: 'engagement-1',
          microsoftAccountId: '12345678-1234-1234-1234-123456789abc',
        },
      ],
    });
    render(
      <Form
        mode="edit"
        seed={{ taskId: 'task-1', sequence: 'microsoft_deactivate_account' }}
      />
    );
    expect(
      screen.queryByLabelText('Microsoft-Konto-ID (erforderlich)')
    ).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Ausführen' }));
    await waitFor(() => expect(runAction).toHaveBeenCalledOnce());
  });

  it('does not use a stored ID belonging to another worker', async () => {
    fetchEngagements.mockReturnValue({
      data: [
        {
          id: 'engagement-2',
          microsoftAccountId: '12345678-1234-1234-1234-123456789abc',
        },
      ],
    });
    render(
      <Form
        mode="edit"
        seed={{ taskId: 'task-1', sequence: 'microsoft_deactivate_account' }}
      />
    );
    expect(
      screen.getByLabelText('Microsoft-Konto-ID (erforderlich)')
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Ausführen' }));
    expect(
      await screen.findByText('Bitte gib eine Microsoft-Konto-ID ein')
    ).toBeInTheDocument();
    expect(runAction).not.toHaveBeenCalled();
  });

  it('saves the selected function on a new task', async () => {
    render(<Form />);
    fireEvent.change(screen.getByRole('combobox'), {
      target: { value: 'microsoft_deactivate_account' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Speichern' }));
    await waitFor(() =>
      expect(createTask).toHaveBeenCalledWith(
        expect.objectContaining({ sequence: 'microsoft_deactivate_account' })
      )
    );
    expect(close).toHaveBeenCalledWith(false);
  });

  it('requires a template before saving email automation', async () => {
    render(<Form />);
    fireEvent.change(screen.getByRole('combobox'), {
      target: { value: 'microsoft_send_email' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Speichern' }));
    expect(
      await screen.findByText('Bitte wähle eine E-Mail-Vorlage')
    ).toBeInTheDocument();
    expect(createTask).not.toHaveBeenCalled();
    fireEvent.change(screen.getByRole('textbox', { name: 'E-Mail-Vorlage' }), {
      target: { value: 'mail-1' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Speichern' }));
    expect(
      await screen.findByText('Bitte wähle einen Absender')
    ).toBeInTheDocument();
    fireEvent.change(screen.getByRole('textbox', { name: 'Absender' }), {
      target: { value: 'absender@firma.de' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Speichern' }));
    await waitFor(() =>
      expect(createTask).toHaveBeenCalledWith(
        expect.objectContaining({
          sequence: 'microsoft_send_email',
          mailTemplateId: 'mail-1',
          mailSenderAddress: 'absender@firma.de',
        })
      )
    );
  });

  it('restores the saved selection and allows removing it', async () => {
    render(
      <Form
        mode="edit"
        seed={{
          taskId: 'task-1',
          sequence: 'microsoft_send_email',
          mailTemplateId: 'mail-1',
        }}
      />
    );
    expect(screen.getByRole('combobox')).toHaveValue('microsoft_send_email');
    expect(screen.getByRole('textbox', { name: 'E-Mail-Vorlage' })).toHaveValue(
      'mail-1'
    );
    fireEvent.change(screen.getByRole('combobox'), {
      target: { value: 'none' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Speichern' }));
    await waitFor(() =>
      expect(updateTask).toHaveBeenCalledWith({
        taskId: 'task-1',
        data: expect.objectContaining({ sequence: 'none' }),
      })
    );
  });
});
