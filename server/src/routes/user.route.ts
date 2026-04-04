import { upload } from "@/middleware/fileparser";
import { Router } from "express";
import {
    getProfilePhoto,
    getUser,
    uploadProfilePhoto,
} from "../controllers/user.controller";
import * as UserControllerV2 from "../controllers/user.controllerV2";

const userRoutes = Router();

// prefix /user

userRoutes.get("/", getUser);
userRoutes.get("/v2", UserControllerV2.getUser);
userRoutes.post("/profile/photo", upload.single("file"), uploadProfilePhoto);
userRoutes.post(
    "/v2/profile/photo",
    upload.single("file"),
    UserControllerV2.uploadProfilePhoto,
);
userRoutes.get("/profile/photo", getProfilePhoto);
userRoutes.get("/v2/profile/photo", UserControllerV2.getProfilePhoto);

export { userRoutes };
