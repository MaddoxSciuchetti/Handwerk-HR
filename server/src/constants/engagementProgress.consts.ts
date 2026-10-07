import type { EngagementProgress } from "@prisma/client";

export const ENGAGEMENT_PROGRESS_LABELS: Record<EngagementProgress, string> = {
    pending: "Ausstehend",
    expected: "Erwartet",
    in_progress: "In Bearbeitung",
    completed: "Abgeschlossen",
    cancelled: "Abgebrochen",
};

export function engagementProgressLabel(
    status: EngagementProgress | string,
): string {
    return (
        ENGAGEMENT_PROGRESS_LABELS[status as EngagementProgress] ?? status
    );
}
