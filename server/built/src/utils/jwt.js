import jwt from "jsonwebtoken";
import { JWT_REFRESH_SECRET, JWT_SECRET } from "../constants/env";
const signDefaults = {
    audience: ["user"],
};
const verifyDefaults = {
    audience: ["user"],
};
const accessTokenSignOptions = {
    expiresIn: "15m",
    secret: JWT_SECRET,
};
export const refreshTokenSignOptions = {
    expiresIn: "30d",
    secret: JWT_REFRESH_SECRET,
};
export const signToken = (payload, options) => {
    const { secret, ...signopts } = options || accessTokenSignOptions;
    return jwt.sign(payload, secret, {
        ...signDefaults,
        ...signopts,
    });
};
export const verifyToken = (token, options) => {
    const { secret = JWT_SECRET, ...verifyOpts } = options || {};
    try {
        const payload = jwt.verify(token, secret, {
            ...verifyDefaults,
            ...verifyOpts,
        });
        return { payload };
    }
    catch (error) {
        return {
            error: error.message,
        };
    }
};
