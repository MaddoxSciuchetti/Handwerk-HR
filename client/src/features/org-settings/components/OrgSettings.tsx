import OrgUsersOverview from '@/features/employee-overview/components/OrgUsersOverview';
import { EmployeeModalProvider } from '@/features/employee-overview/context/ModalProvider';
import type { OrgSettingsTabId } from '@/features/org-settings/consts/org-settings-tabs';
import TemplateTasks from '@/features/template-tasks/components/TemplateTask';
import { EntityStatusSettings } from './EntityStatusSettings';
import { OrgInviteSection } from './OrgInviteSection';

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
          <EntityStatusSettings
            entityType="engagement"
            title="Projekt-Status"
            description="Status definieren den Ablauf Ihrer Worker-Engagements (z. B. Onboarding). Namen- und Farbänderungen wirken überall sofort; ein Status kann nur gelöscht werden, wenn er nirgends mehr verwendet wird und nicht der letzte verbleibende Status ist."
          />
        )}
        {tab === 'issue-status' && (
          <EntityStatusSettings
            entityType="issue"
            title="Issue-Status"
            description="Status für Aufgaben innerhalb eines Engagements. Änderungen gelten für alle Issues; Löschen nur ohne Zuordnungen und nur solange mindestens ein weiterer Status existiert."
          />
        )}
      </div>
    </div>
  );
};

export default OrgSettings;
