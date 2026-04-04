import queryClient from "@/config/query.client";
import { WORKER_ISSUE_STATUSES, WORKERBYID } from "@/features/task-management/consts/query-key.consts";
import { mutationOptions } from "@tanstack/react-query";
import { toast } from "sonner";
import { createOrgStatus, deleteOrgStatus, OrgStatusEntityType, OrgStatusRow, updateOrgStatus } from "../../api/orgStatus.api";
import { ORG_STATUSES } from "../../consts/query-key.consts";

export const orgStatusMutations = {
    remove: () => mutationOptions<unknown, Error, string>({
        mutationFn: (id: string) => deleteOrgStatus(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [ORG_STATUSES] });
            queryClient.invalidateQueries({ queryKey: [WORKERBYID] });
            queryClient.invalidateQueries({ queryKey: [WORKER_ISSUE_STATUSES] });
            toast.success('Status gelöscht');
        },
        onError: (error) => {
            toast.error(error.message);
        }
    }),
    save: () => mutationOptions<unknown, Error, { modalType: OrgStatusRow | null, issueName: string, entityType: OrgStatusEntityType }>({
        mutationFn: async({ modalType, issueName, entityType }: { modalType: OrgStatusRow | null, issueName: string, entityType: OrgStatusEntityType }) => {
            if (modalType) {
                await updateOrgStatus(modalType.id, {
                    name: issueName,
                });
            } else {
                await createOrgStatus({
                    entityType,
                    name: issueName,
                    color: null,
                });
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [ORG_STATUSES] });
            queryClient.invalidateQueries({ queryKey: [WORKERBYID] });
            queryClient.invalidateQueries({ queryKey: [WORKER_ISSUE_STATUSES] });
            toast.success('Status gespeichert');

        },
        onError: (error) => {
            toast.error(error.message);
        }
    })
}