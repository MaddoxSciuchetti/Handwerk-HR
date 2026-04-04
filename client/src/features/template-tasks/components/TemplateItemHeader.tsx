import { Button } from '@/components/ui/button';
import { Link } from '@tanstack/react-router';
import { IssueTemplateDetail } from '../api/templateV2.api';

type TemplateItemHeaderProps = {
  setAddOpen: (value: boolean) => void;
  data: IssueTemplateDetail;
};

function TemplateItemHeader({ setAddOpen, data }: TemplateItemHeaderProps) {
  return (
    <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
      <div className="min-w-0">
        <Button variant="ghost" size="sm" className="mb-2 -ml-2" asChild>
          <Link to="/org-settings" search={{ currentTab: 'templates' }}>
            ← Zurück zu Vorlagen
          </Link>
        </Button>
        <h1 className="text-xl font-semibold text-foreground">{data.name}</h1>
        {data.description ? (
          <p className="mt-1 text-sm text-muted-foreground whitespace-pre-wrap">
            {data.description}
          </p>
        ) : null}
      </div>
      <Button type="button" onClick={() => setAddOpen(true)}>
        Punkt hinzufügen
      </Button>
    </div>
  );
}

export default TemplateItemHeader;
