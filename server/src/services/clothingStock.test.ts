import { prisma } from "@/lib/prisma";
import {
    createClothingStockItem,
    listClothingStock,
} from "@/services/clothingStock.service";
import AppError from "@/utils/AppError";

jest.mock("@/lib/prisma", () => ({
    prisma: {
        clothingStockItem: {
            findMany: jest.fn(),
            findFirst: jest.fn(),
            create: jest.fn(),
        },
    },
}));

const stock = prisma.clothingStockItem;

describe("clothing stock", () => {
    beforeEach(() => {
        jest.resetAllMocks();
    });

    it("lists an organization's clothing with the quantity already in stock", async () => {
        (stock.findMany as jest.Mock).mockResolvedValue([
            { id: "1", name: "Hose", size: "52", quantity: 4, organizationId: "org" },
        ]);

        await expect(listClothingStock("org")).resolves.toEqual([
            { id: "1", name: "Hose", size: "52", quantity: 4 },
        ]);
        expect(stock.findMany).toHaveBeenCalledWith({
            where: { organizationId: "org" },
            orderBy: [{ name: "asc" }, { size: "asc" }],
        });
    });

    it("rejects a second entry for the same clothing and size", async () => {
        (stock.findFirst as jest.Mock).mockResolvedValue({ id: "existing" });

        await expect(
            createClothingStockItem("org", {
                name: "T-Shirt",
                size: "L",
                quantity: 2,
            }),
        ).rejects.toBeInstanceOf(AppError);
        expect(stock.create).not.toHaveBeenCalled();
    });
});
