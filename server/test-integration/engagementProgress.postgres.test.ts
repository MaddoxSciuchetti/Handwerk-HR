import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { randomUUID } from "node:crypto";
import { Client } from "pg";

const suite = process.env.TEST_DATABASE_URL ? describe : describe.skip;
const migration = readFileSync(resolve(__dirname,
    "../src/prisma/migrations/20261028200000_task_driven_engagement_completion/migration.sql"), "utf8");

suite("task-driven engagement progress in PostgreSQL", () => {
    let client: Client;
    beforeAll(async () => {
        client = new Client({ connectionString: process.env.TEST_DATABASE_URL });
        await client.connect();
    });
    beforeEach(async () => {
        // All objects and fixtures live in a disposable, rolled-back schema.
        await client.query("BEGIN");
        const schema = `progress_${randomUUID().replaceAll("-", "")}`;
        await client.query(`CREATE SCHEMA "${schema}"`);
        await client.query(`SET LOCAL search_path TO "${schema}"`);
        await client.query(`
            CREATE TYPE "EngagementProgress" AS ENUM ('expected', 'pending', 'in_progress', 'completed', 'cancelled');
            CREATE TABLE worker_engagements (
                id text PRIMARY KEY, type text DEFAULT 'onboarding',
                status "EngagementProgress" DEFAULT 'pending',
                completed_at timestamptz, updated_at timestamptz DEFAULT now()
            );
            CREATE TABLE issues (
                id text PRIMARY KEY, worker_engagement_id text REFERENCES worker_engagements(id) ON DELETE CASCADE,
                status text DEFAULT 'open'
            );
            INSERT INTO worker_engagements (id, status) VALUES
                ('legacy-done', 'expected'), ('legacy-open', 'expected'), ('legacy-empty', 'expected');
            INSERT INTO issues VALUES ('legacy-done-task', 'legacy-done', 'done'),
                ('legacy-open-task', 'legacy-open', 'open');
        `);
        await client.query(migration);
    });
    afterEach(async () => { await client.query("ROLLBACK"); });
    afterAll(async () => { await client?.end(); });

    async function engagement(id = "e") {
        const { rows } = await client.query("SELECT status, completed_at FROM worker_engagements WHERE id = $1", [id]);
        return rows[0];
    }
    async function create(type = "onboarding", status = "pending") {
        await client.query("INSERT INTO worker_engagements (id, type, status) VALUES ('e', $1, $2)", [type, status]);
    }

    it("backfills legacy records from tasks without requiring a returned contract", async () => {
        expect(await engagement("legacy-done")).toEqual({ status: "completed", completed_at: expect.any(Date) });
        expect((await engagement("legacy-open")).status).toBe("pending");
        expect((await engagement("legacy-empty")).status).toBe("pending");
    });
    it.each(["onboarding", "offboarding"])("completes %s when its final task closes", async (type) => {
        await create(type);
        await client.query("INSERT INTO issues VALUES ('a', 'e', 'done'), ('b', 'e', 'open')");
        expect((await engagement()).status).toBe("pending");
        await client.query("UPDATE issues SET status = 'done' WHERE id = 'b'");
        expect(await engagement()).toEqual({ status: "completed", completed_at: expect.any(Date) });
    });
    it.each(["cancelled", "not_applicable"])("counts %s tasks as closed", async (status) => {
        await create();
        await client.query("INSERT INTO issues VALUES ('a', 'e', $1)", [status]);
        expect((await engagement()).status).toBe("completed");
    });
    it("does not complete empty engagements or engagements with errors", async () => {
        await create();
        expect((await engagement()).status).toBe("pending");
        await client.query("INSERT INTO issues VALUES ('a', 'e', 'error')");
        expect((await engagement()).status).toBe("pending");
    });
    it("reopens completed work and clears its completion date", async () => {
        await create();
        await client.query("INSERT INTO issues VALUES ('a', 'e', 'done')");
        await client.query("UPDATE issues SET status = 'in_progress' WHERE id = 'a'");
        expect(await engagement()).toEqual({ status: "in_progress", completed_at: null });
    });
    it("reopens when a new task is added and handles bulk completion", async () => {
        await create();
        await client.query("INSERT INTO issues VALUES ('a', 'e', 'done')");
        await client.query("INSERT INTO issues VALUES ('b', 'e', 'open'), ('c', 'e', 'error')");
        expect((await engagement()).status).toBe("in_progress");
        await client.query("UPDATE issues SET status = 'done' WHERE worker_engagement_id = 'e'");
        expect((await engagement()).status).toBe("completed");
    });
    it("reconciles both parents when moving a task", async () => {
        await create();
        await client.query("INSERT INTO issues VALUES ('a', 'e', 'done'), ('b', 'e', 'open')");
        await client.query("UPDATE issues SET worker_engagement_id = 'legacy-done' WHERE id = 'b'");
        expect((await engagement()).status).toBe("completed");
        expect((await engagement("legacy-done")).status).toBe("in_progress");
    });
    it("reconciles task deletion and leaves no-task records pending", async () => {
        await create();
        await client.query("INSERT INTO issues VALUES ('a', 'e', 'done'), ('b', 'e', 'open')");
        await client.query("DELETE FROM issues WHERE id = 'b'");
        expect((await engagement()).status).toBe("completed");
        await client.query("DELETE FROM issues WHERE id = 'a'");
        expect(await engagement()).toEqual({ status: "pending", completed_at: null });
    });
    it("preserves cancelled engagements and team records", async () => {
        await create("onboarding", "cancelled");
        await client.query("INSERT INTO issues VALUES ('a', 'e', 'done')");
        expect((await engagement()).status).toBe("cancelled");
        await client.query("INSERT INTO worker_engagements (id, type, status) VALUES ('team', 'transfer', 'completed')");
        expect((await engagement("team")).status).toBe("completed");
    });
    it("prevents stale status writes from undoing automatic completion", async () => {
        await create();
        await client.query("INSERT INTO issues VALUES ('a', 'e', 'done')");
        const completed = await engagement();
        await client.query("UPDATE worker_engagements SET status = 'pending' WHERE id = 'e'");
        expect(await engagement()).toEqual(completed);
    });
    it("normalizes legacy status writes during a rolling deployment", async () => {
        await create("onboarding", "expected");
        expect((await engagement()).status).toBe("pending");
    });
});
