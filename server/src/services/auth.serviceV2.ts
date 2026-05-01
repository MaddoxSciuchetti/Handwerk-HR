import { FRONTENDURL } from "@/constants/env";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";

import {
    CONFLICT,
    INTERNAL_SERVER_ERROR,
    NOT_FOUND,
    TOO_MANY_REQUESTS,
    UNAUTHORIZED,
} from "@/constants/http";

import appAssert from "@/utils/appAssert";
import { hashValue } from "@/utils/bcrypt";
import {
    fiveMinutesAgo,
    oneHourFromNow,
    oneYearFromNow,
    thirtyDaysFromNow,
} from "@/utils/date";
import {
    RefreshTokenPayload,
    refreshTokenSignOptions,
    signToken,
    verifyToken,
} from "@/utils/jwt";

import type { RegisterOrgInput } from "@/schemas/auth.schemas";
import {
    getPasswordResetTemplate,
    getVerifyEmailTemplate,
} from "@/utils/emailTemplates";
import { sendMail } from "@/utils/sendMail";
import { generateRawToken, hashToken } from "@/utils/v2/tokenV2";

// ============================================================
// TYPES
// ============================================================

export type CreateAccountParams = {
    firstName: string;
    lastName: string;
    displayName: string;
    email: string;
    password: string;
    confirmPassword: string;
    userAgent?: string;
    ipAddress?: string;
};

export type LoginParams = {
    email: string;
    password: string;
    userAgent?: string;
    ipAddress?: string;
};

type ResetPasswordParams = {
    password: string;
    verificationCode: string;
};

// ============================================================
// INTERNAL HELPER
// ============================================================

const createRefreshTokenRecord = async ({
    userId,
    userAgent,
    ipAddress,
}: {
    userId: string;
    userAgent?: string;
    ipAddress?: string;
}) => {
    const rawToken = generateRawToken();
    const tokenHash = hashToken(rawToken);

    const record = await prisma.refreshToken.create({
        data: {
            userId,
            tokenHash,
            userAgent,
            ipAddress,
            expiresAt: thirtyDaysFromNow(),
        },
    });

    return { rawToken, record };
};

// ============================================================
// CREATE ACCOUNT
// ============================================================

export const createAccount = async (data: CreateAccountParams) => {
    const normalizedEmail = data.email.trim().toLowerCase();

    // verify existing user does not exist
    const existingUser = await prisma.user.findUnique({
        where: { email: normalizedEmail },
    });
    appAssert(!existingUser, CONFLICT, "Email already in use");

    // create user
    const hashedPassword = await hashValue(data.password);

    const user = await prisma.user.create({
        data: {
            email: normalizedEmail,
            passwordHash: hashedPassword,
            firstName: data.firstName,
            lastName: data.lastName,
            displayName: data.displayName,
        },
        omit: { passwordHash: true },
    });

    const userId = user.id;

    // create verification code
    const verificationCode = await prisma.newVerificationCode.create({
        data: {
            userId,
            type: "email_verify",
            expiresAt: oneYearFromNow(),
        },
    });

    // send verification email
    const url = `${FRONTENDURL}/email/verify/${verificationCode.id}`;
    const { error } = await sendMail({
        to: user.email,
        ...getVerifyEmailTemplate(url, data.password),
    });
    if (error) console.log(error);

    // create refresh token record
    const { record } = await createRefreshTokenRecord({
        userId,
        userAgent: data.userAgent,
        ipAddress: data.ipAddress,
    });

    // sign tokens
    const refreshToken = signToken(
        { tokenId: record.id },
        refreshTokenSignOptions,
    );
    const accessToken = signToken({
        userId,
        tokenId: record.id,
    });

    return { user, accessToken, refreshToken };
};

// ============================================================
// REGISTER ORG (multi-step org + user signup)
// ============================================================

