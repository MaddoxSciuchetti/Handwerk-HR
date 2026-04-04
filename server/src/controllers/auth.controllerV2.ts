import { prisma } from "@/lib/prisma";
import {
    emailSchema,
    loginSchema,
    registerOrgSchema,
    registerSchema,
    resetPasswordSchema,
    verificationCodeSchema,
} from "@/schemas/auth.schemas";
import { CREATED, OK, UNAUTHORIZED } from "../constants/http";
import {
    createAccount,
    loginUser,
    modifyPassword,
    refreshUserAccessToken,
    registerOrgAccount,
    sendPasswordResetEmail,
    validationEmailCode,
} from "../services/auth.serviceV2";
import appAssert from "../utils/appAssert";
import catchErrors from "../utils/catchErrors";
import {
    clearAuthCookies,
    getAccessTokenCookieOptions,
    getRefreshTokenCookieOptions,
    setAuthCookies,
} from "../utils/cookies";
import { verifyToken } from "../utils/jwt";

export const register = catchErrors(async (req, res) => {
    const request = registerSchema.parse({
        ...req.body,
        userAgent: req.headers["user-agent"],
        ipAddress: req.ip,
    });
    const { user, accessToken, refreshToken } = await createAccount(request);
    return setAuthCookies({ res, accessToken, refreshToken })
        .status(CREATED)
        .json(user);
});

export const registerOrg = catchErrors(async (req, res) => {
    console.log("HELLO TEST");
    const request = registerOrgSchema.parse({
        ...req.body,
        userAgent: req.headers["user-agent"],
        ipAddress: req.ip,
    });
    console.log("REQ ID");
    console.log(request);
    const { user, organization, accessToken, refreshToken } =
        await registerOrgAccount(request);
    console.log("ORG ID");
    console.log(organization.id);
    return setAuthCookies({ res, accessToken, refreshToken })
        .status(CREATED)
        .json({ user, organization });
});

export const login = catchErrors(async (req, res) => {
    const request = loginSchema.parse({
        ...req.body,
        userAgent: req.headers["user-agent"],
        ipAddress: req.ip,
    });
    const { accessToken, refreshToken } = await loginUser(request);
    return setAuthCookies({ res, accessToken, refreshToken })
        .status(OK)
        .json({ message: "Login successful" });
});

export const refresh = catchErrors(async (req, res) => {
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
        .json({ message: "Access token refreshed" });
});

export const logout = catchErrors(async (req, res) => {
    const accessToken = req.cookies.accessToken as string | undefined;
    const { payload } = verifyToken(accessToken || "");

    if (payload) {
        await prisma.refreshToken.updateMany({
            where: {
                id: payload.tokenId,
                revokedAt: null,
            },
            data: { revokedAt: new Date() },
        });
    }

    return clearAuthCookies(res)
        .status(OK)
        .json({ message: "Logout successful" });
});

export const verifyEmail = catchErrors(async (req, res) => {
    const verificationCode = verificationCodeSchema.parse(req.params.code);
    await validationEmailCode(verificationCode);
    return res.status(OK).json({ message: "Email was successfully verified" });
});

export const sendPassword = catchErrors(async (req, res) => {
    const email = emailSchema.parse(req.body.email);
    await sendPasswordResetEmail(email);
    return res.status(OK).json({ message: "Password reset email sent" });
});

export const resetPassword = catchErrors(async (req, res) => {
    const request = resetPasswordSchema.parse(req.body);
    await modifyPassword(request);
    return clearAuthCookies(res)
        .status(OK)
        .json({ message: "Password was reset successfully" });
});
