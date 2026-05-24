import { Session, User } from "@/generated/prisma/client";
import jwt, { JwtPayload, SignOptions, VerifyOptions } from "jsonwebtoken";
import { JWT_REFRESH_SECRET, JWT_SECRET } from "../constants/env";

export type RefreshTokenPayload = {
    sessionId?: Session["id"]; // v1
    tokenId?: string; // v2
};

export type AccessTokenPayload = {
    userId: User["id"];
    sessionId?: string; // v1 — was Session["id"]
    tokenId?: string; // v2
};

type SignOptionsAndSecret = SignOptions & {
    secret: string;
};

const signDefaults: SignOptions = {
    audience: ["user"],
};

const verifyDefaults: VerifyOptions = {
    audience: ["user"],
};

const accessTokenSignOptions: SignOptionsAndSecret = {
    expiresIn: "15m",
    secret: JWT_SECRET,
};

export const refreshTokenSignOptions: SignOptionsAndSecret = {
    expiresIn: "30d",
    secret: JWT_REFRESH_SECRET,
};

export const signToken = (
    payload: AccessTokenPayload | RefreshTokenPayload,
    options?: SignOptionsAndSecret,
) => {
    const { secret, ...signopts } = options || accessTokenSignOptions;

    return jwt.sign(payload, secret, {
        ...signDefaults,
        ...signopts,
    });
};

export const verifyToken = <
    TPayload extends JwtPayload = AccessTokenPayload & JwtPayload,
>(
    token: string,
    options?: jwt.VerifyOptions & { secret: string }, // Use jwt.VerifyOptions specifically
) => {
    const { secret = JWT_SECRET, ...verifyOpts } = options || {};
    try {
        const payload = jwt.verify(token, secret, {
            ...verifyDefaults,
            ...verifyOpts,
        }) as unknown as TPayload;
        return { payload };
    } catch (error: any) {
        return {
            error: error.message,
        };
    }
};
