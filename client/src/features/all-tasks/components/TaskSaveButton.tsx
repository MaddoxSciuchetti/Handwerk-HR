import { useEffect, useState } from 'react';
import { LoaderCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { TaskAutosaveState } from '../hooks/useTaskAutosave';

export function TaskSaveButton({
  state,
  onSave,
}: {
  state: TaskAutosaveState;
  onSave: () => Promise<boolean>;
}) {
  const busy = state === 'pending' || state === 'saving';
  const [previousBusy, setPreviousBusy] = useState(busy);
  const [settling, setSettling] = useState(busy);
  if (previousBusy !== busy) {
    setPreviousBusy(busy);
    if (busy) setSettling(true);
  }
  useEffect(() => {
    if (busy) return;
    // Keep fast saves perceptible without delaying the save request itself.
    const timer = setTimeout(() => setSettling(false), 300);
    return () => clearTimeout(timer);
  }, [busy]);
  const showSpinner = busy || (settling && state === 'saved');
  return (
    <Button
      type="button"
      className="min-w-24 rounded-2xl"
      aria-label={
        state === 'error'
          ? 'Speichern fehlgeschlagen. Erneut versuchen'
          : 'Speichern'
      }
      aria-busy={showSpinner}
      disabled={state === 'saving'}
      onClick={() => void onSave()}
    >
      {showSpinner ? (
        <span role="status" aria-label="Wird gespeichert">
          <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
        </span>
      ) : (
        'Speichern'
      )}
    </Button>
  );
}
