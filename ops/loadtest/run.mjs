#!/usr/bin/env node
/**
 * Concurrent-user load probe for the Handwerk-HR API.
 *
 * Measures p50/p95 latency and error rate while ramping concurrency.
 * Default target is local. Opt into staging/production with env vars.
 *
 * Usage:
 *   LOADTEST_BASE_URL=http://127.0.0.1:3000 node ops/loadtest/run.mjs
 *   LOADTEST_EMAIL=… LOADTEST_PASSWORD=… node ops/loadtest/run.mjs
 *   LOADTEST_MODE=ramp LOADTEST_MAX_VUS=80 node ops/loadtest/run.mjs
 */

const BASE_URL = (process.env.LOADTEST_BASE_URL || "http://127.0.0.1:3000").replace(
    /\/$/,
    "",
);
const MODE = process.env.LOADTEST_MODE === "ramp" ? "ramp" : "baseline";
const EMAIL = process.env.LOADTEST_EMAIL?.trim();
const PASSWORD = process.env.LOADTEST_PASSWORD?.trim();
const PATH = process.env.LOADTEST_PATH || (EMAIL && PASSWORD ? "/tasks" : "/");
const DURATION_MS = Number(process.env.LOADTEST_DURATION_MS || 15_000);
const BASELINE_VUS = Number(process.env.LOADTEST_VUS || 10);
const MAX_VUS = Number(process.env.LOADTEST_MAX_VUS || 80);
const STEP_VUS = Number(process.env.LOADTEST_STEP_VUS || 10);
const ERROR_BUDGET = Number(process.env.LOADTEST_ERROR_BUDGET || 0.05);
const P95_BUDGET_MS = Number(process.env.LOADTEST_P95_BUDGET_MS || 2000);
const ALLOW_NON_LOCAL = process.env.LOADTEST_ALLOW_NON_LOCAL === "1";

function assertSafeTarget(url) {
    let host;
    try {
        host = new URL(url).hostname;
    } catch {
        throw new Error(`Invalid LOADTEST_BASE_URL: ${url}`);
    }
    const local =
        host === "localhost" ||
        host === "127.0.0.1" ||
        host === "0.0.0.0" ||
        host === "::1";
    if (!local && !ALLOW_NON_LOCAL) {
        throw new Error(
            `Refusing to load-test non-local host "${host}". Set LOADTEST_ALLOW_NON_LOCAL=1 for staging (avoid prod).`,
        );
    }
}

function percentile(sorted, p) {
    if (sorted.length === 0) return 0;
    const idx = Math.min(
        sorted.length - 1,
        Math.max(0, Math.ceil((p / 100) * sorted.length) - 1),
    );
    return sorted[idx];
}

function summarize(samples) {
    const ok = samples.filter((s) => s.ok);
    const durations = ok.map((s) => s.ms).sort((a, b) => a - b);
    const errors = samples.length - ok.length;
    return {
        requests: samples.length,
        errors,
        errorRate: samples.length ? errors / samples.length : 1,
        p50: percentile(durations, 50),
        p95: percentile(durations, 95),
        max: durations.length ? durations[durations.length - 1] : 0,
    };
}

function parseCookieHeader(setCookieHeaders) {
    if (!setCookieHeaders) return "";
    const list = Array.isArray(setCookieHeaders)
        ? setCookieHeaders
        : [setCookieHeaders];
    return list
        .map((line) => line.split(";")[0])
        .filter(Boolean)
        .join("; ");
}

async function login() {
    if (!EMAIL || !PASSWORD) return "";
    const res = await fetch(`${BASE_URL}/auth/v2/login`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
    });
    if (!res.ok) {
        const body = await res.text();
        throw new Error(`Login failed (${res.status}): ${body.slice(0, 200)}`);
    }
    // Node 20+ undici: getSetCookie() returns each Set-Cookie line.
    const setCookies =
        typeof res.headers.getSetCookie === "function"
            ? res.headers.getSetCookie()
            : [];
    const cookieHeader = parseCookieHeader(setCookies);
    if (!cookieHeader.includes("accessToken=")) {
        throw new Error("Login succeeded but accessToken cookie was missing");
    }
    return cookieHeader;
}

async function oneRequest(cookieHeader) {
    const started = performance.now();
    try {
        const res = await fetch(`${BASE_URL}${PATH}`, {
            headers: cookieHeader ? { cookie: cookieHeader } : undefined,
        });
        const ms = performance.now() - started;
        // Drain body so connections can reuse.
        await res.arrayBuffer();
        return { ok: res.status < 500, status: res.status, ms };
    } catch (error) {
        return {
            ok: false,
            status: 0,
            ms: performance.now() - started,
            error: error instanceof Error ? error.message : String(error),
        };
    }
}

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runAtConcurrency(vus, cookieHeader, durationMs) {
    const samples = [];
    const endAt = Date.now() + durationMs;
    const workers = Array.from({ length: vus }, async () => {
        while (Date.now() < endAt) {
            const sample = await oneRequest(cookieHeader);
            samples.push(sample);
            // Avoid tight spin when the host is down / refusing connections.
            if (!sample.ok && sample.status === 0) {
                await sleep(50);
            }
        }
    });
    await Promise.all(workers);
    return summarize(samples);
}

function printRow(vus, stats) {
    const line = [
        `VUs=${String(vus).padStart(3)}`,
        `req=${String(stats.requests).padStart(5)}`,
        `err=${(stats.errorRate * 100).toFixed(1).padStart(5)}%`,
        `p50=${String(Math.round(stats.p50)).padStart(5)}ms`,
        `p95=${String(Math.round(stats.p95)).padStart(5)}ms`,
        `max=${String(Math.round(stats.max)).padStart(5)}ms`,
    ].join("  ");
    console.log(line);
}

async function main() {
    assertSafeTarget(BASE_URL);
    console.log(`Target: ${BASE_URL}${PATH}`);
    console.log(`Mode: ${MODE}  duration/step: ${DURATION_MS}ms`);
    if (EMAIL && PASSWORD) {
        console.log(`Auth: login as ${EMAIL}`);
    } else {
        console.log("Auth: none (public path; set LOADTEST_EMAIL/PASSWORD for /tasks)");
    }

    const cookieHeader = await login();
    const results = [];

    if (MODE === "baseline") {
        const stats = await runAtConcurrency(BASELINE_VUS, cookieHeader, DURATION_MS);
        printRow(BASELINE_VUS, stats);
        results.push({ vus: BASELINE_VUS, ...stats });
    } else {
        let lastGood = 0;
        for (let vus = STEP_VUS; vus <= MAX_VUS; vus += STEP_VUS) {
            const stats = await runAtConcurrency(vus, cookieHeader, DURATION_MS);
            printRow(vus, stats);
            results.push({ vus, ...stats });
            const overBudget =
                stats.errorRate > ERROR_BUDGET || stats.p95 > P95_BUDGET_MS;
            if (overBudget) {
                console.log(
                    `Stopping: errorRate>${ERROR_BUDGET * 100}% or p95>${P95_BUDGET_MS}ms`,
                );
                break;
            }
            lastGood = vus;
        }
        console.log(
            lastGood
                ? `Highest concurrency within budget: ~${lastGood} concurrent clients`
                : "No concurrency step stayed within budget",
        );
    }

    console.log(
        JSON.stringify(
            {
                baseUrl: BASE_URL,
                path: PATH,
                mode: MODE,
                results,
            },
            null,
            2,
        ),
    );
}

main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
});
