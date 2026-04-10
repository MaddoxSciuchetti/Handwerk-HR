import { prisma } from "@/lib/prisma";

export const queryUser = async (id: string) => {
    const user = await prisma.newUser.findUnique({
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
    return await prisma.newUser.update({
        where: { id },
        data: { avatarUrl: file.cloud_url },
        select: {
            avatarUrl: true,
            id: true,
        },
    });
};

export const queryProfilePhoto = async (id: string) => {
    return await prisma.newUser.findUnique({
        where: { id },
        select: { avatarUrl: true },
    });
};
