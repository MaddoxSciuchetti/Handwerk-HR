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
    />
  );
}
