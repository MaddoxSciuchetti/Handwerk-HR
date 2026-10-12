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
        <span className="text-sm text-foreground">
          {automation.configured ? 'Bereit' : 'Zugangsdaten fehlen'}
        </span>
      }
    >
      {automation.missing.length > 0 ? (
        <div>
          <p className="text-sm text-muted-foreground">Fehlende Variablen</p>
          <ul className="mt-1 list-disc pl-5 text-sm text-foreground">
            {automation.missing.map((name) => (
              <li key={name}>{name}</li>
            ))}
          </ul>
        </div>
      ) : null}
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
