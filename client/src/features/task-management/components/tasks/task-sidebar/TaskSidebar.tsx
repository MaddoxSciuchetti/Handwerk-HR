import FormFields from '@/components/form/FormFields';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/selfmade/button';
import { FormWrapper } from '@/components/ui/selfmade/form-wrapper';
import { useSubmitTemplate } from '@/features/template-tasks/hooks/useSubmitTemplate';
import { Check, X } from 'lucide-react';
import type { Dispatch, ReactNode, SetStateAction } from 'react';
import { SidebarAside } from './SidebarAside';
import SidebarContent from './SidebarContent';
import SidebarFooter from './SidebarFooter';
import SidebarHeader from './SidebarHeader';
import { SidebarPanel } from './SidebarPanel';

type TemplateSidebarProps = {
  isOpen: boolean;
  children?: ReactNode;
  setIsOpen: Dispatch<SetStateAction<boolean>>;
};

function TemplateSidebar({
  isOpen,
  children,
  setIsOpen,
}: TemplateSidebarProps) {
  const { register, handleSubmit, onSubmit, errors } = useSubmitTemplate();
  return (
    <>
      {isOpen ? (
        <div
          className="fixed inset-0 z-40 bg-black/25 dark:bg-black/40"
          aria-hidden
          onClick={() => setIsOpen(false)}
        />
      ) : null}
      <SidebarAside isOpen={isOpen}>
        <SidebarPanel>
          <SidebarHeader className="flex items-center justify-between py-3">
            <Label>Erstelle dein Template</Label>
            <Button type="button" onClick={() => setIsOpen(false)}>
              <X className="h-4 w-4" aria-hidden />
            </Button>
          </SidebarHeader>
          <FormWrapper onSubmit={onSubmit}>
            <SidebarContent>
              <FormFields
                errors={errors}
                register={register}
                name="search"
                label="Name des Templates"
              />
            </SidebarContent>
            <SidebarFooter>
              <Button type="submit">
                <Check className="h-4 w-4" aria-hidden /> Speichern
              </Button>
            </SidebarFooter>
          </FormWrapper>
        </SidebarPanel>
      </SidebarAside>
    </>
  );
}

export default TemplateSidebar;
