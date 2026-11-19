import { STAGING_HOME_PATH } from '@/config/env';
import { useNavigate } from '@tanstack/react-router';
import { useEffect, useRef, useState } from 'react';
import { createStagingSession } from '../api/auth.api';
import {
  clearStagingEnter,
  consumeAuthBounceToLogin,
  markStagingEnter,
  wasStagingEnteredRecently,
} from '../stagingSessionGuard';

const RETRY_LIMIT = 3;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Staging-only: mint a session via the API (no password in the bundle) and
 * send the browser straight to the main app shell.
 *
 * Mounted on `/login` — that route is the shared staging entry URL.
 */
export function StagingAutoEnter() {
  const navigate = useNavigate();
  const started = useRef(false);
  const [error, setError] = useState<string | null>(null);
  const [retryToken, setRetryToken] = useState(0);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    void (async () => {
      // Only block when axios hard-redirected us here after a mint whose
      // cookies did not stick. Soft revisits (logout, back, /login link)
      // must still re-enter.
      const bouncedFromAuth = consumeAuthBounceToLogin();
      if (bouncedFromAuth && wasStagingEnteredRecently()) {
        setError(
          'Die Staging-Sitzung konnte nicht gehalten werden. Bitte erneut versuchen.'
        );
        return;
      }

      let lastMessage = 'Staging-Sitzung konnte nicht gestartet werden.';
      for (let attempt = 1; attempt <= RETRY_LIMIT; attempt++) {
        try {
          await createStagingSession();
          markStagingEnter();
          await navigate({ to: STAGING_HOME_PATH });
          return;
        } catch (err) {
          lastMessage =
            err && typeof err === 'object' && 'message' in err
              ? String((err as { message?: string }).message)
              : lastMessage;
          if (attempt < RETRY_LIMIT) {
            await sleep(700 * attempt);
          }
        }
      }

      setError(lastMessage);
    })();
  }, [navigate, retryToken]);

  if (error) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-3 px-6 text-center">
        <h1 className="text-2xl font-semibold">Kurz warten…</h1>
        <p className="max-w-md text-muted-foreground">
          Die Staging-App startet gerade neu. Bitte erneut versuchen.
        </p>
        <button
          type="button"
          className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground"
          onClick={() => {
            clearStagingEnter();
            setError(null);
            started.current = false;
            setRetryToken((n) => n + 1);
          }}
        >
          Erneut versuchen
        </button>
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh items-center justify-center text-sm text-muted-foreground">
      Staging — trete der App bei…
    </div>
  );
}
