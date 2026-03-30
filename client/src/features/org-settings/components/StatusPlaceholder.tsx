import OrgUsersOverview from '@/features/employee-overview/components/OrgUsersOverview';
import { EmployeeModalProvider } from '@/features/employee-overview/context/ModalProvider';
import type { OrgSettingsTabId } from '@/features/org-settings/consts/org-settings-tabs';
import TemplateTasks from '@/features/template-tasks/components/TemplateTask';
import { OrgInviteSection } from './OrgInviteSection';

function StatusPlaceholder({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <h2 className="text-lg font-medium text-foreground">{title}</h2>
      <p className="mt-2 text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

type OrgSettingsProps = {
  tab: OrgSettingsTabId;
};

const OrgSettings = ({ tab }: OrgSettingsProps) => {
  return (
    <div className="mx-auto flex h-[calc(100dvh-6rem)] max-w-[min(100%,90rem)] flex-col gap-4 px-4 py-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">
          Unternehmens Einstellungen
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Mitarbeiter, Vorlagen und Status-Konfiguration.
        </p>
      </div>

      <div className="min-h-0 min-w-0 flex-1 overflow-auto">
        {tab === 'employees' && (
          <EmployeeModalProvider>
            <div className="flex flex-col gap-8">
              <OrgInviteSection />
              <OrgUsersOverview />
            </div>
          </EmployeeModalProvider>
        )}
        {tab === 'templates' && <TemplateTasks />}
        {tab === 'project-status' && (
          <StatusPlaceholder
            title="Status für Projekte"
            description="Hier legen Sie die Status für normale Projekte fest. Die Bearbeitung wird in einer späteren Version ergänzt."
          />
        )}
        {tab === 'issue-status' && (
          <StatusPlaceholder
            title="Status für Issues"
            description="Hier legen Sie die Status für Issues fest. Die Bearbeitung wird in einer späteren Version ergänzt."
          />
        )}
      </div>
    </div>
  );
};

export default OrgSettings;
