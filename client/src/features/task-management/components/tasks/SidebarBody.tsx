import { DescriptionField } from '@/types/api.types';
import { InsertHistoryData } from '../../types/index.types';
import HistoryContent from './task-sidebar/task-history/HistoryContent';
import StatusInformation from './task-sidebar/task-status-information/StatusInformation';

type SidebarBodyProps = {
  workerId: string;
  selectedTask: DescriptionField;
  handleSubmit: (values: InsertHistoryData) => Promise<void>;
};

const SidebarBody = ({
  workerId,
  selectedTask,
  handleSubmit,
}: SidebarBodyProps) => {
  return (
    <>
      <div className="flex-1 overflow-y-auto">
        <div className="px-6 py-5">
          <StatusInformation
            key={selectedTask.id}
            workerId={workerId}
            id={selectedTask.id}
            editcomment={selectedTask.edit}
            taskStatus={selectedTask.status}
            statusId={selectedTask.statusId}
            form_field_id={selectedTask.form_field_id}
            handleSubmit={handleSubmit}
          />
        </div>
        <div className="px-6 pb-5">
          <HistoryContent
            workerId={workerId}
            id_original={selectedTask.id}
            omitCreationAudit={!!selectedTask.templateItemId}
          />
        </div>
      </div>
    </>
  );
};

export default SidebarBody;
