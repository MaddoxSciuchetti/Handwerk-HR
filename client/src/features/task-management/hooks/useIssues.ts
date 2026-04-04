import { useEffect, useState } from 'react';
import { IssueStatusOption } from '../api/index.api';

const PRIORITIES = [
  { value: 'urgent' as const, label: 'Dringend' },
  { value: 'high' as const, label: 'Hoch' },
  { value: 'medium' as const, label: 'Mittel' },
  { value: 'low' as const, label: 'Niedrig' },
  { value: 'no_priority' as const, label: 'Keine' },
];

type PriorityValue = (typeof PRIORITIES)[number]['value'];

function useIssues(statuses: IssueStatusOption[]) {
  const [title, setTitle] = useState('');
  const [statusId, setStatusId] = useState('');
  const [priority, setPriority] = useState<PriorityValue>('no_priority');
  const [assigneeUserId, setAssigneeUserId] = useState('');

  useEffect(() => {
    if (!statuses.length || statusId) return;
    const def = statuses.find((s) => s.name === 'Offen') ?? statuses[0];
    if (def) setStatusId(def.id);
  }, [statuses, statusId]);

  return {
    title,
    statusId,
    priority,
    assigneeUserId,
    setTitle,
    setPriority,
    setStatusId,
    statuses,
    setAssigneeUserId,
  };
}

export default useIssues;
