import { Cell, GrowingItem, Items } from '@/components/ui/selfmade/table/Table';
import { cn } from '@/lib/trycatch';
import type { IssueTemplateListItem } from '../types/template.types';

type TemplateItemProps = {
  templates: IssueTemplateListItem[];
};

export function TemplateItem({ templates }: TemplateItemProps) {
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
            'w-full min-w-0 items-center justify-between gap-6',
            'px-6 py-4'
          )}
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
              '!w-auto min-w-0 max-w-[min(100%,14rem)] shrink-0',
              'text-right typo-body-sm font-normal text-text-primary'
            )}
          >
            {template.createdBy.firstName} {template.createdBy.lastName}
          </Cell>
        </Items>
      ))}
    </div>
  );
}
