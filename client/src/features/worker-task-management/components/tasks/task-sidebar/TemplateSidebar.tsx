import FormFields from '@/components/form/FormFields';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import type { TemplateEditState } from '@/features/template-tasks/components/Templates';
import {
  type TemplateSubmission,
  useSubmitTemplate,
} from '@/features/template-tasks/hooks/useSubmitTemplate';
import { Check, X } from 'lucide-react';
import type { Dispatch, SetStateAction } from 'react';
import { SidebarAside } from './SidebarAside';
import SidebarContent from './SidebarContent';
import SidebarFooter from './SidebarFooter';
import SidebarHeader from './SidebarHeader';
import { SidebarPanel } from './SidebarPanel';

type TemplateSidebarProps = {
  isOpen: boolean;
  setIsOpen: Dispatch<SetStateAction<boolean>>;
  templateEditState: TemplateEditState;
  templateState: 'create' | 'edit';
};

const EMPTY_SUBMISSION: TemplateSubmission = {
  name: '',
  description: null,
};

export function TemplateSidebar({
  isOpen,
  setIsOpen,
  templateEditState,
  templateState,
}: TemplateSidebarProps) {
  const { register, onSubmit, errors } = useSubmitTemplate(
    templateState,
    templateEditState.templateId,
    templateEditState
  );
  return (
    <SidebarAside className="p-2" isOpen={isOpen}>
      <SidebarPanel className="w-full">
        <SidebarHeader className="flex items-center justify-between p-6">
          <Label className="typo-body-lg font-bold">
            {templateState === 'create'
              ? 'Template erstellen'
              : 'Template bearbeiten'}
          </Label>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="Schließen"
            className="rounded-full"
            onClick={() => setIsOpen(false)}
          >
            <X className="h-4 w-4" aria-hidden />
          </Button>
        </SidebarHeader>
        <form
          onSubmit={onSubmit}
          className={cn('flex min-h-0 flex-1 flex-col')}
        >
          <SidebarContent className="mt-2 flex flex-col gap-4 p-6">
            <FormFields
              errors={errors}
              register={register}
              name="name"
              label="Name des Templates"
              labelClassName="typo-body-base"
            />
            <FormFields
              errors={errors}
              register={register}
              name="description"
              label="Beschreibung des Templates"
              labelClassName="typo-body-base"
            />
          </SidebarContent>
          <SidebarFooter className="p-6">
            <Button type="submit" className="rounded-full">
              <Check className="h-4 w-4" aria-hidden /> Speichern
            </Button>
          </SidebarFooter>
        </form>
      </SidebarPanel>
    </SidebarAside>
  );
}
