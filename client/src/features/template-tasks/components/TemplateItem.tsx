import { Button } from '@/components/ui/button';
import { TableCell, TableRow } from '@/components/ui/table';
import { useNavigate } from '@tanstack/react-router';
import { PencilIcon, TrashIcon } from 'lucide-react';
import { Dispatch, SetStateAction } from 'react';
import { useDeleteTemplate } from '../hooks/useDeleteTemplate';
import type { IssueTemplateListItem } from '../types/template.types';
import type { TemplateEditState } from './Templates';

type TemplateItemProps = {
  templates: IssueTemplateListItem[];
  setIsEditTemplate: Dispatch<SetStateAction<TemplateEditState>>;
  setIsOpen: Dispatch<SetStateAction<boolean>>;
  setTemplateState: Dispatch<SetStateAction<'create' | 'edit'>>;
};

export function TemplateItem({
  templates,
  setIsEditTemplate,
  setIsOpen,
  setTemplateState,
}: TemplateItemProps) {
  const navigate = useNavigate();

  const { deleteTemplate } = useDeleteTemplate();

  if (templates.length === 0) {
    return null;
  }

  return (
    <>
      {templates.map((template) => (
        <TableRow
          key={template.id}
          className="group cursor-pointer hover:bg-transparent"
          onClick={() =>
            navigate({
              to: '/settings/templates/$id',
              params: { id: template.id },
              search: {
                name: template.name,
              },
            })
          }
        >
          <TableCell className="whitespace-normal">
            <p className="typo-body-sm text-text-primary">{template.name}</p>
          </TableCell>
          <TableCell className="pr-6 text-right">
            <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100">
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="text-muted-foreground hover:text-foreground"
                aria-label="Template bearbeiten"
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  setIsOpen(true);
                  setTemplateState('edit');
                  setIsEditTemplate({
                    templateId: template.id,
                    name: template.name,
                    description: template.description,
                  });
                }}
              >
                <PencilIcon className="size-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="text-muted-foreground hover:text-destructive"
                aria-label="Template löschen"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  deleteTemplate(template.id);
                }}
              >
                <TrashIcon className="size-4" />
              </Button>
            </div>
          </TableCell>
        </TableRow>
      ))}
    </>
  );
}
