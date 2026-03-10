import DropDownResuable from '@/components/DropDownResuable';
import { Button } from '@/components/ui/button';
import useFetchProcessData from '@/features/employee-overview/hooks/useFetchProcessData';
import { UseMutateFunction } from '@tanstack/react-query';
import { DeleteUser } from '../types/index.types';

interface ToDoItem {
  item_value: number;
  item: string;
  form_type: string;
  gotopage: (taskId: number, form_type: any) => void;
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
    data: processData,
    isLoading: processLoading,
    completedTasksCount,
    totalTasks,
  } = useFetchProcessData(item_value, form_type);

  const calculatePercent = (completedTasks: number, total: number) => {
    const percent = (completedTasks / total) * 100;
    console.log('this is the percent calculation');
    console.log(percent);
    if (percent < 20) return 'text-(--chart-5)';
    if (percent >= 20 && percent < 100) return 'text-orange-500';
    if (percent === 100) return 'text-(--chart-2)';
  };

  const color = calculatePercent(completedTasksCount!, totalTasks!);
  console.log('lifecycle type in worker-lifycycle', item_value, form_type);
  return (
    <tr className="group rounded-2xl py-5 transition-colors hover:bg-muted/50">
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
            onClick={() => gotopage(item_value, form_type)}
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
        <span className={color}>
          {processLoading ? '...' : completedTasksCount}
        </span>
        <span className="font-medium text-foreground">
          /{processData?.form?.fields?.length || 0}
        </span>
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
