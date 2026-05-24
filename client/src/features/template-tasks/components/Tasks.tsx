import '@/App.css';

import TrashWithModal from '@/components/DropDownWithModal';
import { Button } from '@/components/ui/button';
import { DescriptionResponse } from '@/types/api.types';
import { Edit } from 'lucide-react';
import useDeleteDescription from '../hooks/useDeleteDescription';
import useTemplateModalContext from '../hooks/useTemplateModalContext';

type TasksProps = {
  items: DescriptionResponse[];
  openEditTask: (
    form_field_id: number,
    description: string,
    owner: string
  ) => void;
};

const Tasks = ({ items }: TasksProps) => {
  const { deleteDescription } = useDeleteDescription();
  const { openEditTask } = useTemplateModalContext();
  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-lg">
      <ul className="mt-3 min-h-0 flex-1 overflow-y-auto overscroll-contain rounded-2xl">
        {items?.map((item) => (
          <li
            className="group flex items-center overflow-x-hidden border-b last:border-b-0 justify-between gap-4 px-4 py-3 transition-colors hover:bg-(--secondary)"
            key={item.form_field_id}
          >
            <div className="flex-1 min-w-0">
              <p
                className="truncate text-sm font-medium text-foreground"
                title={item.description!}
              >
                {item.description}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-1.5 rounded-full  bg-(--muted) px-2.5 py-1 text-xs font-medium text-muted-foreground">
                {item.auth_user.vorname} {item.auth_user.nachname}
              </span>

              <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100 focus:within:opacity-100">
                <Button
                  type="button"
                  size="icon-sm"
                  variant="ghost"
                  className="cursor-pointer rounded-md text-muted-foreground hover:text-(--muted-foreground)"
                  onClick={(e) => {
                    e.stopPropagation();
                    openEditTask(
                      item.form_field_id,
                      item.description!,
                      item.owner
                    );
                  }}
                >
                  <Edit aria-hidden="true" className="h-4 w-4" />
                </Button>
                <TrashWithModal
                  description="Vorlage-Aufgabe löschen"
                  onConfirm={() => deleteDescription(item.form_field_id)}
                />
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Tasks;
