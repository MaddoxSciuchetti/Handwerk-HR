import type { Microsoft365Automation } from './automation.api';

type Microsoft365AutomationCardProps = {
  automation: Microsoft365Automation;
};

export function Microsoft365AutomationCard({
  automation,
}: Microsoft365AutomationCardProps) {
  return (
    <div className="flex flex-col gap-4 px-3 py-4">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="typo-body-sm text-text-primary">{automation.name}</p>
          <p className="typo-body-xs text-text-secondary">
            {automation.description}
          </p>
        </div>
        <p className="shrink-0 text-sm text-foreground">
          {automation.configured ? 'Bereit' : 'Zugangsdaten fehlen'}
        </p>
      </div>
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
    </div>
  );
}
