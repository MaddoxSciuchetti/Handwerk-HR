import LoadingAlert from '@/components/alerts/LoadingAlert';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { SettingsPageHeader } from '@/features/settings/components/SettingsPageHeader';
import { useNavigate } from '@tanstack/react-router';
import { ArrowLeft } from 'lucide-react';
import { MailTemplateForm } from './MailTemplateForm';
import { useMailTemplate } from './useMailTemplates';

type MailTemplatePageProps = {
  templateId: string;
};

export function MailTemplatePage({ templateId }: MailTemplatePageProps) {
  const navigate = useNavigate();
  const { data, isLoading, isError } = useMailTemplate(templateId);

  if (isLoading) {
    return <LoadingAlert />;
  }

  return (
    <div className="mx-auto flex h-full min-h-0 flex-col overflow-hidden rounded-2xl bg-card p-6 text-card-foreground md:max-w-8xl">
      <div className="flex h-full min-h-0 w-full flex-col items-center">
        <SettingsPageHeader
          action={
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="rounded-full"
              aria-label="Zurück"
              onClick={() => navigate({ to: '/settings/templates/template' })}
            >
              <ArrowLeft className="size-5" />
            </Button>
          }
          title={data?.template.name ?? 'E-Mail'}
        />
        <Card className="mt-5 flex min-h-0 w-full flex-1 flex-col gap-0 overflow-auto border border-border py-0 shadow-none ring-0">
          <CardContent className="p-6">
            {isError || !data ? (
              <p className="text-sm text-destructive">
                Die E-Mail konnte nicht geladen werden.
              </p>
            ) : (
              <MailTemplateForm templateId={templateId} page={data} />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
