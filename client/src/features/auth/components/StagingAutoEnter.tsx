import { STAGING_HOME_PATH } from '@/config/env';
import { useNavigate } from '@tanstack/react-router';
import { useEffect, useRef, useState } from 'react';
import { createStagingSession } from '../api/auth.api';

/**
 * Staging-only: mint a session via the API (no password in the bundle) and
 * send the browser straight to the main app shell.
 */
export function StagingAutoEnter() {
  const navigate = useNavigate();
  const started = useRef(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    void (async () => {
      try {
        await createStagingSession();
        await navigate({ to: STAGING_HOME_PATH });
      } catch (err) {
        const message =
          err && typeof err === 'object' && 'message' in err
            ? String((err as { message?: string }).message)
            : 'Staging-Sitzung konnte nicht gestartet werden.';
        setError(message);
      }
    })();
  }, [navigate]);

  if (error) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-2 px-6 text-center">
        <h1 className="text-2xl font-semibold">Staging-Login fehlgeschlagen</h1>
        <p className="text-destructive">{error}</p>
        <p className="text-sm text-muted-foreground">
          Prüfe STAGING_SKIP_LOGIN / APP_ENV=staging auf dem API-Service und
          VITE_STAGING_SKIP_LOGIN auf dem Frontend.
        </p>
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh items-center justify-center text-sm text-muted-foreground">
      Staging — trete der App bei…
    </div>
  );
}
