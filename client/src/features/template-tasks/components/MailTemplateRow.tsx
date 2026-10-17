import { Button } from '@/components/ui/button';
import { TableCell, TableRow } from '@/components/ui/table';
import { useDeleteMailTemplate } from '@/features/settings/mail-template/useMailTemplates';
import { PencilIcon, TrashIcon } from 'lucide-react';
import type { Dispatch, SetStateAction } from 'react';
import { toast } from 'sonner';
import type { MailTemplateEditState } from './MailTemplateSidebar';

export type MailTemplateRowData = {
  id: string;
  name: string;
  description: string;
  kind: 'system' | 'custom';
  to?: '/settings/welcome-mail' | '/settings/departure-mail';
};

type MailTemplateRowProps = {
  templates: MailTemplateRowData[];
  setIsOpen: Dispatch<SetStateAction<boolean>>;
  setMode: Dispatch<SetStateAction<'create' | 'edit'>>;
  setEditState: Dispatch<SetStateAction<MailTemplateEditState>>;
  onOpen: (template: MailTemplateRowData) => void;
};

export function MailTemplateRow({
  templates,
  setIsOpen,
  setMode,
  setEditState,
  onOpen,
}: MailTemplateRowProps) {
  const { mutate: remove } = useDeleteMailTemplate();

  return (
    <>
      {templates.map((template) => (
        <TableRow
          key={template.id}
          className="group cursor-pointer hover:bg-transparent"
          onClick={() => onOpen(template)}
        >
          <TableCell className="whitespace-normal">
            <p className="typo-body-sm text-text-primary">{template.name}</p>
          </TableCell>
          <TableCell className="whitespace-normal">
            <p className="typo-body-xs text-text-secondary line-clamp-3">
              {template.description}
            </p>
          </TableCell>
          <TableCell className="pr-6 text-right">
            <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100">
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="text-muted-foreground hover:text-foreground"
                aria-label="E-Mail bearbeiten"
                onClick={(event) => {
                  event.stopPropagation();
                  event.preventDefault();
                  if (template.kind === 'system') {
                    onOpen(template);
                    return;
                  }
                  setMode('edit');
                  setEditState({
                    id: template.id,
                    name: template.name,
                    description: template.description,
                  });
                  setIsOpen(true);
                }}
              >
                <PencilIcon className="size-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="text-muted-foreground hover:text-destructive"
                aria-label="E-Mail löschen"
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  if (template.kind === 'system') {
                    toast.error(
                      'Diese E-Mail gehört zur Automatisierung und kann nicht gelöscht werden.'
                    );
                    return;
                  }
                  remove(template.id);
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
