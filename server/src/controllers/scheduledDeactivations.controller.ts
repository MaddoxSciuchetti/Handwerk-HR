import { z } from "zod";
import { prisma } from "@/lib/prisma";
import catchErrors from "@/utils/catchErrors";
import appAssert from "@/utils/appAssert";
import { BAD_REQUEST } from "@/constants/http";
import { requireCronSecret } from "@/middleware/requireCronSecret";
import {
    berlinToday,
    DEACTIVATION_SEQUENCES,
    executableStatuses,
    readDeactivationSchedule,
    saveDeactivationSchedule,
} from "@/services/integrations/deactivationSchedule";
import { runIssueSequence } from "@/services/integrations/runSequence";

export { requireCronSecret };
export const getDeactivationSchedule = catchErrors(async (req, res) => {
    appAssert(req.orgId, BAD_REQUEST, "Organisation fehlt.");
    res.json({
        success: true,
        data: await readDeactivationSchedule(
            req.orgId,
            String(req.params.issueId),
        ),
    });
});
export const patchDeactivationSchedule = catchErrors(async (req, res) => {
    appAssert(
        req.orgId && req.userId,
        BAD_REQUEST,
        "Organisation oder Benutzer fehlt.",
    );
    const body = z
        .object({ scheduledDeactivateAt: z.string().nullable() })
        .strict()
        .parse(req.body);
    const data = await saveDeactivationSchedule({
        organizationId: req.orgId,
        actorUserId: req.userId!,
        issueId: String(req.params.issueId),
        scheduledDeactivateAt: body.scheduledDeactivateAt,
    });
    res.json({ success: true, data });
});
export const postScheduledDeactivations = catchErrors(async (_req, res) => {
    const now = new Date();
    const issues = await prisma.issue.findMany({
        where: {
            sequence: { in: [...DEACTIVATION_SEQUENCES] },
            status: { in: [...executableStatuses] },
            scheduledDeactivateAt: {
                lt: new Date(`${berlinToday(now)}T00:00:00Z`),
            },
            AND: [
                {
                    OR: [
                        { deactivationClaimUntil: null },
                        { deactivationClaimUntil: { lte: now } },
                    ],
                },
            ],
            workerEngagement: { isNot: null },
        },
        select: {
            id: true,
            scheduledDeactivateByUserId: true,
            workerEngagement: { select: { organizationId: true } },
        },
        orderBy: [{ updatedAt: "asc" }, { id: "asc" }],
        take: 25,
    });
    const results: boolean[] = [];
    const deadline = Date.now() + 120_000;
    const queue = [...issues];
    const execute = async (issue: (typeof issues)[number]) => {
        try {
            if (!issue.workerEngagement || !issue.scheduledDeactivateByUserId)
                throw new Error(
                    "Geplante Deaktivierung ohne Organisation oder Benutzer.",
                );
            const result = await runIssueSequence({
                issueId: issue.id,
                organizationId: issue.workerEngagement.organizationId,
                actorUserId: issue.scheduledDeactivateByUserId,
                scheduled: true,
            });
            console.info("scheduled-deactivation", {
                issueId: issue.id,
                ...result,
            });
            return result.status === "completed";
        } catch (error) {
            console.error("scheduled-deactivation", {
                issueId: issue.id,
                error,
            });
            return false;
        }
    };
    await Promise.all(
        Array.from({ length: Math.min(5, queue.length) }, async () => {
            while (queue.length && Date.now() < deadline) {
                const issue = queue.shift()!;
                results.push(await execute(issue));
            }
        }),
    );
    const succeeded = results.filter(Boolean).length;
    const data = {
        processed: results.length,
        succeeded,
        failed: results.length - succeeded,
    };
    // Signal partial failure to the cron command while retaining successful work.
    res.status(data.failed ? 503 : 200).json(data);
});
