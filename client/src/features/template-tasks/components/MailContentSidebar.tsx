import LoadingAlert from '@/components/alerts/LoadingAlert';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { DepartureMailForm } from '@/features/settings/departure-mail/DepartureMailForm';
import { useDepartureMail } from '@/features/settings/departure-mail/useDepartureMail';
import { MailTemplateForm } from '@/features/settings/mail-template/MailTemplateForm';
import { useMailTemplate } from '@/features/settings/mail-template/useMailTemplates';
import { WelcomeMailForm } from '@/features/settings/welcome-mail/WelcomeMailForm';
import { useWelcomeMail } from '@/features/settings/welcome-mail/useWelcomeMail';
import { SidebarAside } from '@/features/worker-task-management/components/tasks/task-sidebar/SidebarAside';
import SidebarContent from '@/features/worker-task-management/components/tasks/task-sidebar/SidebarContent';
import SidebarHeader from '@/features/worker-task-management/components/tasks/task-sidebar/SidebarHeader';
import { SidebarPanel } from '@/features/worker-task-management/components/tasks/task-sidebar/SidebarPanel';
import { X } from 'lucide-react';
import type { Dispatch, SetStateAction } from 'react';
import type { MailTemplateRowData } from './MailTemplateRow';

type MailContentSidebarProps = {
  isOpen: boolean;
  setIsOpen: Dispatch<SetStateAction<boolean>>;
  mail: MailTemplateRowData | null;
};

export function MailContentSidebar({
  isOpen,
  setIsOpen,
  mail,
}: MailContentSidebarProps) {
  return (
    <SidebarAside className="p-2" isOpen={isOpen} onClose={() => setIsOpen(false)}>
      <SidebarPanel className="w-full">
        <SidebarHeader className="flex items-center justify-between p-6">
          <Label className="typo-body-lg font-bold">
            {mail?.name ?? 'E-Mail'}
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
        <SidebarContent className="p-4">
          {mail?.kind === 'system' && mail.to === '/settings/welcome-mail' ? (
            <WelcomeMailEditor />
          ) : null}
          {mail?.kind === 'system' && mail.to === '/settings/departure-mail' ? (
            <DepartureMailEditor />
          ) : null}
          {mail?.kind === 'custom' ? (
            <CustomMailEditor templateId={mail.id} />
          ) : null}
        </SidebarContent>
      </SidebarPanel>
    </SidebarAside>
  );
}

function WelcomeMailEditor() {
  const { data, isLoading, isError } = useWelcomeMail();

  if (isLoading) {
    return <LoadingAlert />;
  }

  if (isError || !data) {
    return (
      <p className="text-sm text-destructive">
        Willkommensmail konnte nicht geladen werden.
      </p>
    );
  }

  return <WelcomeMailForm page={data} />;
}

function DepartureMailEditor() {
  const { data, isLoading, isError } = useDepartureMail();

  if (isLoading) {
    return <LoadingAlert />;
  }

  if (isError || !data) {
    return (
      <p className="text-sm text-destructive">
        Die Entlassungsmail konnte nicht geladen werden.
      </p>
    );
  }

  return <DepartureMailForm page={data} />;
}

function CustomMailEditor({ templateId }: { templateId: string }) {
  const { data, isLoading, isError } = useMailTemplate(templateId);

  if (isLoading) {
    return <LoadingAlert />;
  }

  if (isError || !data) {
    return (
      <p className="text-sm text-destructive">
        Die E-Mail konnte nicht geladen werden.
      </p>
    );
  }

  return <MailTemplateForm templateId={templateId} page={data} />;
}
