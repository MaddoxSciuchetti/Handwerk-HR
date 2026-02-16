import { UNAUTHORIZED } from "@/constants/http";
import { getChef } from "@/services/user.protected";

export async function checkChef(req, res, next) {
    const id = req.userId;

    const user = await getChef(id);

    if (!user || user?.user_permission !== "CHEF") {
        return res.status(UNAUTHORIZED).json({ error: "Access denied" });
    }

    next();
}
