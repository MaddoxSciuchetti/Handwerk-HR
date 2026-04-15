import { FRONTENDURL } from "@/constants/env";
import { CONFLICT, FORBIDDEN, NOT_FOUND } from "@/constants/http";
import { prisma } from "@/lib/prisma";
import type {
    AcceptInviteInput,
    CreateInviteInput,
} from "@/schemas/invite.schemas";
import appAssert from "@/utils/appAssert";
import { hashValue } from "@/utils/bcrypt";
import { oneYearFromNow, thirtyDaysFromNow } from "@/utils/date";
import {
    getInviteEmailTemplate,
    getVerifyEmailTemplate,
} from "@/utils/emailTemplates";
import { refreshTokenSignOptions, signToken } from "@/utils/jwt";
import { sendMail } from "@/utils/sendMail";
import { generateRawToken, hashToken } from "@/utils/v2/tokenV2";
import { InvitationStatus } from "@prisma/client";

const fortyEightHoursFromNow = () => new Date(Date.now() + 48 * 60 * 60 * 1000);

// Find or lazily create a "Member" role for the org
const ensureMemberRole = async (organizationId: string) => {
    const existing = await prisma.role.findFirst({
        where: { organizationId, name: "Member" },
    });
    if (existing) return existing;
    return prisma.role.create({
        data: { organizationId, name: "Member", isSystem: false },
    });
};

// ─── Create Invite ────────────────────────────────────────────────────────────

export const createInvite = async (
    orgId: string,
    invitedByUserId: string,
    data: CreateInviteInput,
) => {
    const normalizedEmail = data.email.trim().toLowerCase();

    const org = await prisma.organization.findUnique({ where: { id: orgId } });
    appAssert(org, NOT_FOUND, "Organization not found");

    const inviterMembership = await prisma.organizationMember.findFirst({
        where: {
            organizationId: orgId,
            userId: invitedByUserId,
        },
        include: {
            role: {
                select: { name: true },
            },
        },
    });
    appAssert(inviterMembership, FORBIDDEN, "Only organization members can invite");
    appAssert(
        inviterMembership.role.name === "Owner",
        FORBIDDEN,
        "Only organization owners can invite users",
    );

    const existingUser = await prisma.newUser.findUnique({
        where: { email: normalizedEmail },
    });
    appAssert(!existingUser, CONFLICT, "An account with this email already exists");

    const existingMember = await prisma.organizationMember.findFirst({
        where: { organizationId: orgId, user: { email: normalizedEmail } },
    });
    appAssert(
        !existingMember,
        CONFLICT,
        "User is already a member of this organization",
    );

    const existingInvite = await prisma.invitation.findFirst({
        where: {
            organizationId: orgId,
            email: normalizedEmail,
            status: "pending" as any,
        },
    });
    appAssert(
        !existingInvite,
        CONFLICT,
        "An invite has already been sent to this email",
    );

    const role = data.roleId
        ? await prisma.role.findFirst({
              where: { id: data.roleId, organizationId: orgId },
          })
        : await ensureMemberRole(orgId);
    appAssert(role, NOT_FOUND, "Role not found");

    const rawToken = generateRawToken(32);
    const tokenHash = hashToken(rawToken);

    const invite = await prisma.invitation.create({
        data: {
            organizationId: orgId,
            invitedByUserId,
            roleId: role.id,
            email: normalizedEmail,
            tokenHash,
            status: "pending" as any,
            expiresAt: fortyEightHoursFromNow(),
        },
    });

    const inviteUrl = `${FRONTENDURL}/signup?invite=${rawToken}`;
    const { error } = await sendMail({
        to: normalizedEmail,
        ...getInviteEmailTemplate(inviteUrl, org.name),
    });
    if (error) console.error("Failed to send invite email:", error);

    return { invite };
};

// ─── Get Invite Details ───────────────────────────────────────────────────────

export const getInviteByToken = async (rawToken: string) => {
    const tokenHash = hashToken(rawToken);

    const invite = await prisma.invitation.findUnique({
        where: { tokenHash },
        include: { organization: { select: { name: true } } },
    });

    appAssert(invite, NOT_FOUND, "Invalid or expired invite");
    appAssert(
        invite.status === ("pending" as any),
        NOT_FOUND,
        "Invite has already been used",
    );
    appAssert(invite.expiresAt > new Date(), NOT_FOUND, "Invite has expired");

    return { orgName: invite.organization.name, email: invite.email };
};

// ─── Accept Invite ────────────────────────────────────────────────────────────

export const acceptInvite = async (
    rawToken: string,
    data: AcceptInviteInput,
) => {
    const tokenHash = hashToken(rawToken);

    const invite = await prisma.invitation.findUnique({ where: { tokenHash } });

    appAssert(invite, NOT_FOUND, "Invalid or expired invite");
    appAssert(
        invite.status === ("pending" as any),
        CONFLICT,
        "Invite has already been used",
    );
    appAssert(invite.expiresAt > new Date(), NOT_FOUND, "Invite has expired");

    const normalizedEmail = invite.email.toLowerCase();

    const existing = await prisma.newUser.findUnique({
        where: { email: normalizedEmail },
    });
    appAssert(!existing, CONFLICT, "An account with this email already exists");

    const hashedPassword = await hashValue(data.password);

    const user = await prisma.$transaction(async (tx) => {
        const newUser = await tx.newUser.create({
            data: {
                email: normalizedEmail,
                passwordHash: hashedPassword,
                displayName: data.displayName,
                firstName: data.firstName,
                lastName: data.lastName,
            },
            omit: { passwordHash: true },
        });

        await tx.organizationMember.create({
            data: {
                userId: newUser.id,
                organizationId: invite.organizationId,
                roleId: invite.roleId,
            },
        });

        await tx.invitation.update({
            where: { id: invite.id },
            data: {
                status: "accepted" as InvitationStatus,
                acceptedAt: new Date(),
            },
        });

        return newUser;
    });

    // Verification email
    const verificationCode = await prisma.newVerificationCode.create({
        data: {
            userId: user.id,
            type: "email_verify",
            expiresAt: oneYearFromNow(),
        },
    });
    const verifyUrl = `${FRONTENDURL}/email/verify/${verificationCode.id}`;
    const { error } = await sendMail({
        to: normalizedEmail,
        ...getVerifyEmailTemplate(verifyUrl, data.password),
    });
    if (error) console.error("Failed to send verification email:", error);

    // Refresh token
    const rawRefreshToken = generateRawToken();
    const refreshTokenHash = hashToken(rawRefreshToken);
    const tokenRecord = await prisma.refreshToken.create({
        data: {
            userId: user.id,
            tokenHash: refreshTokenHash,
            userAgent: data.userAgent,
            ipAddress: data.ipAddress,
            expiresAt: thirtyDaysFromNow(),
        },
    });

    const refreshToken = signToken(
        { tokenId: tokenRecord.id },
        refreshTokenSignOptions,
    );
    const accessToken = signToken({ userId: user.id, tokenId: tokenRecord.id });

    return {
        user,
        organizationId: invite.organizationId,
        accessToken,
        refreshToken,
    };
};
