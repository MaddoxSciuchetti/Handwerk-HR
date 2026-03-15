import '@/App.css';
import DropDownResuable from '@/components/DropDownResuable';
import { Button } from '@/components/ui/button';
import useFetchProcessData from '@/features/employee-overview/hooks/useFetchProcessData';
import { UseMutateFunction } from '@tanstack/react-query';
import { DeleteUser, FormType } from '../types/index.types';

interface ToDoItem {
  item_value: number;
  item: string;
  form_type: FormType;
  gotopage: (taskId: number, form_type: FormType, workerName: string) => void;
  onRemove: UseMutateFunction<DeleteUser, Error, number, unknown>;
  className?: string;
  item1?: string;
}

export function Worker_Item({
  form_type,
  item_value,
  item,
  gotopage,
  onRemove,
  item1,
}: ToDoItem) {
  const {
    isLoading: processLoading,
    completedTasksCount,
    totalTasks,
  } = useFetchProcessData(item_value, form_type);

  const calculatePercent = (completedTasks: number, total: number) => {
    if (total <= 0) return 'text-(--chart-5)';

    const percent = (completedTasks / total) * 100;

    if (percent < 20) return 'text-(--chart-5)';
    if (percent >= 20 && percent < 100) return 'text-(--chart-3)';
    if (percent === 100) return 'text-(--chart-2)';

    return 'text-(--chart-5)';
  };

  const completedCount = completedTasksCount ?? 0;
  const totalCount = totalTasks ?? 0;
  const color = calculatePercent(completedCount, totalCount);

  return (
    <tr className="group rounded-2xl py-5 transition-colors  ">
      <td className="text-sm font-semibold">
        <div className="flex items-center gap-3">
          <span>
            {item} {item1}
          </span>
          <Button
            type="button"
            size={'sm'}
            variant="outline"
            className="cursor-pointer pointer-events-none opacity-0 transition-opacity duration-150 group-hover:pointer-events-auto group-hover:opacity-100"
            onClick={() =>
              gotopage(item_value, form_type, `${item} ${item1 ?? ''}`.trim())
            }
          >
            Anschauen
          </Button>
        </div>
      </td>

      <td
        className={
          form_type === 'Onboarding'
            ? 'text-sm underline text-(--chart-1) justify-center items-center py-5'
            : 'text-sm underline text-(--chart-5) justify-center items-center py-5'
        }
        lang="en"
      >
        {form_type}
      </td>

      <th className="">
        <span className={color}>{processLoading ? '...' : completedCount}</span>
        <span className="font-medium text-foreground">/{totalCount}</span>
      </th>

      <td>
        <DropDownResuable
          description="Löschen"
          action={() => onRemove(item_value)}
        />
      </td>
    </tr>
  );
}
