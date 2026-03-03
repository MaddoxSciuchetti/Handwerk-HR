import { CREATED, OK, UNAUTHORIZED } from "../constants/http";

import {
    createAccount,
    loginUser,
    modifyPassword,
    refreshUserAccessToken,
    sendPasswordResetEmail,
    validationEmailCode,
} from "../services/auth.service";
import catchErrors from "../utils/catchErrors";
import {
    clearAuthCookies,
    getAccessTokenCookieOptions,
    getRefreshTokenCookieOptions,
    setAuthCookies,
} from "../utils/cookies";
import { verifyToken } from "../utils/jwt";

import { prisma } from "@/lib/prisma";
import {
    emailSchema,
    loginSchema,
    registerSchema,
    resetPasswordSchema,
    verificationCodeSchema,
} from "@/schemas/auth.Schemas";
import appAssert from "../utils/appAssert";

export const register = catchErrors(async (req, res) => {
    const request = registerSchema.parse({
        ...req.body,
        userAgent: req.headers["user-agent"],
    });
    const { user, accessToken, refreshToken } = await createAccount(request);
    return res.status(CREATED).json(user);
});

export const login = catchErrors(async (req, res) => {
    const request = loginSchema.parse({
        ...req.body,
        userAgent: req.headers["user-agent"],
    });
    const { accessToken, refreshToken } = await loginUser(request);

    return setAuthCookies({ res, accessToken, refreshToken }).status(OK).json({
        message: "Login sucessful",
    });
});
export const refresh = catchErrors(async (req, res) => {
    console.log(req.cookies.refreshToken);
    const refreshToken = req.cookies.refreshToken as string | undefined;
    appAssert(refreshToken, UNAUTHORIZED, "Missing refresh token");

    const { accessToken, newRefreshToken } =
        await refreshUserAccessToken(refreshToken);

    if (newRefreshToken) {
        res.cookie(
            "refreshToken",
            newRefreshToken,
            getRefreshTokenCookieOptions(),
        );
    }

    return res
        .status(OK)
        .cookie("accessToken", accessToken, getAccessTokenCookieOptions())
        .json({
            message: "Access token refreshed",
        });
});

export const logout = catchErrors(async (req, res) => {
    const accessToken = req.cookies.accessToken as string | undefined;
    const { payload } = verifyToken(accessToken || "");

    if (payload) {
        await prisma.session.delete({
            where: {
                id: payload.sessionId,
            },
        });
    }

    return clearAuthCookies(res).status(OK).json({
        message: "Logout sucessfull",
    });
});

export const verifyEmail = catchErrors(async (req, res) => {
    console.log(req.params.code);
    const verificationCode = verificationCodeSchema.parse(req.params.code);

    await validationEmailCode(verificationCode);

    return res.status(OK).json({
        message: "Email was sucessfully verified",
    });
});

export const sendPassword = catchErrors(async (req, res) => {
    const email = emailSchema.parse(req.body.email);

    await sendPasswordResetEmail(email);

    return res.status(OK).json({
        message: "Password reset email sent",
    });
});

export const resetPassword = catchErrors(async (req, res) => {
    const request = resetPasswordSchema.parse(req.body);

    await modifyPassword(request);

    return clearAuthCookies(res)
        .status(OK)
        .json({ message: "Password was reset successfully" });
});
