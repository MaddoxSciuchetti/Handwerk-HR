import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  connectionKey,
  connectTeams,
  getConnection,
  teamsError,
} from '@/features/microsoft-teams/teams.api';
import useAuth from '@/features/user-profile/hooks/useAuth';
import { cn } from '@/lib/utils';
import { keepPreviousData, useMutation, useQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import {
  searchSharePointFiles,
  type SharePointFileHit,
} from '../documentMasters.api';

type SharePointFilePickerProps = {
  disabled?: boolean;
  selected: SharePointFileHit | null;
  onSelect: (file: SharePointFileHit | null) => void;
};

function searchErrorMessage(error: unknown) {
  return teamsError(error);
}

export function SharePointFilePicker({
  disabled = false,
  selected,
  onSelect,
}: SharePointFilePickerProps) {
  const { user } = useAuth();
  const [query, setQuery] = useState('');
  const [debounced, setDebounced] = useState('');

  useEffect(() => {
    const handle = window.setTimeout(() => setDebounced(query.trim()), 120);
    return () => window.clearTimeout(handle);
  }, [query]);

  const connection = useQuery({
    queryKey: [
      ...connectionKey(user?.id, user?.organizationId),
      'connection',
    ],
    queryFn: getConnection,
    enabled: Boolean(user?.organizationId),
    staleTime: 30_000,
  });

  const connect = useMutation({
    mutationFn: connectTeams,
    onSuccess: ({ url }) => {
      window.location.assign(url);
    },
  });

  const connected = connection.data?.status === 'connected';
  const needsReconnect = connection.data?.status === 'reconnect_required';
  const microsoftReady = connected && !needsReconnect;

  const search = useQuery({
    queryKey: ['sharepoint-files', user?.organizationId, user?.id, debounced],
    queryFn: () => searchSharePointFiles(debounced),
    enabled: Boolean(microsoftReady && debounced.length > 0 && !disabled),
    staleTime: 5_000,
    placeholderData: keepPreviousData,
  });

  const files = search.data?.files ?? [];
  const showResults = Boolean(debounced) && !search.isError;

  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor="sharepoint-search">SharePoint</Label>
      {!connection.isLoading && !microsoftReady ? (
        <div className="flex flex-col gap-2 rounded-2xl border border-dashed border-border px-4 py-3 text-sm">
          <p className="text-muted-foreground">
            {needsReconnect
              ? 'Microsoft muss erneut verbunden werden, damit SharePoint-Dateien geladen werden können.'
              : 'Verbinde Microsoft, um Dateien aus SharePoint zu suchen.'}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="rounded-full"
              disabled={connect.isPending || connection.data?.ready === false}
              onClick={() => connect.mutate()}
            >
              {connect.isPending ? 'Wird geöffnet…' : 'Microsoft verbinden'}
            </Button>
            <Link
              to="/settings/profile"
              className="text-sm text-muted-foreground underline-offset-4 hover:underline"
            >
              Zu den Einstellungen
            </Link>
          </div>
          {connect.isError ? (
            <p className="text-sm text-destructive">
              {teamsError(connect.error)}
            </p>
          ) : null}
          {connection.data?.ready === false ? (
            <p className="text-sm text-muted-foreground">
              Microsoft ist für die Organisation noch nicht eingerichtet.
            </p>
          ) : null}
        </div>
      ) : (
        <>
          <Input
            id="sharepoint-search"
            value={query}
            disabled={disabled || connection.isLoading}
            placeholder="Dateiname suchen…"
            autoComplete="off"
            onChange={(event) => {
              setQuery(event.target.value);
              if (selected) onSelect(null);
            }}
          />
          {selected ? (
            <p className="text-sm" aria-live="polite">
              Ausgewählt: {selected.name}
              {selected.libraryName ? ` · ${selected.libraryName}` : ''}
            </p>
          ) : null}
          {debounced && search.isFetching ? (
            <p className="text-xs text-muted-foreground">Suche…</p>
          ) : null}
          {search.isError ? (
            <p className="text-sm text-destructive">
              {searchErrorMessage(search.error)}
            </p>
          ) : null}
          {showResults ? (
            files.length === 0 && !search.isFetching ? (
              <p className="text-sm text-muted-foreground">
                Keine passenden Dateien gefunden.
              </p>
            ) : files.length > 0 ? (
              <ul
                className="max-h-56 overflow-y-auto rounded-2xl border border-border"
                role="listbox"
                aria-label="SharePoint-Dateien"
              >
                {files.map((file) => {
                  const active =
                    selected?.id === file.id &&
                    selected.driveId === file.driveId;
                  return (
                    <li key={`${file.driveId}:${file.id}`}>
                      <button
                        type="button"
                        role="option"
                        aria-selected={active}
                        disabled={disabled}
                        onClick={() => onSelect(file)}
                        className={cn(
                          'flex w-full flex-col items-start gap-0.5 px-4 py-2.5 text-left text-sm transition-colors hover:bg-muted/60 focus-visible:bg-muted/60 focus-visible:outline-none',
                          active && 'bg-muted'
                        )}
                      >
                        <span className="font-medium break-all">
                          {file.name}
                        </span>
                        {file.libraryName ? (
                          <span className="text-xs text-muted-foreground">
                            {file.libraryName}
                          </span>
                        ) : null}
                      </button>
                    </li>
                  );
                })}
              </ul>
            ) : null
          ) : null}
        </>
      )}
    </div>
  );
}
