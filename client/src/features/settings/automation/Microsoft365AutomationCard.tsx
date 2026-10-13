import type { Microsoft365Automation } from './automation.api';
import { AutomationOverviewCard } from './AutomationOverviewCard';

type Microsoft365AutomationCardProps = {
  automation: Microsoft365Automation;
};

export function Microsoft365AutomationCard({
  automation,
}: Microsoft365AutomationCardProps) {
  return (
    <AutomationOverviewCard
      name={automation.name}
      description={automation.description}
      status={
        <span
          className={
            automation.configured
              ? 'text-sm text-foreground'
              : 'text-sm text-muted-foreground'
          }
        >
          {automation.configured ? 'Bereit' : 'Nicht eingerichtet'}
        </span>
      }
    >
      {automation.configured ? null : (
        <p className="text-sm text-muted-foreground">
          Microsoft 365 ist in dieser Umgebung nicht eingerichtet.
        </p>
      )}
      <div>
        <p className="text-sm text-muted-foreground">
          Erforderliche Anwendungsrechte
        </p>
        <ul className="mt-1 list-disc pl-5 text-sm text-foreground">
          {automation.permissions.map((permission) => (
            <li key={permission}>{permission}</li>
          ))}
        </ul>
      </div>
    </AutomationOverviewCard>
  );
}
