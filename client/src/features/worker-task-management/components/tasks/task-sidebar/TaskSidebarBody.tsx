import { DescriptionField } from '@/types/api.types';
import { InsertHistoryData } from '../../../types/index.types';
import HistoryContent from './task-history/HistoryContent';
import StatusInformation from './task-status-information/StatusInformation';

type TaskSidebarBodyProps = {
  selectedTask: DescriptionField;
  handleSubmit: (values: InsertHistoryData) => Promise<void>;
};

function TaskSidebarBody({ selectedTask, handleSubmit }: TaskSidebarBodyProps) {
  return (
    <>
      <div className="px-6 py-5">
        <StatusInformation
          key={selectedTask.id}
          id={selectedTask.id}
          editcomment={selectedTask.edit}
          select_option={selectedTask.status}
          form_field_id={selectedTask.form_field_id}
          handleSubmit={handleSubmit}
        />
      </div>
      <div className="px-6 pb-5">
        <HistoryContent taskId={String(selectedTask.id)} />
      </div>
    </>
  );
}

export default TaskSidebarBody;