export const registerOrgAccount = async (data: RegisterOrgInput) => {
    const normalizedEmail = data.email.trim().toLowerCase();

    const existingUser = await prisma.user.findUnique({
        where: { email: normalizedEmail },
    });
    appAssert(!existingUser, CONFLICT, "Email already in use");

    const hashedPassword = await hashValue(data.password);

    const result = await prisma.$transaction(async (tx) => {
        // 1. Create user
        const user = await tx.user.create({
            data: {
                email: normalizedEmail,
                passwordHash: hashedPassword,
                firstName: data.firstName,
                lastName: data.lastName,
                displayName: data.displayName,
            },
            omit: { passwordHash: true },
        });

        // 2. Generate unique slug from org name
        const baseSlug = data.orgName
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-|-$/g, "");
        const slug = `${baseSlug}-${Math.random().toString(36).slice(2, 8)}`;

        // 3. Create organization
        const organization = await tx.organization.create({
            data: {
                name: data.orgName,
                slug,
                createdByUserId: user.id,
                description: data.orgDescription || null,
                email: data.orgEmail || null,
                phoneNumber: data.orgPhoneNumber || null,
                websiteUrl: data.orgWebsiteUrl || null,
                country: data.orgCountry || null,
                industry: data.orgIndustry || null,
                size: (data.orgSize as any) ?? null,
            },
        });

        // 4. Add user as org admin
        await tx.organizationMember.create({
            data: {
                userId: user.id,
                organizationId: organization.id,
                membershipRole: "admin",
            },
        });

        // 5. Seed default engagement + issue statuses
        await tx.engagementStatus.createMany({
            data: [
                {
                    organizationId: organization.id,
                    name: "Ausstehend",
                    isDefault: true,
                    orderIndex: 0,
                },
                {
                    organizationId: organization.id,
                    name: "In Bearbeitung",
                    isDefault: false,
                    orderIndex: 1,
                },
                {
                    organizationId: organization.id,
                    name: "Abgeschlossen",
                    isDefault: false,
                    orderIndex: 2,
                },
                {
                    organizationId: organization.id,
                    name: "Abgebrochen",
                    isDefault: false,
                    orderIndex: 3,
                },
            ],
        });
        await tx.issueStatus.createMany({
            data: [
                {
                    organizationId: organization.id,
                    name: "Offen",
                    isDefault: true,
                    orderIndex: 0,
                },
                {
                    organizationId: organization.id,
                    name: "In Arbeit",
                    isDefault: false,
                    orderIndex: 1,
                },
                {
                    organizationId: organization.id,
                    name: "Erledigt",
                    isDefault: false,
                    orderIndex: 2,
                },
                {
                    organizationId: organization.id,
                    name: "Abgebrochen",
                    isDefault: false,
                    orderIndex: 3,
                },
            ],
        });

        return { user, organization };
    });

    const userId = result.user.id;

    // Send verification email
    const verificationCode = await prisma.newVerificationCode.create({
        data: {
            userId,
            type: "email_verify",
            expiresAt: oneYearFromNow(),
        },
    });
    const url = `${FRONTENDURL}/email/verify/${verificationCode.id}`;
    const { error } = await sendMail({
        to: result.user.email,
        ...getVerifyEmailTemplate(url, data.password),
    });
    if (error) console.log(error);

    // Create refresh token record
    const { record } = await createRefreshTokenRecord({
        userId,
        userAgent: data.userAgent,
        ipAddress: data.ipAddress,
    });

    const refreshToken = signToken(
        { tokenId: record.id },
        refreshTokenSignOptions,
    );
    const accessToken = signToken({ userId, tokenId: record.id });

    return {
        user: result.user,
        organization: result.organization,
        accessToken,
        refreshToken,
    };
};

// ============================================================
// LOGIN
// ============================================================

export const loginUser = async ({
    email,
    password,
    userAgent,
    ipAddress,
}: LoginParams) => {
    const normalizedEmail = email.trim().toLowerCase();

    // get user by email
    const user = await prisma.user.findUnique({
        where: { email: normalizedEmail },
    });
    appAssert(user, UNAUTHORIZED, "Invalid email or password");

    // verify password
    const isValid = await bcrypt.compare(password, user.passwordHash);
    appAssert(isValid, UNAUTHORIZED, "Invalid email or password");

    const userId = user.id;
    console.log("user found");

    // create refresh token record
    const { record } = await createRefreshTokenRecord({
        userId,
        userAgent,
        ipAddress,
    });

    console.log("user found");

    // sign tokens
    const refreshToken = signToken(
        { tokenId: record.id },
        refreshTokenSignOptions,
    );
    const accessToken = signToken({
        userId,
        tokenId: record.id,
    });

    console.log("user found");

    // strip passwordHash before returning
    const { passwordHash: _, ...safeUser } = user;

    console.log("user found");

    return { user: safeUser, accessToken, refreshToken };
};

// ============================================================
// REFRESH ACCESS TOKEN
// ============================================================

