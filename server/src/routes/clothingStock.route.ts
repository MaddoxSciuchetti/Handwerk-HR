import express from "express";
import * as clothingStockController from "../controllers/clothingStock.controller";

const clothingStockRoutes = express.Router();

clothingStockRoutes.get("/", clothingStockController.getClothingStock);
clothingStockRoutes.post("/", clothingStockController.postClothingStockItem);
clothingStockRoutes.patch(
    "/:id",
    clothingStockController.patchClothingStockItem,
);
clothingStockRoutes.delete(
    "/:id",
    clothingStockController.removeClothingStockItem,
);

export { clothingStockRoutes };
