import { prisma } from "@/lib/prisma";
import { NOT_FOUND, OK } from "../constants/http";
import appAssert from "../utils/appAssert";
import catchErrors from "../utils/catchErrors";
import {
    createDescription,
    deleteDescriptionData,
    deleteEmployee,
    getChef,
    getdbProfileFoto,
    getDescriptionData,
    getemployee_form,
    getUser,
    insertProfilePicture,
    queryEmployeeData,
    updateAbsenceData,
    updateDescriptionData,
} from "../services/user.protected";
import { checkChef } from "@/utils/checkChef";
import z from "zod";
import { generatePresignedUrl, uploadFileToS3 } from "@/config/aws";

export const getUserHandler = catchErrors(async (req, res) => {
    const id = req.userId;

    const user = await getUser(id);
    console.log("USER USR");
    console.log(user);

    appAssert(user, NOT_FOUND, "User not found");
    return res.status(OK).json(user);
});

export const getChefHandler = catchErrors(async (req, res) => {
    const id = req.userId;

    const user = await getChef(id);

    console.log(" === REAL USER ===");
    console.log(user);

    if (user?.user_permission !== "CHEF") {
        return res.status(OK).json({ error: "User not found" });
    }

    return res.status(OK).json(user);
});

export const getUnifiedData = catchErrors(async (req, res) => {
    const id = req.userId;

    const user = await getChef(id);
    if (user?.user_permission !== "CHEF") {
        return res.status(OK).json({ error: "User not found" });
    }

    const { unifiedData } = await getemployee_form();
    console.log(unifiedData);

    return res.status(OK).json(unifiedData);
});

export const deleteDescriptionHandler = catchErrors(async (req, res) => {
    const id = +req.params.id;

    const deletedData = await deleteDescriptionData(id);

    return res.status(OK).json(deletedData);
});

export const fetchDescriptionHandler = catchErrors(async (req, res) => {
    const id = req.userId;

    const descriptionData = await getDescriptionData();

    return res.status(OK).json(descriptionData);
});

export const editDescriptionHandler = catchErrors(async (req, res) => {
    const id = +req.params.id;

    const { form_field_id, owner, description, template_type } = req.body;

    const updatedDescription = await updateDescriptionData(
        form_field_id,
        owner,
        description,
    );

    return res.status(OK).json(updatedDescription);
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

export const getEmployeedata = catchErrors(async (req, res) => {
    const EmployeeData = await queryEmployeeData();
    console.log(EmployeeData);
    return res.status(OK).json(EmployeeData);
});

export const deleteEmployeeHandler = catchErrors(async (req, res) => {
    const id = req.params.id as string;
    const chefId = req.userId;
    console.log(id);

    const deleteEmployeeResult = await deleteEmployee(id, chefId);

    return res.status(OK).json(deleteEmployeeResult);
});

export const editAbsenceData = catchErrors(async (req, res) => {
    const data = req.body;

    console.log("this is the body data");
    console.log(data);

    const editAbsenceResult = await updateAbsenceData(data);
    return res.status(OK).json(editAbsenceResult);
});

export const postProfileFoto = catchErrors(async (req, res) => {
    const id = req.userId;
    const file = req.file as Express.Multer.File;

    const uploadFiles: Array<any> = [];

    const uploadResult = await uploadFileToS3(file, id, "upload/profilepic");
    if (!uploadResult.success) {
        return res.status(500).json({ error: "Upload failed" });
    }

    await insertProfilePicture({ cloud_url: uploadResult.url! }, id);

    return res.status(OK).json({ sucess: "image stored" });
});

export const getProfileFoto = catchErrors(async (req, res) => {
    const id = req.userId;

    const profilePic = await getdbProfileFoto(id);
    if (!profilePic) {
        return { error: "please upload profile pic" };
    }
    const key = new URL(profilePic?.cloud_url!).pathname.slice(1);
    const presignedUrl = await generatePresignedUrl(key);

    return res.status(OK).json(presignedUrl);
});
