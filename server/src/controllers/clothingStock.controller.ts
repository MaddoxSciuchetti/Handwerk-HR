import { BAD_REQUEST, CREATED, OK } from "@/constants/http";
import {
    clothingStockInputSchema,
    clothingStockPatchSchema,
} from "@/schemas/clothingStock.schemas";
import {
    createClothingStockItem,
    deleteClothingStockItem,
    listClothingStock,
    updateClothingStockItem,
} from "@/services/clothingStock.service";
import appAssert from "@/utils/appAssert";
import catchErrors from "@/utils/catchErrors";

function param(value: string | string[]): string {
    return Array.isArray(value) ? value[0] : value;
}

export const getClothingStock = catchErrors(async (req, res) => {
    appAssert(req.orgId, BAD_REQUEST, "Organisation fehlt.");
    const data = await listClothingStock(req.orgId);
    return res.status(OK).json({ success: true, data });
});

export const postClothingStockItem = catchErrors(async (req, res) => {
    appAssert(req.orgId, BAD_REQUEST, "Organisation fehlt.");
    const input = clothingStockInputSchema.parse(req.body);
    const data = await createClothingStockItem(req.orgId, input);
    return res.status(CREATED).json({ success: true, data });
});

export const patchClothingStockItem = catchErrors(async (req, res) => {
    appAssert(req.orgId, BAD_REQUEST, "Organisation fehlt.");
    const patch = clothingStockPatchSchema.parse(req.body);
    const data = await updateClothingStockItem(
        req.orgId,
        param(req.params.id),
        patch,
    );
    return res.status(OK).json({ success: true, data });
});

export const removeClothingStockItem = catchErrors(async (req, res) => {
    appAssert(req.orgId, BAD_REQUEST, "Organisation fehlt.");
    await deleteClothingStockItem(req.orgId, param(req.params.id));
    return res.status(OK).json({ success: true });
});
