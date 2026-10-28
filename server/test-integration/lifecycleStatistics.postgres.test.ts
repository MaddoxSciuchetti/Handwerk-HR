import { Client } from "pg";
import {
    lifecycleStatisticsQuery,
    statisticsFromRows,
} from "@/services/lifecycleStatistics";
import { summarizeLifecycleStatistics } from "@/utils/lifecycleStatistics";

jest.mock("@/lib/prisma", () => ({ prisma: {} }));
const suite = process.env.TEST_DATABASE_URL ? describe : describe.skip;

suite("Postgres lifecycle aggregates match the original calculation", () => {
    let client: Client;
    const start = new Date("2026-10-23T10:00:00Z");
    const deadline = new Date("2026-10-24T00:00:00Z");
    const completed = new Date("2026-10-24T23:30:00Z"); // Next day in Berlin.
    const workers = [
        {
            id: "active",
            status: "active",
            engagements: [
                {
                    id: "running",
                    type: "onboarding",
                    status: "in_progress",
                    startedAt: start,
                    completedAt: null,
                    endDate: deadline,
                    createdAt: start,
                },
                {
                    id: "done",
                    type: "offboarding",
                    status: "completed",
                    startedAt: start,
                    completedAt: completed,
                    endDate: deadline,
                    createdAt: start,
                },
            ],
        },
        {
            id: "inactive",
            status: "inactive",
            engagements: [
                {
                    id: "archived",
                    type: "onboarding",
                    status: "in_progress",
                    startedAt: start,
                    completedAt: null,
                    endDate: null,
                    createdAt: start,
                },
            ],
        },
    ];
    const issues = [
        {
            id: "task",
            engagementId: "running",
            status: "open",
            assigneeOnly: false,
            assigneeUserId: null,
        },
        {
            id: "done-task",
            engagementId: "done",
            status: "done",
            assigneeOnly: false,
            assigneeUserId: null,
        },
        {
            id: "private-mine",
            engagementId: null,
            status: "open",
            assigneeOnly: true,
            assigneeUserId: "viewer",
        },
        {
            id: "private-other",
            engagementId: null,
            status: "open",
            assigneeOnly: true,
            assigneeUserId: "other",
        },
        {
            id: "cancelled",
            engagementId: "running",
            status: "cancelled",
            assigneeOnly: false,
            assigneeUserId: null,
        },
        {
            id: "not-applicable",
            engagementId: "running",
            status: "not_applicable",
            assigneeOnly: false,
            assigneeUserId: null,
        },
        {
            id: "archived-task",
            engagementId: "archived",
            status: "open",
            assigneeOnly: false,
            assigneeUserId: null,
        },
    ];
    beforeAll(async () => {
        client = new Client({
            connectionString: process.env.TEST_DATABASE_URL,
        });
        await client.connect();
        // Temporary tables shadow real names on this connection only.
        await client.query(`CREATE TEMP TABLE workers (id text PRIMARY KEY, organization_id text, status text);
            CREATE TEMP TABLE worker_engagements (id text PRIMARY KEY, worker_id text REFERENCES workers(id) ON DELETE CASCADE, organization_id text, type text, status text, started_at timestamptz, completed_at timestamptz, end_date date);
            CREATE TEMP TABLE issues (id text, worker_engagement_id text REFERENCES worker_engagements(id) ON DELETE CASCADE, organization_id text, assignee_only boolean, assignee_user_id text, status text, started_at timestamptz, completed_at timestamptz, due_date date);`);
        for (const worker of workers) {
            await client.query("INSERT INTO workers VALUES ($1, $2, $3)", [
                worker.id,
                "org",
                worker.status,
            ]);
            for (const e of worker.engagements)
                await client.query(
                    "INSERT INTO worker_engagements VALUES ($1,$2,$3,$4,$5,$6,$7,$8)",
                    [
                        e.id,
                        worker.id,
                        "org",
                        e.type,
                        e.status,
                        e.startedAt,
                        e.completedAt,
                        e.endDate,
                    ],
                );
        }
        for (const i of issues)
            await client.query(
                "INSERT INTO issues VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)",
                [
                    i.id,
                    i.engagementId,
                    i.engagementId && i.id !== "done-task" ? null : "org",
                    i.assigneeOnly,
                    i.assigneeUserId,
                    i.status,
                    start,
                    i.status === "done" ? completed : null,
                    deadline,
                ],
            );
        await client.query(
            "INSERT INTO workers VALUES ('foreign', 'other-org', 'active'); INSERT INTO worker_engagements VALUES ('foreign-engagement', 'foreign', 'other-org', 'offboarding', 'in_progress', now(), NULL, NULL); INSERT INTO issues VALUES ('foreign-task', 'foreign-engagement', NULL, false, NULL, 'open', now(), NULL, NULL)",
        );
    });
    afterAll(async () => {
        await client?.end();
    });
    it.each([
        "2026-10-24T21:59:00Z",
        "2026-10-24T22:01:00Z",
        "2026-10-26T12:00:00Z",
    ])(
        "preserves visibility, archived workers, durations and Berlin deadlines at %s",
        async (timestamp) => {
            const now = new Date(timestamp);
            const query = lifecycleStatisticsQuery("org", "viewer", now);
            const result = await client.query(query.text, query.values);
            const visible = issues
                .filter((i) => !i.assigneeOnly || i.assigneeUserId === "viewer")
                .map((i) => {
                    const worker = workers.find((w) =>
                        w.engagements.some((e) => e.id === i.engagementId),
                    );
                    const engagement = worker?.engagements.find(
                        (e) => e.id === i.engagementId,
                    );
                    return {
                        ...i,
                        startedAt: start,
                        completedAt: i.status === "done" ? completed : null,
                        dueDate: deadline,
                        createdAt: start,
                        workerEngagement:
                            engagement && worker
                                ? {
                                      status: engagement.status,
                                      worker: { status: worker.status },
                                  }
                                : null,
                    };
                });
            expect(statisticsFromRows(result.rows)).toEqual(
                summarizeLifecycleStatistics(workers, visible, now),
            );
        },
    );
    it("returns empty statistics for another organization", async () => {
        const query = lifecycleStatisticsQuery("empty", "viewer", new Date());
        const result = await client.query(query.text, query.values);
        expect(statisticsFromRows(result.rows)).toEqual(
            summarizeLifecycleStatistics([], []),
        );
    });
    it("keeps the statistics response bounded with ten thousand tasks", async () => {
        const query = lifecycleStatisticsQuery(
            "org",
            "viewer",
            new Date("2026-10-26T12:00:00Z"),
        );
        const before = statisticsFromRows(
            (await client.query(query.text, query.values)).rows,
        );
        await client.query("BEGIN");
        try {
            await client.query(`INSERT INTO issues
                SELECT 'load-' || n, 'running', NULL, false, NULL, 'open',
                       '2026-10-23T10:00:00Z'::timestamptz, NULL, NULL
                FROM generate_series(1, 10000) n`);
            const result = await client.query(query.text, query.values);
            expect(result.rows.length).toBeLessThanOrEqual(8);
            expect(statisticsFromRows(result.rows).openTasks.value).toBe(
                before.openTasks.value + 10000,
            );
        } finally {
            await client.query("ROLLBACK");
        }
    });
    it("cascades bulk worker deletion to engagements and tasks", async () => {
        await client.query(
            "DELETE FROM workers WHERE id = ANY($1) AND organization_id = $2",
            [["active", "inactive"], "org"],
        );
        const result = await client.query(
            "SELECT count(*)::int AS count FROM issues WHERE worker_engagement_id IN ('running','done','archived')",
        );
        expect(result.rows[0].count).toBe(0);
        const foreign = await client.query(
            "SELECT id FROM workers WHERE organization_id = 'other-org'",
        );
        expect(foreign.rowCount).toBe(1);
    });
});
