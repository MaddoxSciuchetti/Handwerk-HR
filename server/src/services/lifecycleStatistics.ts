import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export type LifecycleStatisticsRow = {
    kind: string;
    sampleType: string;
    count: number;
    overdue: number;
    datedCount: number;
    averageMs: number | null;
};

// Aggregate in Postgres instead of transferring every task and engagement to
// Node. Dates use Berlin calendar days, matching the deadline UI.
export function lifecycleStatisticsQuery(
    organizationId: string,
    viewerUserId: string,
    now: Date,
) {
    return Prisma.sql`
        WITH engagement_state AS (
            SELECT e.worker_id, e.type, e.status, e.started_at, e.completed_at, e.end_date,
                   w.status = 'active' AS active_worker,
                   e.status NOT IN ('completed', 'cancelled') AS is_open,
                   ((${now}::timestamptz AT TIME ZONE 'Europe/Berlin')::date > e.end_date) AS is_late
            FROM worker_engagements e
            JOIN workers w ON w.id = e.worker_id
            WHERE w.organization_id = ${organizationId}
        ), worker_state AS (
            SELECT worker_id, bool_or(is_open) AS is_open,
                   bool_or(is_open AND is_late) AS is_late
            FROM engagement_state WHERE active_worker GROUP BY worker_id
        ), scoped_issues AS (
            -- Separate the two ownership paths so Postgres can use the
            -- organization and engagement indexes instead of a cross-table OR.
            SELECT i.* FROM issues i WHERE i.organization_id = ${organizationId}
            UNION ALL
            SELECT i.* FROM issues i
            JOIN worker_engagements scoped ON scoped.id = i.worker_engagement_id
            WHERE scoped.organization_id = ${organizationId}
              AND i.organization_id IS DISTINCT FROM ${organizationId}
        ), issue_state AS (
            SELECT i.status, i.started_at, i.completed_at, i.due_date,
                   i.status NOT IN ('done', 'cancelled', 'not_applicable')
                     AND (i.worker_engagement_id IS NULL OR
                          (w.status = 'active' AND e.status NOT IN ('completed', 'cancelled'))) AS is_open,
                   ((${now}::timestamptz AT TIME ZONE 'Europe/Berlin')::date > i.due_date) AS is_late
            FROM scoped_issues i
            LEFT JOIN worker_engagements e ON e.id = i.worker_engagement_id
            LEFT JOIN workers w ON w.id = e.worker_id
            WHERE (NOT i.assignee_only OR i.assignee_user_id = ${viewerUserId})
              AND i.status NOT IN ('cancelled', 'not_applicable')
        ), samples AS (
            SELECT type::text AS kind, 'completed' AS sample_type,
                   started_at, completed_at AS ended_at, end_date AS deadline
            FROM engagement_state
            WHERE type IN ('onboarding', 'offboarding') AND status = 'completed' AND completed_at IS NOT NULL
            UNION ALL
            SELECT type::text, 'running', started_at, ${now}::timestamptz, end_date
            FROM engagement_state
            WHERE type IN ('onboarding', 'offboarding') AND active_worker AND is_open
            UNION ALL
            SELECT 'taskDuration', 'completed', started_at, completed_at, due_date
            FROM issue_state WHERE status = 'done' AND completed_at IS NOT NULL
            UNION ALL
            SELECT 'taskDuration', 'running', started_at, ${now}::timestamptz, due_date
            FROM issue_state WHERE is_open
        )
        SELECT 'openWorkers' AS kind, 'count' AS "sampleType",
               (count(*) FILTER (WHERE is_open))::int AS count,
               (count(*) FILTER (WHERE is_open AND is_late))::int AS overdue,
               0::int AS "datedCount", NULL::double precision AS "averageMs"
        FROM worker_state
        UNION ALL
        SELECT 'openTasks', 'count', (count(*) FILTER (WHERE is_open))::int,
               (count(*) FILTER (WHERE is_open AND is_late))::int, 0::int, NULL::double precision
        FROM issue_state
        UNION ALL
        SELECT kind, sample_type, (count(*) FILTER (WHERE ended_at >= started_at))::int,
               (count(*) FILTER (WHERE ended_at >= started_at AND (ended_at AT TIME ZONE 'Europe/Berlin')::date > deadline))::int,
               (count(deadline) FILTER (WHERE ended_at >= started_at))::int,
               (avg(extract(epoch FROM (ended_at - started_at)) * 1000) FILTER (WHERE ended_at >= started_at))::double precision
        FROM samples GROUP BY kind, sample_type
    `;
}

export function statisticsFromRows(rows: LifecycleStatisticsRow[]) {
    function count(kind: string) {
        const row = rows.find((row) => row.kind === kind);
        const value = row?.count ?? 0;
        const overdue = row?.overdue ?? 0;
        return {
            value,
            overdue,
            level: overdue ? "orange" : value === 0 ? "green" : "neutral",
        };
    }
    function duration(kind: string) {
        const completed = rows.find(
            (row) =>
                row.kind === kind &&
                row.sampleType === "completed" &&
                row.count > 0,
        );
        const running = rows.find(
            (row) => row.kind === kind && row.sampleType === "running",
        );
        const row = completed ?? running;
        return {
            averageMs: row?.averageMs ?? null,
            count: row?.count ?? 0,
            level: !row?.datedCount
                ? "neutral"
                : row.overdue
                  ? "orange"
                  : "green",
            ...(!completed && running ? { isRunning: true } : {}),
        };
    }
    return {
        openWorkers: count("openWorkers"),
        openTasks: count("openTasks"),
        onboarding: duration("onboarding"),
        offboarding: duration("offboarding"),
        taskDuration: duration("taskDuration"),
    };
}

export async function getLifecycleStatistics(
    organizationId: string,
    viewerUserId: string,
) {
    const rows = await prisma.$queryRaw<LifecycleStatisticsRow[]>(
        lifecycleStatisticsQuery(organizationId, viewerUserId, new Date()),
    );
    return statisticsFromRows(rows);
}
