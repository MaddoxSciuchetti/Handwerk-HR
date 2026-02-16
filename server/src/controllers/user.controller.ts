import { prisma } from "@/lib/prisma";
import { NOT_FOUND, OK } from "../constants/http";
import appAssert from "../utils/appAssert";
import catchErrors from "../utils/catchErrors";
import {
    createDescription,
    deleteDescriptionData,
    getChef,
    getDescriptionData,
    getemployee_form,
    getUser,
    updateDescriptionData,
} from "../services/user.protected";
import { checkChef } from "@/utils/checkChef";

export const getUserHandler = catchErrors(async (req, res) => {
    const id = req.userId;

    const user = await getUser(id);

    console.log("=== AUTHENTICATED USER ====");
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

export const getEmployeedata = catchErrors(async (req, res) => {
    const id = req.userId;

    const user = await getChef(id);
    if (user?.user_permission !== "CHEF") {
        return res.status(OK).json({ error: "User not found" });
    }

    console.log("is something happening");
    const { unifiedData } = await getemployee_form();
    console.log(unifiedData);

    return res.status(OK).json(unifiedData);
});

export const deleteDescriptionHandler = catchErrors(async (req, res) => {
    const id = req.userId;

    const { form_field_id } = req.body;

    const deletedData = await deleteDescriptionData(form_field_id);

    return res.status(OK).json(deletedData);
});

export const fetchDescriptionHandler = catchErrors(async (req, res) => {
    const id = req.userId;

    const descriptionData = await getDescriptionData();

    return res.status(OK).json(descriptionData);
});

export const editDescriptionHandler = catchErrors(async (req, res) => {
    const id = req.userId;

    const { form_field_id, owner } = req.body;

    const updatedDescription = await updateDescriptionData(
        form_field_id,
        owner,
    );

    return res.status(OK).json(updatedDescription);
});

export const createDescriptionHandler = catchErrors(async (req, res) => {
    const id = req.userId;

    const { description, owner, type } = req.body;

    const newDescription = await createDescription(description, owner, type);
    return res.status(OK).json(newDescription);
});
