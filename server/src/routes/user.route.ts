import { upload } from "@/middleware/fileparser";
import { Router } from "express";
import * as UserControllerV2 from "../controllers/user.controller";

const userRoutes = Router();

userRoutes.get("/v2", UserControllerV2.getUser);
userRoutes.post(
    "/v2/profile/photo",
    upload.single("file"),
    UserControllerV2.uploadProfilePhoto,
);
userRoutes.get("/v2/profile/photo", UserControllerV2.getProfilePhoto);
userRoutes.post("/v2/updateProfileInformation", UserControllerV2.updateProfile);

export { userRoutes };
