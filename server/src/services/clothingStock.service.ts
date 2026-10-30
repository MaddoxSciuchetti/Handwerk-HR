import { CONFLICT, NOT_FOUND } from "@/constants/http";
import { prisma } from "@/lib/prisma";
import type {
    ClothingStockInput,
    ClothingStockPatch,
} from "@/schemas/clothingStock.schemas";
import AppError from "@/utils/AppError";
import type { ClothingPrintType } from "@prisma/client";
import { Prisma } from "@prisma/client";

export type ClothingStockItemDto = {
    id: string;
    name: string;
    size: string;
    printType: ClothingPrintType;
    quantity: number;
};

const DUPLICATE_MESSAGE =
    "Dieser Artikel ist in dieser Größe und diesem Typ schon im Bestand.";

function toItem(row: {
    id: string;
    name: string;
    size: string;
    printType: ClothingPrintType;
    quantity: number;
}): ClothingStockItemDto {
    return {
        id: row.id,
        name: row.name,
        size: row.size,
        printType: row.printType,
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
    printType: ClothingPrintType,
    ignoreId?: string,
) {
    const existing = await prisma.clothingStockItem.findFirst({
        where: {
            organizationId,
            name: { equals: name, mode: "insensitive" },
            size: { equals: size, mode: "insensitive" },
            printType,
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
        orderBy: [{ name: "asc" }, { size: "asc" }, { printType: "asc" }],
    });
    return rows.map(toItem);
}

export async function createClothingStockItem(
    organizationId: string,
    input: ClothingStockInput,
): Promise<ClothingStockItemDto> {
    await assertAvailable(
        organizationId,
        input.name,
        input.size,
        input.printType,
    );
    try {
        const created = await prisma.clothingStockItem.create({
            data: {
                organizationId,
                name: input.name,
                size: input.size,
                printType: input.printType,
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
        printType: patch.printType ?? current.printType,
        quantity: patch.quantity ?? current.quantity,
    };
    await assertAvailable(
        organizationId,
        next.name,
        next.size,
        next.printType,
        id,
    );

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