export const refreshUserAccessToken = async (refreshToken: string) => {
    // 1. verify JWT signature
    const { payload } = verifyToken<RefreshTokenPayload>(refreshToken, {
        secret: refreshTokenSignOptions.secret,
    });
    appAssert(payload, UNAUTHORIZED, "Invalid refresh token");

    // 2. find the DB record
    const tokenRecord = await prisma.refreshToken.findUnique({
        where: { id: payload.tokenId },
    });

    const now = Date.now();
    appAssert(
        tokenRecord &&
            !tokenRecord.revokedAt &&
            tokenRecord.expiresAt.getTime() > now,
        UNAUTHORIZED,
        "Refresh token expired or revoked",
    );

    // 3. always rotate — generate new hash, update record, slide expiry
    const newRawToken = generateRawToken();
    const newTokenHash = hashToken(newRawToken);

    const updatedRecord = await prisma.refreshToken.update({
        where: { id: tokenRecord.id },
        data: {
            tokenHash: newTokenHash,
            lastUsedAt: new Date(),
            expiresAt: thirtyDaysFromNow(),
        },
    });

    // 4. sign new tokens
    const newRefreshToken = signToken(
        { tokenId: updatedRecord.id },
        refreshTokenSignOptions,
    );

    const accessToken = signToken({
        userId: tokenRecord.userId,
        tokenId: tokenRecord.id,
    });

    return { accessToken, newRefreshToken };
};

// ============================================================
// VERIFY EMAIL
// ============================================================

export const validationEmailCode = async (code: string) => {
    const validCode = await prisma.newVerificationCode.findFirst({
        where: {
            id: code,
            type: "email_verify",
            expiresAt: { gt: new Date() },
            usedAt: null,
        },
    });
    appAssert(validCode, NOT_FOUND, "Invalid or expired verification code");

    // mark as used instead of deleting
    await prisma.newVerificationCode.update({
        where: { id: validCode.id },
        data: { usedAt: new Date() },
    });

    // verify user
    const updatedUser = await prisma.user.update({
        where: { id: validCode.userId },
        data: { isVerified: true },
        omit: { passwordHash: true },
    });
    appAssert(updatedUser, INTERNAL_SERVER_ERROR, "Failed to verify email");

    return { user: updatedUser };
};

// ============================================================
// SEND PASSWORD RESET EMAIL
// ============================================================

export const sendPasswordResetEmail = async (email: string) => {
    const normalizedEmail = email.trim().toLowerCase();

    const user = await prisma.user.findUnique({
        where: { email: normalizedEmail },
    });
    appAssert(user, NOT_FOUND, "User not found");

    // check for max password reset requests (2 emails in 5 min)
    const count = await prisma.newVerificationCode.count({
        where: {
            userId: user.id,
            type: "password_reset",
            createdAt: { gt: fiveMinutesAgo() },
        },
    });
    appAssert(
        count <= 1,
        TOO_MANY_REQUESTS,
        "Too many requests, please try again later",
    );

    // create verification code
    const expiresAt = oneHourFromNow();
    const verificationCode = await prisma.newVerificationCode.create({
        data: {
            userId: user.id,
            type: "password_reset",
            expiresAt,
        },
    });

    // send email
    const url = `${FRONTENDURL}/password/reset?code=${verificationCode.id}&exp=${expiresAt.getTime()}`;
    const { data, error } = await sendMail({
        to: email,
        ...getPasswordResetTemplate(url),
    });
    appAssert(
        data?.id,
        INTERNAL_SERVER_ERROR,
        `${error?.name} - ${error?.message}`,
    );

    return { url, emailId: data.id };
};

// ============================================================
// RESET PASSWORD
// ============================================================

export const modifyPassword = async ({
    password,
    verificationCode,
}: ResetPasswordParams) => {
    const validCode = await prisma.newVerificationCode.findUnique({
        where: {
            id: verificationCode,
            type: "password_reset",
            expiresAt: { gt: new Date() },
            usedAt: null,
        },
    });
    appAssert(validCode, NOT_FOUND, "Invalid or expired verification code");

    // update password
    const updatedUser = await prisma.user.update({
        where: { id: validCode.userId },
        data: { passwordHash: await hashValue(password) },
        omit: { passwordHash: true },
    });
    appAssert(updatedUser, INTERNAL_SERVER_ERROR, "Failed to reset password");

    // mark code as used instead of deleting
    await prisma.newVerificationCode.update({
        where: { id: validCode.id },
        data: { usedAt: new Date() },
    });

    // revoke ALL active refresh tokens for this user
    await prisma.refreshToken.updateMany({
        where: {
            userId: updatedUser.id,
            revokedAt: null,
        },
        data: { revokedAt: new Date() },
    });

    return { user: updatedUser };
};
