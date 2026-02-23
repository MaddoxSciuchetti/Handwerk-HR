import {
    APP_ORIGIN,
    FRONTENDURL,
    JWT_REFRESH_SECRET,
    JWT_SECRET,
} from "../constants/env";
import {
    CONFLICT,
    INTERNAL_SERVER_ERROR,
    NOT_FOUND,
    TOO_MANY_REQUESTS,
    UNAUTHORIZED,
} from "../constants/http";
import VerificationCodeType from "../constants/verificationCodeTypes";
import appAssert from "../utils/appAssert";
import {
    fiveMinutesAgo,
    ONE_DAY_MS,
    oneHourFromNow,
    oneYearFromNow,
    thirtyDaysFromNow,
} from "../utils/date";
import jwt from "jsonwebtoken";
import {
    RefreshTokenPayload,
    refreshTokenSignOptions,
    signToken,
    verifyToken,
} from "../utils/jwt";
import {
    getPasswordResetTemplate,
    getVerifyEmailTemplate,
} from "../utils/emailTemplates";
import { sendMail } from "../utils/sendMail";
import { hashValue } from "../utils/bcrypt";
import { prisma } from "@/lib/prisma";
import { userInfo } from "node:os";
import bcrypt from "bcrypt";
import AppErrorCode from "../constants/appErrorCode";

export type createAccountParams = {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    userAgent?: string;
};

export const createAccount = async (data: createAccountParams) => {
    //verify existing user does not exists

    console.log("mitarbeiter daten");
    console.log(data);

    const existingUser = await prisma.user.findUnique({
        where: {
            email: data.email.toLocaleLowerCase(),
        },
    });

    appAssert(!existingUser, CONFLICT, "Email already in use");

    // create user

    const hashedpassword = await hashValue(data.password);

    const user = await prisma.user.create({
        data: {
            email: data.email.toLocaleLowerCase(),
            password: hashedpassword,
            vorname: data.firstName,
            nachname: data.lastName,
            cloud_url:
                "https://bsb-file-storage.s3.eu-north-1.amazonaws.com/upload/profilepic/cmknti1f800028tmmhf5u5627/1771746653414-",
        },
        omit: {
            password: true,
        },
    });

    const userId = user.id;

    // create verification code

    console.log("just before creating verification code");
    const verificationCode = await prisma.verificationCode.create({
        data: {
            userId,
            type: VerificationCodeType.EmailVerification,
            expiresAt: oneYearFromNow(),
        },
    });

    // send the verification email

    const url = `${FRONTENDURL}/email/verify/${verificationCode.id}`;

    // integrate resend
    const { error } = await sendMail({
        to: user.email,
        ...getVerifyEmailTemplate(url, data.password),
    });

    if (error) {
        console.log(error);
    }

    // create the session

    const session = await prisma.session.create({
        data: {
            userId,
            userAgent: data.userAgent,
        },
    });

    // sign the acess token and refresh token
    const refreshToken = signToken(
        {
            sessionId: session.id,
        },
        refreshTokenSignOptions,
    );
    console.log(refreshToken);

    const accessToken = signToken({
        userId,
        sessionId: session.id,
    });

    console.log(accessToken);

    // return user & tokens

    return {
        user: user,
        accessToken,
        refreshToken,
    };
};

export type LoginParams = {
    email: string;
    password: string;
    userAgent?: string;
};

export const loginUser = async ({
    email,
    password,
    userAgent,
}: LoginParams) => {
    // get the user by email
    const user = await prisma.user.findUnique({
        where: {
            email: email,
        },
    });

    console.log(user);

    console.log(user?.password);
    appAssert(user, UNAUTHORIZED, "Invalid email or password");
    const isinValid = await bcrypt.compare(password, user.password);
    appAssert(isinValid, UNAUTHORIZED, "Invalid password");

    const userId = user.id;

    const session = await prisma.session.create({
        data: {
            userId: userId,
            userAgent: userAgent,
        },
    });

    const sessionInfo = {
        sessionId: session.id,
    };
    // sign access token & refresh token

    const refreshToken = signToken(sessionInfo, refreshTokenSignOptions);

    const accessToken = signToken({
        ...sessionInfo,
        userId,
    });
    // return user & tokens
    return {
        user: user,
        accessToken,
        refreshToken,
    };
};

