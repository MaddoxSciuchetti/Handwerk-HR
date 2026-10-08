import { BAD_REQUEST, CONFLICT, NOT_FOUND } from "@/constants/http";
import { prisma } from "@/lib/prisma";
import {
    documentBody,
    readDocumentSegments,
    type DocumentSegment,
} from "@/services/documentBody";
import AppError from "@/utils/AppError";
import { Prisma } from "@prisma/client";

const VALUE_MAX = 8000;

type ContractParams = {
    organizationId: string;
    workerId: string;
    engagementId: string;
};

function inputKeys(segments: DocumentSegment[]): Set<string> {
    return new Set(
        segments
            .filter((segment) => segment.type === "input")
            .map((segment) => segment.key),
    );
}

function readDraftValues(
    input: Record<string, unknown>,
    allowed: Set<string>,
): { key: string; value: string }[] {
    const entries: { key: string; value: string }[] = [];
    for (const [key, raw] of Object.entries(input)) {
        if (typeof raw !== "string") {
            throw new AppError(BAD_REQUEST, "Ein Feldwert ist ungültig.");
        }
        if (!allowed.has(key)) {
            throw new AppError(
                BAD_REQUEST,
                "Ein Feld gehört nicht zu diesem Vertrag.",
            );
        }
        const value = raw.trim();
        if (value.length > VALUE_MAX) {
            throw new AppError(BAD_REQUEST, "Ein Feldwert ist zu lang.");
        }
        if (value.length > 0) entries.push({ key, value });
    }
    return entries;
}

async function findContract(params: ContractParams) {
    return prisma.employmentContract.findFirst({
        where: {
            engagementId: params.engagementId,
            engagement: {
                workerId: params.workerId,
                organizationId: params.organizationId,
            },
        },
        include: {
            master: true,
            values: true,
        },
    });
}

function present(
    contract: NonNullable<Awaited<ReturnType<typeof findContract>>>,
) {
    const frozen =
        contract.body === null ? null : readDocumentSegments(contract.body);
    const segments = frozen ?? readDocumentSegments(contract.master.body);
    const values: Record<string, string> = {};
    for (const entry of contract.values) {
        values[entry.key] = entry.value;
    }

    return {
        id: contract.id,
        engagementId: contract.engagementId,
        status: contract.status,
        name: contract.master.name,
        followsMaster: frozen === null && contract.status === "draft",
        segments,
        values,
    };
}

export async function getEngagementContract(params: ContractParams) {
    const contract = await findContract(params);
    if (!contract) return null;
    return present(contract);
}

export async function saveEngagementContractDraft(
    params: ContractParams & { values: Record<string, unknown> },
) {
    const contract = await findContract(params);
    if (!contract) {
        throw new AppError(NOT_FOUND, "Vertrag nicht gefunden.");
    }
    if (contract.status !== "draft") {
        throw new AppError(CONFLICT, "Der Vertrag ist kein Entwurf mehr.");
    }

    const followsMaster = contract.body === null;
    const segments = followsMaster
        ? readDocumentSegments(contract.master.body)
        : readDocumentSegments(contract.body as Prisma.JsonValue);
    const entries = readDraftValues(params.values, inputKeys(segments));

    const saved = await prisma.$transaction(async (tx) => {
        if (followsMaster) {
            await tx.employmentContract.update({
                where: { id: contract.id },
                data: { body: documentBody(segments), status: "draft" },
            });
        }

        await tx.employmentContractValue.deleteMany({
            where: { employmentContractId: contract.id },
        });
        if (entries.length > 0) {
            await tx.employmentContractValue.createMany({
                data: entries.map((entry) => ({
                    employmentContractId: contract.id,
                    key: entry.key,
                    value: entry.value,
                })),
            });
        }

        return tx.employmentContract.findFirstOrThrow({
            where: { id: contract.id },
            include: { master: true, values: true },
        });
    });

    return { ...present(saved), detachedFromMaster: followsMaster };
}
