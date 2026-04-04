import TrashWithModal from '@/components/DropDownWithModal';
import { TemplateItemV2 } from '../api/templateV2.api';

type TemplateItemProps = {
  templateItemsByOrder: TemplateItemV2[];
  deleteItem: (id: string) => void;
};

function TemplateItem({ templateItemsByOrder, deleteItem }: TemplateItemProps) {
  return (
    <>
      <div className="rounded-lg border">
        <ul className="divide-y divide-border">
          {templateItemsByOrder.length === 0 ? (
            <li className="px-4 py-8 text-center text-sm text-muted-foreground">
              Noch keine Punkte. Fügen Sie Pseudo-Aufgaben hinzu, die später auf
              Mitarbeitende angewendet werden.
            </li>
          ) : (
            templateItemsByOrder.map((templateItem) => (
              <li
                key={templateItem.id}
                className="group flex items-start justify-between gap-3 px-4 py-3 hover:bg-[var(--secondary)]/50"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground">
                    {templateItem.title}
                  </p>
                  {templateItem.description ? (
                    <p className="mt-1 text-xs text-muted-foreground whitespace-pre-wrap">
                      {templateItem.description}
                    </p>
                  ) : null}
                </div>
                <div className="opacity-0 transition-opacity group-hover:opacity-100">
                  <TrashWithModal
                    description="Punkt aus Vorlage löschen"
                    onConfirm={() => deleteItem(templateItem.id)}
                  />
                </div>
              </li>
            ))
          )}
        </ul>
      </div>
    </>
  );
}

export default TemplateItem;
