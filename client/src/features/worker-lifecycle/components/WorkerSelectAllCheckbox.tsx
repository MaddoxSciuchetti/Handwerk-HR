import { Checkbox } from '@/components/ui/checkbox';
import type { Dispatch, SetStateAction } from 'react';
import type { WorkerRecord } from '../types/index.types';
import type { WorkerSelection } from './ProjectItem';

type Props = {
  workers: WorkerRecord[];
  selected: WorkerSelection[];
  onChange: Dispatch<SetStateAction<WorkerSelection[]>>;
  disabled: boolean;
};

export function WorkerSelectAllCheckbox({
  workers,
  selected,
  onChange,
  disabled,
}: Props) {
  const selectedIds = new Set(selected.map((item) => item.engagementNumber));
  const allSelected =
    workers.length > 0 && workers.every((worker) => selectedIds.has(worker.id));
  const someSelected = workers.some((worker) => selectedIds.has(worker.id));
  return (
    <Checkbox
      checked={allSelected ? true : someSelected ? 'indeterminate' : false}
      disabled={disabled || workers.length === 0}
      aria-label={
        allSelected ? 'Alle Handwerker abwählen' : 'Alle Handwerker auswählen'
      }
      className="relative cursor-pointer after:absolute after:-inset-3 after:content-['']"
      onCheckedChange={(checked) => {
        const visibleIds = new Set(workers.map((worker) => worker.id));
        onChange((previous) => {
          const remaining = previous.filter(
            (item) => !visibleIds.has(item.engagementNumber)
          );
          if (checked !== true) return remaining;
          return [
            ...remaining,
            ...workers.map((worker) => ({
              engagementNumber: worker.id,
              engagementTitle: `${worker.firstName} ${worker.lastName}`.trim(),
              engagementId: worker.engagements[0].id,
              type: worker.engagements[0].type,
            })),
          ];
        });
      }}
    />
  );
}
