import { act, renderHook } from '@testing-library/react';
import { useForm } from 'react-hook-form';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { useTaskAutosave } from '@/features/all-tasks/hooks/useTaskAutosave';
import type { TaskSidebarForm } from '@/features/all-tasks/types/index.types';
const defaults: TaskSidebarForm = {
  title: 'Before',
  workerEngagementId: 'engagement',
  assigneeUserId: '',
  status: 'open',
  automation: 'none',
  sequence: 'none',
  mailTemplateId: '',
  mailSenderAddress: '',
};
function setup(save = vi.fn().mockResolvedValue({}), enabled = true) {
  const hook = renderHook(() => {
    const form = useForm<TaskSidebarForm>({ defaultValues: defaults });
    const autosave = useTaskAutosave(form, enabled, save);
    return { form, ...autosave };
  });
  return { ...hook, save };
}
async function tick(ms = 0) {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(ms);
  });
}
beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());
it('does not save on mount and saves only the edited dropdown immediately', async () => {
  const { result, save } = setup();
  await tick(500);
  expect(save).not.toHaveBeenCalled();
  act(() => result.current.form.setValue('status', 'done'));
  await tick();
  expect(save).toHaveBeenCalledExactlyOnceWith({ status: 'done' });
  expect(result.current.state).toBe('saved');
});
it('coalesces typing into one title save after 250ms even with an unassigned task', async () => {
  const { result, save } = setup();
  act(() => result.current.form.setValue('title', 'A'));
  await tick(200);
  act(() => result.current.form.setValue('title', 'After'));
  await tick(249);
  expect(save).not.toHaveBeenCalled();
  await tick(1);
  expect(save).toHaveBeenCalledExactlyOnceWith({ title: 'After' });
});
it('serializes requests and preserves edits made while a save is in flight', async () => {
  let finish!: () => void;
  const save = vi
    .fn()
    .mockImplementationOnce(
      () =>
        new Promise<void>((resolve) => {
          finish = resolve;
        })
    )
    .mockResolvedValue({});
  const { result } = setup(save);
  act(() => result.current.form.setValue('status', 'in_progress'));
  await tick();
  act(() => result.current.form.setValue('status', 'done'));
  await tick();
  act(() => result.current.form.setValue('title', 'After'));
  await tick(250);
  expect(save).toHaveBeenCalledTimes(1);
  await act(async () => {
    finish();
  });
  expect(save.mock.calls.map(([patch]) => patch)).toEqual([
    { status: 'in_progress' },
    { status: 'done' },
    { title: 'After' },
  ]);
  expect(result.current.state).toBe('saved');
});
it('flushes a pending title immediately before closing', async () => {
  const { result, save } = setup();
  act(() => result.current.form.setValue('title', 'After'));
  await act(async () => {
    expect(await result.current.flush()).toBe(true);
  });
  expect(save).toHaveBeenCalledExactlyOnceWith({ title: 'After' });
  await tick(500);
  expect(save).toHaveBeenCalledTimes(1);
});
it('retains failed changes for retry and reports failure to a close request', async () => {
  const save = vi
    .fn()
    .mockRejectedValueOnce(new Error('Offline'))
    .mockResolvedValue({});
  const { result } = setup(save);
  act(() => result.current.form.setValue('status', 'done'));
  await act(async () => {
    expect(await result.current.flush()).toBe(false);
  });
  expect(result.current.state).toBe('error');
  await act(async () => {
    expect(await result.current.flush()).toBe(true);
  });
  expect(save.mock.calls.map(([patch]) => patch)).toEqual([
    { status: 'done' },
    { status: 'done' },
  ]);
  expect(result.current.state).toBe('saved');
});
it('validates automation as a group without blocking independent field edits', async () => {
  const { result, save } = setup();
  act(() => result.current.form.setValue('sequence', 'microsoft_send_email'));
  await tick();
  expect(save).not.toHaveBeenCalled();
  act(() => result.current.form.setValue('status', 'done'));
  await tick();
  expect(save).toHaveBeenCalledExactlyOnceWith({ status: 'done' });
  await act(async () => {
    expect(await result.current.flush()).toBe(false);
  });
  act(() => {
    result.current.form.setValue('mailTemplateId', 'template');
    result.current.form.setValue('mailSenderAddress', 'sender@test.de');
  });
  await tick();
  expect(save).toHaveBeenLastCalledWith({
    sequence: 'microsoft_send_email',
    mailTemplateId: 'template',
    mailSenderAddress: 'sender@test.de',
  });
  expect(result.current.state).toBe('saved');
});
it('does not autosave the create form', async () => {
  const { result, save } = setup(undefined, false);
  act(() => result.current.form.setValue('title', 'New task'));
  await tick(500);
  expect(save).not.toHaveBeenCalled();
});
it('does not save invalid titles or a return to the already saved value', async () => {
  const { result, save } = setup();
  act(() => result.current.form.setValue('title', ''));
  await tick(250);
  expect(save).not.toHaveBeenCalled();
  await act(async () => {
    expect(await result.current.flush()).toBe(false);
  });
  act(() => result.current.form.setValue('title', 'Before'));
  await tick(250);
  expect(save).not.toHaveBeenCalled();
  expect(result.current.state).toBe('saved');
});

it('includes edits made during an in-flight close flush before allowing close', async () => {
  let finish!: () => void;
  const save = vi
    .fn()
    .mockImplementationOnce(
      () =>
        new Promise<void>((resolve) => {
          finish = resolve;
        })
    )
    .mockResolvedValue({});
  const { result } = setup(save);
  act(() => result.current.form.setValue('status', 'done'));
  let closing!: Promise<boolean>;
  await act(async () => {
    closing = result.current.flush();
  });
  act(() => result.current.form.setValue('title', 'Latest title'));
  await act(async () => {
    finish();
    expect(await closing).toBe(true);
  });
  expect(save.mock.calls.map(([patch]) => patch)).toEqual([
    { status: 'done' },
    { title: 'Latest title' },
  ]);
});

it('keeps the newest edit when an earlier request fails', async () => {
  let fail!: (error: Error) => void;
  const save = vi
    .fn()
    .mockImplementationOnce(
      () =>
        new Promise((_resolve, reject) => {
          fail = reject;
        })
    )
    .mockResolvedValue({});
  const { result } = setup(save);
  act(() => result.current.form.setValue('status', 'in_progress'));
  await tick();
  act(() => result.current.form.setValue('status', 'done'));
  await tick();
  await act(async () => {
    fail(new Error('Offline'));
  });
  expect(result.current.state).toBe('error');
  await act(async () => {
    expect(await result.current.flush()).toBe(true);
  });
  expect(save.mock.calls.map(([patch]) => patch)).toEqual([
    { status: 'in_progress' },
    { status: 'done' },
  ]);
});
