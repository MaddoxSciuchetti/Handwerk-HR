import { BAD_REQUEST, CONFLICT, NOT_FOUND } from "@/constants/http";
import { prisma } from "@/lib/prisma";
import type { CreateEngagementClothingInput } from "@/schemas/engagementClothing.schemas";
import AppError from "@/utils/AppError";
import type { ClothingPrintType } from "@prisma/client";
import { Prisma } from "@prisma/client";
import {
    berlinToday,
    calendarDayUtc,
} from "../../../shared/calendarDate";

export type EngagementClothingDto = {
    id: string;
    name: string;
    size: string;
    printType: ClothingPrintType;
    productUrl: string | null;
    source: "storage" | "purchased";
    quantity: number;
    returnedQuantity: number;
    stockItemId: string | null;
    issuedAt: string;
};

type Scope = {
    organizationId: string;
    workerId: string;
    engagementId: string;
};

type ClothingRow = {
    id: string;
    name: string;
    size: string;
    printType: ClothingPrintType;
    productUrl: string | null;
    source: "storage" | "purchased";
    quantity: number;
    returnedQuantity: number;
    stockItemId: string | null;
    issuedAt: Date;
};

type Tx = Prisma.TransactionClient;

function toDto(row: ClothingRow): EngagementClothingDto {
    return {
        id: row.id,
        name: row.name,
        size: row.size,
        printType: row.printType,
        productUrl: row.productUrl,
        source: row.source,
        quantity: row.quantity,
        returnedQuantity: row.returnedQuantity,
        stockItemId: row.stockItemId,
        issuedAt: row.issuedAt.toISOString().slice(0, 10),
    };
}

function normalizeUrl(value: string | undefined) {
    const trimmed = value?.trim() ?? "";
    return trimmed.length > 0 ? trimmed : null;
}

function resolveIssuedAt(value: string | undefined) {
    return calendarDayUtc(value ?? berlinToday());
}

function isUniqueConflict(error: unknown) {
    return (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
    );
}

async function requireEngagement(tx: Tx, scope: Scope) {
    const engagement = await tx.workerEngagement.findFirst({
        where: {
            id: scope.engagementId,
            workerId: scope.workerId,
            organizationId: scope.organizationId,
        },
        select: { id: true },
    });
    if (!engagement) throw new AppError(NOT_FOUND, "Engagement nicht gefunden.");
}

async function requireClothing(tx: Tx, scope: Scope, clothingId: string) {
    const row = await tx.engagementClothing.findFirst({
        where: {
            id: clothingId,
            engagement: {
                id: scope.engagementId,
                workerId: scope.workerId,
                organizationId: scope.organizationId,
            },
        },
    });
    if (!row) throw new AppError(NOT_FOUND, "Kleidung nicht gefunden.");
    return row;
}

async function addToStock(
    tx: Tx,
    organizationId: string,
    item: {
        stockItemId: string | null;
        name: string;
        size: string;
        printType: ClothingPrintType;
    },
    quantity: number,
) {
    if (item.stockItemId) {
        const updated = await tx.clothingStockItem.updateMany({
            where: { id: item.stockItemId, organizationId },
            data: { quantity: { increment: quantity } },
        });
        if (updated.count === 1) return item.stockItemId;
    }

    const existing = await tx.clothingStockItem.findFirst({
        where: {
            organizationId,
            name: { equals: item.name, mode: "insensitive" },
            size: { equals: item.size, mode: "insensitive" },
            printType: item.printType,
        },
        select: { id: true },
    });
    if (existing) {
        await tx.clothingStockItem.update({
            where: { id: existing.id },
            data: { quantity: { increment: quantity } },
        });
        return existing.id;
    }

    try {
        const created = await tx.clothingStockItem.create({
            data: {
                organizationId,
                name: item.name,
                size: item.size,
                printType: item.printType,
                quantity,
            },
            select: { id: true },
        });
        return created.id;
    } catch (error) {
        if (!isUniqueConflict(error)) throw error;
        const raced = await tx.clothingStockItem.findFirst({
            where: {
                organizationId,
                name: { equals: item.name, mode: "insensitive" },
                size: { equals: item.size, mode: "insensitive" },
                printType: item.printType,
            },
            select: { id: true },
        });
        if (!raced) throw error;
        await tx.clothingStockItem.update({
            where: { id: raced.id },
            data: { quantity: { increment: quantity } },
        });
        return raced.id;
    }
}

