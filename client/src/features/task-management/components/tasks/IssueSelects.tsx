import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Dispatch, SetStateAction } from 'react';
import { IssueStatusOption } from '../../api/index.api';
import { Employees } from '../../types/index.types';

type IssueSelectsProps = {
  statusId: string;
  setStatusId: (statusId: string) => void;
  statuses: IssueStatusOption[];
  priority: string;
  setPriority: Dispatch<
    SetStateAction<'urgent' | 'high' | 'medium' | 'low' | 'no_priority'>
  >;
  assigneeUserId: string;
  setAssigneeUserId: (assigneeUserId: string) => void;
  employees: Employees;
};

function IssueSelects({
  statusId,
  setStatusId,
  statuses,
  priority,
  setPriority,
  assigneeUserId,
  setAssigneeUserId,
  employees,
}: IssueSelectsProps) {
  const PRIORITIES = [
    { value: 'urgent' as const, label: 'Dringend' },
    { value: 'high' as const, label: 'Hoch' },
    { value: 'medium' as const, label: 'Mittel' },
    { value: 'low' as const, label: 'Niedrig' },
    { value: 'no_priority' as const, label: 'Keine' },
  ];

  type PriorityValue = (typeof PRIORITIES)[number]['value'];
  return (
    <>
      <Label>Status</Label>
      <Select value={statusId} onValueChange={setStatusId}>
        <SelectTrigger className="mt-1 w-full">
          <SelectValue placeholder="Status wählen" />
        </SelectTrigger>
        <SelectContent>
          {statuses.map((s) => (
            <SelectItem key={s.id} value={s.id}>
              {s.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Label>Priorität</Label>
      <Select
        value={priority}
        onValueChange={(v) => setPriority(v as PriorityValue)}
      >
        <SelectTrigger className="mt-1 w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {PRIORITIES.map((p) => (
            <SelectItem key={p.value} value={p.value}>
              {p.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Label>Verantwortlich (Lead)</Label>
      <Select
        value={assigneeUserId || '_none'}
        onValueChange={(v) => setAssigneeUserId(v === '_none' ? '' : v)}
      >
        <SelectTrigger className="mt-1 w-full">
          <SelectValue placeholder="Person wählen" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="_none">—</SelectItem>
          {employees.map((emp) => (
            <SelectItem key={emp.id} value={emp.id}>
              {emp.firstName} {emp.lastName}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </>
  );
}
export default IssueSelects;
