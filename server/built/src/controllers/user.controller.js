import { NOT_FOUND, OK } from "../constants/http";
import appAssert from "../utils/appAssert";
import catchErrors from "../utils/catchErrors";
import { getChef, getemployee_form, getUser } from "../services/user.protected";
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
