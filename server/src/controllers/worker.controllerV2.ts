import { generatePresignedUrl, uploadFileToS3 } from "@/config/aws";
import { NOT_FOUND, OK } from "@/constants/http";
import {
    insertProfilePhoto,
    queryProfilePhoto,
    queryUser,
} from "@/services/user.serviceV2";

import appAssert from "@/utils/appAssert";
import catchErrors from "@/utils/catchErrors";

export const getUser = catchErrors(async (req, res) => {
    const id = req.userId;

    const user = await queryUser(id);
    appAssert(user, NOT_FOUND, "User not found");

    return res.status(OK).json(user);
});

export const uploadProfilePhoto = catchErrors(async (req, res) => {
    const id = req.userId;
    const file = req.file as Express.Multer.File;

    const uploadResult = await uploadFileToS3(file, id, "upload/profilepic");
    if (!uploadResult.success) {
        return res.status(500).json({ error: "Upload failed" });
    }

    await insertProfilePhoto({ cloud_url: uploadResult.url! }, id);

    return res.status(OK).json({ success: "Image stored" });
});

export const getProfilePhoto = catchErrors(async (req, res) => {
    const id = req.userId;

    const profilePic = await queryProfilePhoto(id);
    if (!profilePic?.avatarUrl) {
        return res
            .status(NOT_FOUND)
            .json({ error: "Please upload a profile picture" });
    }

    let key: string;
    try {
        key = new URL(profilePic.avatarUrl).pathname.slice(1);
    } catch {
        return res
            .status(NOT_FOUND)
            .json({ error: "Please upload a profile picture" });
    }

    if (!key) {
        return res
            .status(NOT_FOUND)
            .json({ error: "Please upload a profile picture" });
    }

    const presignedUrl = await generatePresignedUrl(key);

    return res.status(OK).json(presignedUrl);
});
