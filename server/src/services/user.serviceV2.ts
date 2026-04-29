import { prisma } from "@/lib/prisma";
import { CONFLICT } from "@/constants/http";
import appAssert from "@/utils/appAssert";
import { UpdateProfileInformationInput } from "@/schemas/user.schemas";

export const queryUser = async (id: string) => {
    const user = await prisma.user.findUnique({
        where: { id },
        omit: { passwordHash: true },
    });
    return user;
};

type FileData = {
    cloud_url: string;
};

export const getChef = async (id: string) => {
    const user = await prisma.user.findUnique({
        where: {
            id: id,
        },
        omit: {
            password: true,
        },
    });

    return user;
};

export const createDescription = async (
    description: string,
    owner: string,
    template_type: "ONBOARDING" | "OFFBOARDING",
) => {
    const newDescription = await prisma.form_fields.create({
        data: {
            description: description,
            owner: owner,
            template_type: template_type,
        },
    });
    return newDescription;
};

type fileData = {
    cloud_url: string;
};

export const insertProfilePhoto = async (file: FileData, id: string) => {
    return await prisma.user.update({
        where: { id },
        data: { avatarUrl: file.cloud_url },
        select: {
            avatarUrl: true,
            id: true,
        },
    });
};

export const queryProfilePhoto = async (id: string) => {
    return await prisma.user.findUnique({
        where: { id },
        select: { avatarUrl: true },
    });
};

export const updateProfileInformation = async (
    userId: string,
    data: UpdateProfileInformationInput,
) => {
    const normalizedEmail = data.email.trim().toLowerCase();

    const existingUser = await prisma.user.findUnique({
        where: { email: normalizedEmail },
        select: { id: true },
    });

    appAssert(
        !existingUser || existingUser.id === userId,
        CONFLICT,
        "Email already in use",
    );

    return prisma.user.update({
        where: { id: userId },
        data: {
            displayName: data.displayName.trim(),
            firstName: data.firstName.trim(),
            lastName: data.lastName.trim(),
            email: normalizedEmail,
        },
        omit: { passwordHash: true },
    });
};
