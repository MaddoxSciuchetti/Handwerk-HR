import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { useMemo, useState } from 'react';
import { tasksQueries } from '../query/tasks.query';
import type { IssueResponse } from '../types/index.types';
import { openMentionTasks } from '../utilts/mention-tasks.utils';

const SEEN_MENTION_TASKS = 'seen-mention-task-ids';

function readSeenMentionIds() {
  try {
    const raw = localStorage.getItem(SEEN_MENTION_TASKS);
    const parsed = raw ? (JSON.parse(raw) as unknown) : [];
    if (!Array.isArray(parsed)) return new Set<string>();
    return new Set(parsed.filter((id) => typeof id === 'string'));
  } catch {
    return new Set<string>();
  }
}

function rememberMentionIds(ids: string[]) {
  const seen = readSeenMentionIds();
  ids.forEach((id) => seen.add(id));
  localStorage.setItem(SEEN_MENTION_TASKS, JSON.stringify([...seen]));
}

export function MentionNotice() {
  const navigate = useNavigate();
  const { data } = useQuery(tasksQueries.fetchTasks());
  const mentions = useMemo(() => openMentionTasks(data), [data]);
  const [notice, setNotice] = useState<IssueResponse[]>([]);
  const [syncedMentions, setSyncedMentions] = useState(mentions);

  if (mentions !== syncedMentions) {
    setSyncedMentions(mentions);
    const seen = readSeenMentionIds();
    const fresh = mentions.filter((task) => !seen.has(task.id));
    if (fresh.length > 0) setNotice(fresh);
  }

  const dismiss = () => {
    rememberMentionIds(notice.map((task) => task.id));
    setNotice([]);
  };

  const openMention = () => {
    const task = notice[0];
    const workerId = task?.workerEngagement?.workerId;
    const worker = task?.workerEngagement?.worker;
    dismiss();
    if (!workerId) return;
    void navigate({
      to: '/user/$Id',
      params: { Id: workerId },
      search: {
        workerName: worker
          ? `${worker.firstName} ${worker.lastName}`.trim()
          : '',
        prevPage: 'Handwerker',
      },
    });
  };

  const count = notice.length;
  const canOpenWorker = Boolean(notice[0]?.workerEngagement?.workerId);

  return (
    <Dialog
      open={count > 0}
      onOpenChange={(open) => {
        if (!open) dismiss();
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Du wurdest erwähnt</DialogTitle>
          <DialogDescription>
            {count === 1
              ? 'Du wurdest in einer Aufgabe erwähnt.'
              : `Du wurdest in ${count} Aufgaben erwähnt.`}
          </DialogDescription>
        </DialogHeader>
        <ul className="flex flex-col gap-2">
          {notice.map((task) => (
            <li
              key={task.id}
              className="flex items-center gap-3 rounded-xl bg-muted px-3 py-2 text-sm"
            >
              <span className="inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-primary text-[11px] font-semibold text-primary-foreground">
                1
              </span>
              <span className="min-w-0 truncate">{task.title}</span>
            </li>
          ))}
        </ul>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={dismiss}>
            Schließen
          </Button>
          {canOpenWorker ? (
            <Button type="button" onClick={openMention}>
              Zur Aufgabe
            </Button>
          ) : null}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
