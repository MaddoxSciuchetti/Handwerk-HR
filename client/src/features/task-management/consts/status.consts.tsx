import { ArrowUpCircle, CheckCircle2, Circle } from 'lucide-react';
export const StatusIcon = ({ status }: { status: string }) => {
  switch (status) {
    case 'erledigt':
      return <CheckCircle2 className="h-4 w-4 text-emerald-600" />;
    case 'in_bearbeitung':
      return <ArrowUpCircle className="h-4 w-4 text-amber-600" />;
    default:
      return <Circle className="h-4 w-4 text-(--status-error-foreground)" />;
  }
};
