import type { IssueStatus } from "@prisma/client";

export const ISSUE_STATUS_LABELS: Record<IssueStatus, string> = {
    error: "Fehler",
    open: "Offen",
    in_progress: "In Bearbeitung",
    done: "Erledigt",
    cancelled: "Abgebrochen",
    not_applicable: "Nicht zutreffend",
};

export function issueStatusLabel(status: IssueStatus | string): string {
    return ISSUE_STATUS_LABELS[status as IssueStatus] ?? status;
}
