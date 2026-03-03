import { prisma } from "@/lib/prisma";

export const queryUser = async (id: string) => {
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

export const insertProfilePhoto = async (file: fileData, id: string) => {
    return await prisma.user.update({
        data: {
            cloud_url: file.cloud_url,
        },
        where: {
            id: id,
        },
        select: {
            cloud_url: true,
            id: true,
        },
    });
};

export const queryProfilePhoto = async (id: string) => {
    return await prisma.user.findUnique({
        where: {
            id: id,
        },
        select: {
            cloud_url: true,
        },
    });
};
