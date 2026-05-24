import { AlertCircle } from 'lucide-react';
import { IssueResponse } from '../types/index.types';

export function PriorityIndicator({
  priority,
}: {
  priority: IssueResponse['priority'];
}) {
  if (priority === 'urgent' || priority === 'high') {
    return (
      <AlertCircle
        className="size-3 shrink-0 text-red-500"
        aria-hidden
        strokeWidth={2}
      />
    );
  }
  if (priority === 'medium') {
    return (
      <span
        className="inline-block size-2.5 shrink-0 rounded-full bg-amber-500"
        aria-hidden
      />
    );
  }
  return (
    <span
      className="inline-block size-2.5 shrink-0 rounded-full bg-green-600"
      aria-hidden
    />
  );
}
