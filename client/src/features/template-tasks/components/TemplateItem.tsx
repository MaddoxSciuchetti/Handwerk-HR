import { Button } from '@/components/ui/button';
import { Cell, GrowingItem, Items } from '@/features/settings/components/Table';
import { cn } from '@/lib/utils';
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
    <div className="flex w-full min-w-0 flex-col gap-2">
      {templates.map((template) => (
        <Items
          key={template.id}
          state="hover"
          className={cn(
            'group w-full min-w-0 cursor-pointer items-center justify-between gap-6'
          )}
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
          <GrowingItem
            className={cn(
              'min-w-0 flex-1 flex-col items-start gap-1',
              'py-0 pl-0 pr-4'
            )}
          >
            <p className="typo-body-sm text-text-primary">{template.name}</p>
            {template.description ? (
              <p className="typo-body-xs text-text-secondary line-clamp-3">
                {template.description}
              </p>
            ) : null}
          </GrowingItem>
          <Cell
            className={cn(
              'opacity-0 group-hover:opacity-100 w-auto flex gap-2 min-w-0 max-w-[min(100%,14rem)] shrink-0',
              'text-right typo-body-sm font-normal text-text-primary'
            )}
          >
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
          </Cell>
        </Items>
      ))}
    </div>
  );
}
