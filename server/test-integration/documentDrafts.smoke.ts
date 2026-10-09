// This script only ever connects to the disposable migration-test database.
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { fromSegments } from "../../shared/document";
import type { Prisma } from "@prisma/client";
process.env.DATABASE_URL =
    "postgresql://postgres:handwerk-local-test@127.0.0.1:55439/handwerk_document_test";
const { prisma } = await import("../src/lib/prisma");
const { saveEngagementContractDraft, getEngagementContract } =
    await import("../src/services/employmentContract.service");
const { saveArbeitszeugnisDraft, previewArbeitszeugnis } =
    await import("../src/services/arbeitszeugnis");
const body = fromSegments([
    { type: "input", key: "contract.vorname", label: "Vorname" },
    {
        type: "input",
        key: "contract.check",
        label: "Check",
        fieldType: "checkbox",
    },
]);
const json = body as unknown as Prisma.InputJsonValue;
try {
    const suffix = randomUUID();
    const user = await prisma.user.create({
        data: {
            firstName: "Test",
            lastName: "Admin",
            email: suffix + "@example.invalid",
            passwordHash: "test-only",
        },
    });
    const organization = await prisma.organization.create({
        data: { name: "Document test", slug: suffix },
    });
    const worker = await prisma.worker.create({
        data: {
            organizationId: organization.id,
            createdByUserId: user.id,
            firstName: "Jörg",
            lastName: "Müller",
            email: "worker-" + suffix + "@example.invalid",
        },
    });
    const engagement = await prisma.workerEngagement.create({
        data: {
            workerId: worker.id,
            organizationId: organization.id,
            responsibleUserId: user.id,
            type: "onboarding",
        },
    });
    const master = await prisma.documentMaster.create({
        data: {
            organizationId: organization.id,
            name: "Test contract",
            kind: "employment_contract",
            body: json,
            approvedAt: new Date(),
        },
    });
    await prisma.employmentContract.create({
        data: { engagementId: engagement.id, masterId: master.id },
    });
    const scope = {
        organizationId: organization.id,
        engagementId: engagement.id,
        workerId: worker.id,
    };
    const values = {
        "contract.vorname": "Manual correction Müller",
        "contract.check": "false",
    };
    await saveEngagementContractDraft({ ...scope, values });
    assert.deepEqual((await getEngagementContract(scope))?.values, values);
    assert.equal(
        await getEngagementContract({ ...scope, organizationId: "other-org" }),
        null,
    );
    const prepared = await prisma.preparedDocument.create({
        data: {
            organizationId: organization.id,
            engagementId: engagement.id,
            masterId: master.id,
            masterRevision: master.revision,
            kind: "employment_contract",
            name: master.name,
            recipient: worker.email,
            snapshot: json,
            values,
            fontManifest: [],
            s3Key: "test-only",
            contentHash: "test-hash",
        },
    });
    await saveEngagementContractDraft({
        ...scope,
        values: { ...values, "contract.vorname": "Another correction" },
    });
    assert.equal(
        (
            await prisma.preparedDocument.findUniqueOrThrow({
                where: { id: prepared.id },
            })
        ).status,
        "superseded",
    );
    const letterMaster = await prisma.documentMaster.create({
        data: {
            organizationId: organization.id,
            name: "Test letter",
            kind: "arbeitszeugnis",
            body: json,
            approvedAt: new Date(),
        },
    });
    await prisma.automationDocumentSetting.create({
        data: {
            organizationId: organization.id,
            automation: "arbeitszeugnis",
            documentMasterId: letterMaster.id,
        },
    });
    await saveArbeitszeugnisDraft({ ...scope, values });
    const reopened = await previewArbeitszeugnis(scope);
    assert.equal(reopened.status, "ready");
    if (reopened.status === "ready")
        assert.deepEqual(reopened.preview.values, values);
    const signedBody = {
        version: 2,
        segments: [{ type: "text", text: "Historical signed snapshot" }],
    };
    await prisma.employmentContract.update({
        where: { engagementId: engagement.id },
        data: {
            status: "signed",
            sentAt: new Date(),
            signedBody,
            fileUrl: "returned/signed.pdf",
        },
    });
    await assert.rejects(saveEngagementContractDraft({ ...scope, values }));
    const preserved = await prisma.employmentContract.findUniqueOrThrow({
        where: { engagementId: engagement.id },
    });
    assert.deepEqual(preserved.signedBody, signedBody);
    assert.equal(preserved.fileUrl, "returned/signed.pdf");
    console.log(
        "Real PostgreSQL draft reopening, value invalidation, organization isolation and signed-snapshot preservation passed.",
    );
} finally {
    await prisma.$disconnect();
}
