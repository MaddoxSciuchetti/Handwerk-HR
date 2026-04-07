import { CircleGaugeIcon, Headset, Truck } from 'lucide-react';
import { Button } from '../button';

export function HandwerkerItem() {
  return (
    <div className="flex items-center py-3border-y border-interactive-ghost-border">
      <div className="flex items-center gap-2 flex-grow">
        <div className="flex items-center gap-2">
          <p>Maddox</p>
          <Button
            className="p-3 text-label-sm h-8 text-interactive-primary-text"
            variant="default"
            size="default"
          >
            Öffnen
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Button
            className="p-3 text-label-sm h-8 text-interactive-primary-text"
            variant="default"
            size="default"
          >
            <CircleGaugeIcon className="w-4 h-4" />
            Austehen
          </Button>
          <Button
            className="p-3 text-label-sm h-8 text-interactive-primary-text"
            variant="default"
            size="default"
          >
            <Truck />
            Onboarding
          </Button>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button
          className="p-3 text-label-sm h-8 text-interactive-primary-text"
          variant="default"
          size="default"
        >
          <Headset />
          Maddox
        </Button>
      </div>
    </div>
  );
}
