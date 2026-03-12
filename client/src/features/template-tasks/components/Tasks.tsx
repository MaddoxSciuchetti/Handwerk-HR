import '@/App.css';
import { Button } from '@/components/ui/button';
import { DescriptionResponse } from '@/types/api.types';
import { Edit, TrashIcon } from 'lucide-react';
import { Dispatch, SetStateAction } from 'react';
import useDeleteDescription from '../hooks/useDeleteDescription';

type TasksProps = {
  items: DescriptionResponse[];
  openDescriptionModal: (
    description?: string | null,
    owner?: string,
    form_field_id?: number
  ) => Promise<void>;

  mode: 'EDIT' | 'ADD' | undefined;
  setMode: Dispatch<SetStateAction<'EDIT' | 'ADD' | undefined>>;
};

const Tasks = ({ items, openDescriptionModal, setMode }: TasksProps) => {
  const { deleteDescription } = useDeleteDescription();
  return (
    <div className="rounded-lg border border-border  overflow-hidden">
      <ul className="divide-y divide-border">
        {items?.map((item) => (
          <li
            className="group flex items-center overflow-x-hidden justify-between gap-4 px-4 py-3 transition-colors hover:bg-(--secondary)"
            key={item.form_field_id}
          >
            <div className="flex-1 min-w-0">
              <p className="truncate text-sm font-medium text-foreground">
                {item.description}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-1.5 rounded-full  bg-(--muted) px-2.5 py-1 text-xs font-medium text-muted-foreground">
                {item.auth_user.vorname} {item.auth_user.nachname}
              </span>

              <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                <Button
                  type="button"
                  size="icon-sm"
                  variant="ghost"
                  className="cursor-pointer rounded-md text-muted-foreground hover:text-(--muted-foreground)"
                  onClick={(e) => {
                    e.stopPropagation();
                    openDescriptionModal(
                      item.description,
                      item.owner,
                      item.form_field_id
                    );
                    setMode('EDIT');
                  }}
                >
                  <Edit className="h-4 w-4" />
                </Button>

                <Button
                  type="button"
                  size="icon-sm"
                  variant="ghost"
                  className="cursor-pointer rounded-md text-muted-foreground hover:text-(--destructive) "
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteDescription(item.form_field_id);
                  }}
                >
                  <TrashIcon className="h-4 w-4 " />
                </Button>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Tasks;
