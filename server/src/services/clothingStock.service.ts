import { CONFLICT, NOT_FOUND } from "@/constants/http";
import { prisma } from "@/lib/prisma";
import type {
    ClothingStockInput,
    ClothingStockPatch,
} from "@/schemas/clothingStock.schemas";
import AppError from "@/utils/AppError";
import { Prisma } from "@prisma/client";

export type ClothingStockItemDto = {
    id: string;
    name: string;
    size: string;
    quantity: number;
};

const DUPLICATE_MESSAGE =
    "Dieser Artikel ist in dieser Größe schon im Bestand.";

function toItem(row: {
    id: string;
    name: string;
    size: string;
    quantity: number;
}): ClothingStockItemDto {
    return {
        id: row.id,
        name: row.name,
        size: row.size,
        quantity: row.quantity,
    };
}

function isUniqueConflict(error: unknown) {
    return (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
    );
}

async function assertAvailable(
    organizationId: string,
    name: string,
    size: string,
    ignoreId?: string,
) {
    const existing = await prisma.clothingStockItem.findFirst({
        where: {
            organizationId,
            name: { equals: name, mode: "insensitive" },
            size: { equals: size, mode: "insensitive" },
            ...(ignoreId ? { id: { not: ignoreId } } : {}),
        },
        select: { id: true },
    });
    if (existing) throw new AppError(CONFLICT, DUPLICATE_MESSAGE);
}

export async function listClothingStock(
    organizationId: string,
): Promise<ClothingStockItemDto[]> {
    const rows = await prisma.clothingStockItem.findMany({
        where: { organizationId },
        orderBy: [{ name: "asc" }, { size: "asc" }],
    });
    return rows.map(toItem);
}

export async function createClothingStockItem(
    organizationId: string,
    input: ClothingStockInput,
): Promise<ClothingStockItemDto> {
    await assertAvailable(organizationId, input.name, input.size);
    try {
        const created = await prisma.clothingStockItem.create({
            data: {
                organizationId,
                name: input.name,
                size: input.size,
                quantity: input.quantity,
            },
        });
        return toItem(created);
    } catch (error) {
        if (isUniqueConflict(error)) {
            throw new AppError(CONFLICT, DUPLICATE_MESSAGE);
        }
        throw error;
    }
}

export async function updateClothingStockItem(
    organizationId: string,
    id: string,
    patch: ClothingStockPatch,
): Promise<ClothingStockItemDto> {
    const current = await prisma.clothingStockItem.findFirst({
        where: { id, organizationId },
    });
    if (!current) throw new AppError(NOT_FOUND, "Artikel nicht gefunden.");

    const next = {
        name: patch.name ?? current.name,
        size: patch.size ?? current.size,
        quantity: patch.quantity ?? current.quantity,
    };
    await assertAvailable(organizationId, next.name, next.size, id);

    try {
        const updated = await prisma.clothingStockItem.update({
            where: { id },
            data: next,
        });
        return toItem(updated);
    } catch (error) {
        if (isUniqueConflict(error)) {
            throw new AppError(CONFLICT, DUPLICATE_MESSAGE);
        }
        throw error;
    }
}

export async function deleteClothingStockItem(
    organizationId: string,
    id: string,
): Promise<void> {
    const deleted = await prisma.clothingStockItem.deleteMany({
        where: { id, organizationId },
    });
    if (deleted.count === 0) {
        throw new AppError(NOT_FOUND, "Artikel nicht gefunden.");
    }
}
