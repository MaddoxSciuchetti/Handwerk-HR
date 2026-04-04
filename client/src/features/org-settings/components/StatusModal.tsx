import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { OrgStatusEntityType, OrgStatusRow } from "../api/orgStatus.api";
import { orgStatusMutations } from "../query-options/mutations/orgStatus.mutations";


function StatusModal({
    onClose,
    entityType,
    modalType,
  }: {
    onClose: () => void;
    entityType: OrgStatusEntityType;
    modalType: OrgStatusRow | null;
  }) {
    const [issueName, setIssueName] = useState<string>(modalType?.name ?? '');  
    const { mutate: save, isPending } = useMutation(orgStatusMutations.save());
  
    return (

      <div className="w-full max-w-md rounded-xl border border-border bg-(--card) p-6 shadow-lg">
        <h3 className="text-lg font-semibold text-foreground">
          {modalType ? 'Status bearbeiten' : 'Neuer Status'}
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Änderungen gelten für alle Projekte bzw. Issues, die diesen Status
          verwenden.
        </p>
        <div className="mt-4 space-y-3">
          <div>
            <Label htmlFor="st-name">Name</Label>
            <Input
              id="st-name"
              value={issueName}
              onChange={(e) => setIssueName(e.target.value)}
              className="mt-1"
            />
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Abbrechen
          </Button>
          <Button
            type="button"
            disabled={!issueName.trim() || isPending}
            onClick={() => save({ modalType, issueName, entityType }, {
              onSuccess: () => {
                onClose();
              }
            })}
          >
            Speichern
          </Button>
        </div>
      </div>
    );
  }

  export default StatusModal;