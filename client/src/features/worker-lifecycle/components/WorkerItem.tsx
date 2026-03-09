import DropDownResuable from '@/components/DropDownResuable';
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
    if (percent < 20) return 'text-red-500';
    if (percent > 20 && percent <= 99) return 'text-yellow-300';
    if (percent === 100) return 'text-green-500';
  };

  const color = calculatePercent(completedTasksCount!, totalTasks!);
  console.log('lifecycle type in worker-lifycycle', item_value, form_type);
  return (
    <tr
      onClick={() => gotopage(item_value, form_type)}
      className="hover:bg-muted-foreground rounded-2xl cursor-pointer   py-5"
    >
      <td className="text-sm font-semibold">
        {item} {item1}
      </td>

      <td
        className={
          form_type === 'Onboarding'
            ? 'text-sm underline decoration-2 decoration-sky-400 justify-center items-center py-5'
            : 'text-sm underline decoration-2 decoration-red-400 justify-center items-center py-5'
        }
        lang="en"
      >
        {form_type}
      </td>

      <th className="">
        <span className={color}>
          {processLoading ? '...' : completedTasksCount}
        </span>
        <span className="text-black font-medium">
          /{processData?.form?.fields?.length || 0}
        </span>
      </th>

      <td>
        <DropDownResuable
          description="Löschen"
          action={() => onRemove(item_value)}
          imgsrc="/assets/editReact.svg"
        />
      </td>
    </tr>
  );
}
