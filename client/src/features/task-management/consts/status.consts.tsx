import { ArrowUpCircle, CheckCircle2, Circle } from 'lucide-react';
import { STATUS_MAP, TaskStatus } from '../utils/selectOptionTernary';

export const StatusIcon = ({ status }: { status: TaskStatus }) => {
  switch (status) {
    case 'erledigt':
      return (
        <CheckCircle2
          className={`h-4 w-4 ${STATUS_MAP.erledigt.iconClassName}`}
        />
      );
    case 'in_bearbeitung':
      return (
        <ArrowUpCircle
          className={`h-4 w-4 ${STATUS_MAP.in_bearbeitung.iconClassName}`}
        />
      );
    case 'offen':
      return <Circle className={`h-4 w-4 ${STATUS_MAP.offen.iconClassName}`} />;
    default:
      return <Circle className={`h-4 w-4 ${STATUS_MAP.offen.iconClassName}`} />;
  }
};
