import { Link } from '@tanstack/react-router';
import type { IssueTemplateListItem } from '../api/templateV2.api';

type TemplateListProps = {
  paginatedTemplates: IssueTemplateListItem[];
};

function descriptionSnippet(description: string | null, maxLength = 110) {
  if (!description) return '';
  const trimmed = description.trim();
  if (trimmed.length <= maxLength) return trimmed;
  return `${trimmed.slice(0, maxLength)}…`;
}

const TemplateList = ({ paginatedTemplates }: TemplateListProps) => {
  return (
    <ul className="mt-2 divide-y divide-border rounded-xl border border-border">
      {paginatedTemplates.length === 0 ? (
        <li className="px-4 py-6 text-center text-sm text-muted-foreground">
          Keine Vorlagen gefunden.
        </li>
      ) : (
        paginatedTemplates.map((issueTemplate) => (
          <li key={issueTemplate.id}>
            <Link
              to="/template/$templateId"
              params={{ templateId: issueTemplate.id }}
              className="group flex cursor-pointer items-start justify-between gap-3 px-4 py-2.5 transition-colors hover:bg-[var(--secondary)]"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">
                  {issueTemplate.name}
                </p>
                {issueTemplate.description ? (
                  <p className="mt-1 line-clamp-2 text-xs leading-snug text-muted-foreground">
                    {descriptionSnippet(issueTemplate.description)}
                  </p>
                ) : null}
              </div>
              <span className="shrink-0 rounded-md bg-[var(--muted)] px-2 py-0.5 text-xs font-medium tabular-nums text-muted-foreground">
                {issueTemplate._count.items}{' '}
                {issueTemplate._count.items === 1 ? 'Punkt' : 'Punkte'}
              </span>
            </Link>
          </li>
        ))
      )}
    </ul>
  );
};

export default TemplateList;