export const refreshUserAccessToken = async (refreshToken: string) => {
    const { payload } = verifyToken<RefreshTokenPayload>(refreshToken, {
        secret: refreshTokenSignOptions.secret,
    });
    console.log(payload);

    appAssert(payload, UNAUTHORIZED, "Invalid refresh token");

    const session = await prisma.session.findUnique({
        where: {
            id: payload.sessionId,
        },
    });
    const now = Date.now();
    appAssert(
        session && session.expiresAt.getTime() > now,
        UNAUTHORIZED,
        "Session expired",
    );

    // refresh the session if it expires in the next 24 hours

    const sessionNeedsRefresh = session.expiresAt.getTime() - now <= ONE_DAY_MS;
    if (sessionNeedsRefresh) {
        await prisma.session.update({
            where: { id: session.id },
            data: {
                expiresAt: thirtyDaysFromNow(),
            },
        });
    }

    const newRefreshToken = sessionNeedsRefresh
        ? signToken(
              {
                  sessionId: session.id,
              },
              refreshTokenSignOptions,
          )
        : undefined;

    const accessToken = signToken({
        userId: session.userId,
        sessionId: session.id,
    });

    return {
        accessToken,
        newRefreshToken,
    };
};

export const verifyEmail = async (code: string) => {
    const validCode = await prisma.verificationCode.findFirst({
        where: {
            id: code,
            type: VerificationCodeType.EmailVerification,
            expiresAt: { gt: new Date() },
        },
    });
    appAssert(validCode, NOT_FOUND, "Invalid or expired verification code");

    const updatedUser = await prisma.user.update({
        where: {
            id: validCode.userId,
        },
        data: {
            verified: true,
        },
        omit: {
            password: true,
        },
    });

    appAssert(updatedUser, INTERNAL_SERVER_ERROR, "Failed to verify email");

    await prisma.verificationCode.delete({
        where: {
            id: validCode.id,
        },
    });
    return {
        user: updatedUser,
    };
};

export const sendPasswordResetEmail = async (email: string) => {
    const user = await prisma.user.findFirst({
        where: {
            email: email,
        },
    });
    appAssert(user, NOT_FOUND, "User not found");

    // check for max password reset requests (2 emails in 5 min)

    const fiveMinAgo = fiveMinutesAgo();
    const count = await prisma.verificationCode.count({
        where: {
            userId: user.id,
            type: VerificationCodeType.PasswordReset,
            createdAt: { gt: fiveMinAgo },
        },
    });

    appAssert(
        count <= 1,
        TOO_MANY_REQUESTS,
        "To many request, please try again later",
    );

    // create verification code

    const expiresAt = oneHourFromNow();
    const verificationCode = await prisma.verificationCode.create({
        data: {
            userId: user.id,
            type: VerificationCodeType.PasswordReset,
            expiresAt: expiresAt,
        },
    });

    // send verifcation email

    const url = `${FRONTENDURL}/password/reset?code=${verificationCode.id}&exp=${expiresAt.getTime()}`;

    // integrate email here too
    const { data, error } = await sendMail({
        to: email,
        ...getPasswordResetTemplate(url),
    });
    appAssert(
        data?.id,
        INTERNAL_SERVER_ERROR,
        `${error?.name} - ${error?.message}`,
    );
    // return success

    return {
        url,
        emailId: data.id,
    };
};

type ResetPasswordParams = {
    password: string;
    verificationCode: string;
};

export const resetPassword = async ({
    password,
    verificationCode,
}: ResetPasswordParams) => {
    const validCode = await prisma.verificationCode.findUnique({
        where: {
            id: verificationCode,
            type: VerificationCodeType.PasswordReset,
            expiresAt: { gt: new Date() },
        },
    });
    appAssert(validCode, NOT_FOUND, "Invalid or expired verification code");
    // get the verication

    const updatedUser = await prisma.user.update({
        where: {
            id: validCode.userId,
        },
        data: {
            password: await hashValue(password),
        },
        omit: {
            password: true,
        },
    });

    appAssert(updatedUser, INTERNAL_SERVER_ERROR, "Failed to reset password");

    // delete code

    await prisma.verificationCode.delete({
        where: {
            id: validCode.id,
        },
    });

    await prisma.session.deleteMany({
        where: {
            userId: updatedUser.id,
        },
    });

    return { user: updatedUser };
};
