import { useEffect, useRef, useState } from 'react';
import type { UseFormReturn } from 'react-hook-form';
import { taskFormSchema } from '../schemas/taskForm.schema';
import type { TaskSidebarForm } from '../types/index.types';

type Field = keyof TaskSidebarForm;
type Patch = Partial<TaskSidebarForm>;
export type TaskAutosaveState =
  | 'saved'
  | 'pending'
  | 'saving'
  | 'invalid'
  | 'error';
const automationFields: Field[] = [
  'sequence',
  'mailTemplateId',
  'mailSenderAddress',
];

export function useTaskAutosave(
  form: Pick<
    UseFormReturn<TaskSidebarForm>,
    'watch' | 'getValues' | 'setError' | 'clearErrors'
  >,
  enabled: boolean,
  save: (patch: Patch) => Promise<unknown>
) {
  const [state, setState] = useState<TaskAutosaveState>('saved');
  const saveRef = useRef(save);
  saveRef.current = save;
  const saved = useRef({ ...form.getValues() });
  const pending = useRef(new Map<string, Patch>());
  const timers = useRef(new Map<string, ReturnType<typeof setTimeout>>());
  const running = useRef<Promise<boolean> | null>(null);
  const invalid = useRef(new Set<string>());
  const mounted = useRef(true);
  const updateState = (next: typeof state) => {
    if (mounted.current) setState(next);
  };

  const drain = (): Promise<boolean> => {
    if (running.current) return running.current;
    running.current = (async () => {
      // Yield once so running is assigned even when there is nothing to save.
      await Promise.resolve();
      while (pending.current.size) {
        const [key, patch] = pending.current.entries().next().value!;
        pending.current.delete(key);
        if (
          Object.entries(patch).every(
            ([field, value]) => saved.current[field as Field] === value
          )
        )
          continue;
        updateState('saving');
        try {
          await saveRef.current(patch);
          Object.assign(saved.current, patch);
        } catch {
          // Keep the latest edit for retry, including edits made during this request.
          if (!pending.current.has(key)) pending.current.set(key, patch);
          updateState('error');
          return false;
        }
      }
      updateState(
        timers.current.size
          ? 'pending'
          : invalid.current.size
            ? 'invalid'
            : 'saved'
      );
      return invalid.current.size === 0;
    })().finally(() => {
      running.current = null;
    });
    return running.current;
  };

  const collect = (key: string) => {
    const values = form.getValues();
    const fields = key === 'sequence' ? automationFields : [key as Field];
    const patch: Patch = {};
    let valid = true;
    for (const field of fields) {
      const result = taskFormSchema.shape[field].safeParse(values[field]);
      if (!result.success) {
        form.setError(field, {
          type: 'validate',
          message: result.error.issues[0].message,
        });
        valid = false;
      } else {
        form.clearErrors(field);
        Object.assign(patch, { [field]: result.data });
      }
    }
    if (key === 'sequence') {
      if (
        (values.sequence === 'microsoft_send_email' ||
          values.sequence === 'microsoft_send_teams_message') &&
        !values.mailTemplateId
      ) {
        form.setError('mailTemplateId', {
          type: 'validate',
          message: 'Bitte wähle eine E-Mail-Vorlage',
        });
        valid = false;
      }
      if (
        values.sequence === 'microsoft_send_email' &&
        !values.mailSenderAddress.trim()
      ) {
        form.setError('mailSenderAddress', {
          type: 'validate',
          message: 'Bitte wähle einen Absender',
        });
        valid = false;
      }
    }
    if (!valid) {
      invalid.current.add(key);
      pending.current.delete(key);
      updateState('invalid');
      return;
    }
    invalid.current.delete(key);
    pending.current.set(key, patch);
  };

  const flush = async () => {
    do {
      for (const [key, timer] of timers.current) {
        clearTimeout(timer);
        collect(key);
      }
      timers.current.clear();
      if (!(await drain())) return false;
    } while (timers.current.size || pending.current.size);
    return true;
  };
  const flushRef = useRef(flush);
  flushRef.current = flush;

  useEffect(() => {
    mounted.current = true;
    if (!enabled) return;
    const subscription = form.watch((_values, { name }) => {
      if (!name) return;
      const key = automationFields.includes(name as Field) ? 'sequence' : name;
      const timer = timers.current.get(key);
      if (timer) clearTimeout(timer);
      updateState('pending');
      // Coalesce keystrokes, while dropdown selections save on the next tick.
      timers.current.set(
        key,
        setTimeout(
          () => {
            timers.current.delete(key);
            collect(key);
            void drain();
          },
          name === 'title' ? 250 : 0
        )
      );
    });
    return () => {
      subscription.unsubscribe();
      void flushRef.current();
    };
    // The form methods are stable; callbacks read current values and saveRef.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, form.watch]);

  useEffect(
    () => () => {
      mounted.current = false;
    },
    []
  );
  return { state, flush };
}
