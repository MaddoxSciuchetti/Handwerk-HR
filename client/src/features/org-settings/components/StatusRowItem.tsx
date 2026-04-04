import { Button } from "@/components/ui/button";
import { Pencil, Trash2 } from "lucide-react";
import { OrgStatusEntityType, OrgStatusRow } from "../api/orgStatus.api";
import { usageLine } from "../utils/usageLine";

export function StatusRowItem({ row,entityType, setModal, canDelete, statuses, remove }: { row: OrgStatusRow, entityType: OrgStatusEntityType, setModal: (row: OrgStatusRow) => void, canDelete: boolean, statuses: OrgStatusRow[], remove: (id: string) => void }) {
    
    return (
        <li
        key={row.id}
        className="flex items-center gap-3 px-4 py-3.5"
      >
        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-border bg-muted" />
        <div className="min-w-0 flex-1">
          <p className="font-medium text-foreground">{row.name}</p>
          {row.usageCount > 0 ? (
            <p className="text-xs text-(--destructive)">
              {usageLine(entityType, row.usageCount)}
            </p>
          ) : null}
        </div>
        <div className="flex shrink-0 gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-9 rounded-lg"
            onClick={() => setModal(row)}
            aria-label="Bearbeiten"
          >
            <Pencil className="size-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-9 rounded-lg text-destructive hover:text-destructive"
            disabled={!canDelete}
            title={
              statuses.length <= 1
                ? 'Der letzte Status kann nicht gelöscht werden'
                : row.usageCount > 0
                  ? 'Zuerst alle Zuordnungen entfernen'
                  : 'Löschen'
            }
            onClick={() => remove(row.id)}
            aria-label="Löschen"
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      </li>
    );
  }