export async function listEngagementClothing(
    scope: Scope,
): Promise<EngagementClothingDto[]> {
    return prisma.$transaction(async (tx) => {
        await requireEngagement(tx, scope);
        const rows = await tx.engagementClothing.findMany({
            where: { engagementId: scope.engagementId },
            orderBy: [{ issuedAt: "asc" }, { createdAt: "asc" }],
        });
        return rows.map(toDto);
    });
}

export async function createEngagementClothing(
    scope: Scope,
    input: CreateEngagementClothingInput,
): Promise<EngagementClothingDto> {
    return prisma.$transaction(async (tx) => {
        await requireEngagement(tx, scope);
        const productUrl = normalizeUrl(input.productUrl);
        const issuedAt = resolveIssuedAt(input.issuedAt);

        if (input.stockItemId) {
            const item = await tx.clothingStockItem.findFirst({
                where: {
                    id: input.stockItemId,
                    organizationId: scope.organizationId,
                },
            });
            if (!item) throw new AppError(NOT_FOUND, "Artikel nicht gefunden.");

            const taken = await tx.clothingStockItem.updateMany({
                where: {
                    id: item.id,
                    organizationId: scope.organizationId,
                    quantity: { gte: input.quantity },
                },
                data: { quantity: { decrement: input.quantity } },
            });
            if (taken.count !== 1) {
                throw new AppError(CONFLICT, "Nicht genug Bestand.");
            }

            const created = await tx.engagementClothing.create({
                data: {
                    engagementId: scope.engagementId,
                    stockItemId: item.id,
                    name: item.name,
                    size: item.size,
                    printType: item.printType,
                    productUrl,
                    source: "storage",
                    quantity: input.quantity,
                    issuedAt,
                },
            });
            return toDto(created);
        }

        const name = input.name?.trim() ?? "";
        if (!name) throw new AppError(BAD_REQUEST, "Artikel fehlt.");

        const created = await tx.engagementClothing.create({
            data: {
                engagementId: scope.engagementId,
                name,
                size: input.size?.trim() ?? "",
                printType: input.printType ?? "unbedruckt",
                productUrl,
                source: "purchased",
                quantity: input.quantity,
                issuedAt,
            },
        });
        return toDto(created);
    });
}

export async function returnEngagementClothing(
    scope: Scope,
    clothingId: string,
    quantity?: number,
): Promise<EngagementClothingDto> {
    return prisma.$transaction(async (tx) => {
        const row = await requireClothing(tx, scope, clothingId);
        const outstanding = row.quantity - row.returnedQuantity;
        if (outstanding < 1) {
            throw new AppError(
                CONFLICT,
                "Dieser Artikel ist schon zurück im Bestand.",
            );
        }
        const amount = quantity ?? outstanding;
        if (amount > outstanding) {
            throw new AppError(
                BAD_REQUEST,
                "Mehr als ausgegeben kann nicht zurückgegeben werden.",
            );
        }

        const stockItemId = await addToStock(
            tx,
            scope.organizationId,
            row,
            amount,
        );
        const updated = await tx.engagementClothing.update({
            where: { id: row.id },
            data: {
                returnedQuantity: row.returnedQuantity + amount,
                stockItemId,
            },
        });
        return toDto(updated);
    });
}

export async function deleteEngagementClothing(
    scope: Scope,
    clothingId: string,
): Promise<void> {
    await prisma.$transaction(async (tx) => {
        const row = await requireClothing(tx, scope, clothingId);
        const outstanding = row.quantity - row.returnedQuantity;
        if (row.source === "storage" && outstanding > 0) {
            await addToStock(tx, scope.organizationId, row, outstanding);
        }
        await tx.engagementClothing.delete({ where: { id: row.id } });
    });
}
