import { generatePresignedUrl, uploadFileToS3 } from "@/config/aws";
import { NOT_FOUND, OK } from "../constants/http";
import {
    createDescription,
    getChef,
    insertProfilePhoto,
    queryProfilePhoto,
    queryUser,
} from "../services/user.protected";
import appAssert from "../utils/appAssert";
import catchErrors from "../utils/catchErrors";

export const getUser = catchErrors(async (req, res) => {
    const id = req.userId;

    const user = await queryUser(id);
    appAssert(user, NOT_FOUND, "User not found");
    return res.status(OK).json(user);
});

export const getChefHandler = catchErrors(async (req, res) => {
    const id = req.userId;

    const user = await getChef(id);

    if (user?.user_permission !== "CHEF") {
        return res.status(OK).json({ error: "User not found" });
    }

    return res.status(OK).json(user);
});

export const createDescriptionHandler = catchErrors(async (req, res) => {
    const { description, owner, template_type } = req.body;
    console.log(template_type);

    const newDescription = await createDescription(
        description,
        owner,
        template_type,
    );
    return res.status(OK).json(newDescription);
});
export const uploadProfilePhoto = catchErrors(async (req, res) => {
    const id = req.userId;
    const file = req.file as Express.Multer.File;

    const uploadFiles: Array<any> = [];

    const uploadResult = await uploadFileToS3(file, id, "upload/profilepic");
    if (!uploadResult.success) {
        return res.status(500).json({ error: "Upload failed" });
    }

    await insertProfilePhoto({ cloud_url: uploadResult.url! }, id);

    return res.status(OK).json({ sucess: "image stored" });
});

export const getProfilePhoto = catchErrors(async (req, res) => {
    const id = req.userId;

    const profilePic = await queryProfilePhoto(id);
    if (!profilePic) {
        return { error: "please upload profile pic" };
    }
    const key = new URL(profilePic?.cloud_url!).pathname.slice(1);
    const presignedUrl = await generatePresignedUrl(key);

    return res.status(OK).json(presignedUrl);
});
