import { prisma } from "@/lib/prisma";
import {
    createEngagementClothing,
    deleteEngagementClothing,
    returnEngagementClothing,
} from "@/services/engagementClothing.service";
import AppError from "@/utils/AppError";

jest.mock("@/lib/prisma", () => ({
    prisma: {
        $transaction: jest.fn(),
        workerEngagement: { findFirst: jest.fn() },
        clothingStockItem: {
            findFirst: jest.fn(),
            updateMany: jest.fn(),
            update: jest.fn(),
            create: jest.fn(),
        },
        engagementClothing: {
            findFirst: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
        },
    },
}));

const transaction = prisma.$transaction as jest.Mock;
const engagement = prisma.workerEngagement.findFirst as jest.Mock;
const stock = prisma.clothingStockItem;
const clothing = prisma.engagementClothing;

const scope = {
    organizationId: "org",
    workerId: "worker",
    engagementId: "eng",
};

describe("engagement clothing", () => {
    beforeEach(() => {
        jest.resetAllMocks();
        transaction.mockImplementation((callback) => callback(prisma));
    });

    it("takes the ordered quantity out of storage when the item is chosen from stock", async () => {
        engagement.mockResolvedValue({ id: "eng" });
        (stock.findFirst as jest.Mock).mockResolvedValue({
            id: "stock-1",
            name: "Schuhe",
            size: "43",
            quantity: 4,
        });
        (stock.updateMany as jest.Mock).mockResolvedValue({ count: 1 });
        (clothing.create as jest.Mock).mockImplementation(
            async ({ data }: { data: Record<string, unknown> }) => ({
                id: "line-1",
                productUrl: null,
                returnedQuantity: 0,
                stockItemId: null,
                ...data,
            }),
        );

        await expect(
            createEngagementClothing(scope, {
                stockItemId: "stock-1",
                productUrl: "https://shop.example/schuhe",
                quantity: 2,
            }),
        ).resolves.toMatchObject({
            name: "Schuhe",
            size: "43",
            source: "storage",
            quantity: 2,
            productUrl: "https://shop.example/schuhe",
            stockItemId: "stock-1",
        });

        expect(stock.updateMany).toHaveBeenCalledWith({
            where: {
                id: "stock-1",
                organizationId: "org",
                quantity: { gte: 2 },
            },
            data: { quantity: { decrement: 2 } },
        });
    });

    it("records a newly bought item without changing storage", async () => {
        engagement.mockResolvedValue({ id: "eng" });
        (clothing.create as jest.Mock).mockImplementation(
            async ({ data }: { data: Record<string, unknown> }) => ({
                id: "line-2",
                returnedQuantity: 0,
                stockItemId: null,
                productUrl: null,
                ...data,
            }),
        );

        await expect(
            createEngagementClothing(scope, {
                name: "Jacke",
                size: "L",
                quantity: 1,
            }),
        ).resolves.toMatchObject({
            name: "Jacke",
            size: "L",
            source: "purchased",
            stockItemId: null,
        });
        expect(stock.updateMany).not.toHaveBeenCalled();
    });

    it("refuses a storage item when the ordered quantity is not on hand", async () => {
        engagement.mockResolvedValue({ id: "eng" });
        (stock.findFirst as jest.Mock).mockResolvedValue({
            id: "stock-1",
            name: "Schuhe",
            size: "43",
            quantity: 1,
        });
        (stock.updateMany as jest.Mock).mockResolvedValue({ count: 0 });

        await expect(
            createEngagementClothing(scope, {
                stockItemId: "stock-1",
                quantity: 2,
            }),
        ).rejects.toBeInstanceOf(AppError);
        expect(clothing.create).not.toHaveBeenCalled();
    });

    it("puts a returned storage item back into the same stock row", async () => {
        (clothing.findFirst as jest.Mock).mockResolvedValue({
            id: "line-1",
            name: "Schuhe",
            size: "43",
            productUrl: null,
            source: "storage",
            quantity: 2,
            returnedQuantity: 0,
            stockItemId: "stock-1",
        });
        (stock.updateMany as jest.Mock).mockResolvedValue({ count: 1 });
        (clothing.update as jest.Mock).mockImplementation(
            async ({ data }: { data: Record<string, unknown> }) => ({
                id: "line-1",
                name: "Schuhe",
                size: "43",
                productUrl: null,
                source: "storage",
                quantity: 2,
                ...data,
            }),
        );

        await expect(returnEngagementClothing(scope, "line-1")).resolves.toMatchObject({
            returnedQuantity: 2,
            stockItemId: "stock-1",
        });
        expect(stock.updateMany).toHaveBeenCalledWith({
            where: { id: "stock-1", organizationId: "org" },
            data: { quantity: { increment: 2 } },
        });
    });

    it("adds a returned new purchase into storage", async () => {
        (clothing.findFirst as jest.Mock).mockResolvedValue({
            id: "line-2",
            name: "Jacke",
            size: "L",
            productUrl: null,
            source: "purchased",
            quantity: 1,
            returnedQuantity: 0,
            stockItemId: null,
        });
        (stock.findFirst as jest.Mock).mockResolvedValue(null);
        (stock.create as jest.Mock).mockResolvedValue({ id: "stock-new" });
        (clothing.update as jest.Mock).mockImplementation(
            async ({ data }: { data: Record<string, unknown> }) => ({
                id: "line-2",
                name: "Jacke",
                size: "L",
                productUrl: null,
                source: "purchased",
                quantity: 1,
                ...data,
            }),
        );

        await expect(returnEngagementClothing(scope, "line-2", 1)).resolves.toMatchObject({
            returnedQuantity: 1,
            stockItemId: "stock-new",
        });
        expect(stock.create).toHaveBeenCalledWith({
            data: {
                organizationId: "org",
                name: "Jacke",
                size: "L",
                quantity: 1,
            },
            select: { id: true },
        });
    });

    it("returns an unfinished storage issue to stock when the line is removed", async () => {
        (clothing.findFirst as jest.Mock).mockResolvedValue({
            id: "line-1",
            name: "Schuhe",
            size: "43",
            productUrl: null,
            source: "storage",
            quantity: 2,
            returnedQuantity: 1,
            stockItemId: "stock-1",
        });
        (stock.updateMany as jest.Mock).mockResolvedValue({ count: 1 });

        await deleteEngagementClothing(scope, "line-1");

        expect(stock.updateMany).toHaveBeenCalledWith({
            where: { id: "stock-1", organizationId: "org" },
            data: { quantity: { increment: 1 } },
        });
        expect(clothing.delete).toHaveBeenCalledWith({ where: { id: "line-1" } });
    });
});
