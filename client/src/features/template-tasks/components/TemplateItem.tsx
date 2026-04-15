import { Cell, GrowingItem, Items } from '@/components/ui/selfmade/table/Table';
import { cn } from '@/lib/trycatch';
import { useNavigate } from '@tanstack/react-router';
import { PencilIcon, TrashIcon } from 'lucide-react';
import { Dispatch, SetStateAction } from 'react';
import { useDeleteTemplate } from '../hooks/useDeleteTemplate';
import type { IssueTemplateListItem } from '../types/template.types';
import type { TemplateEditState } from './TemplateTask';

type TemplateItemProps = {
  templates: IssueTemplateListItem[];
  setIsEditTemplate: Dispatch<SetStateAction<TemplateEditState>>;
  setIsOpen: Dispatch<SetStateAction<boolean>>;
  templateState: 'create' | 'edit';
  setTemplateState: Dispatch<SetStateAction<'create' | 'edit'>>;
};

export function TemplateItem({
  templates,
  setIsEditTemplate,
  setIsOpen,
  templateState,
  setTemplateState,
}: TemplateItemProps) {
  const navigate = useNavigate();

  const { deleteTemplate } = useDeleteTemplate();

  if (templates.length === 0) {
    return null;
  }

  return (
    <div className="flex w-full min-w-0 flex-col divide-y divide-border-subtle">
      {templates.map((template) => (
        <Items
          key={template.id}
          state="hover"
          className={cn(
            'group w-full min-w-0 cursor-pointer items-center justify-between gap-6',
            'px-6 py-4'
          )}
          onClick={() =>
            navigate({
              to: '/settings/templates/$id',
              params: { id: template.id },
              search: {
                templateName: template.templateName,
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
            <p className="typo-body-sm text-text-primary">
              {template.templateName}
            </p>
            {template.templateDescription ? (
              <p className="typo-body-xs text-text-secondary line-clamp-3">
                {template.templateDescription}
              </p>
            ) : null}
          </GrowingItem>
          <Cell
            className={cn(
              'opacity-0 group-hover:opacity-100 w-auto flex gap-5 min-w-0 max-w-[min(100%,14rem)] shrink-0',
              'text-right typo-body-sm font-normal text-text-primary'
            )}
          >
            <PencilIcon
              className="w-4 h-4"
              onClick={(e) => {
                e.stopPropagation();
                setIsOpen(true);
                setTemplateState('edit');
                setIsEditTemplate({
                  templateId: template.id,
                  templateName: template.templateName,
                  templateDescription: template.templateDescription,
                  templateType: template.type,
                });
              }}
            />
            <TrashIcon
              className="w-4 h-4"
              onClick={(e) => {
                e.stopPropagation();
                deleteTemplate(template.id);
              }}
            />
          </Cell>
        </Items>
      ))}
    </div>
  );
}
