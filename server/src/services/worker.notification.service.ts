import { prisma } from "@/lib/prisma";
import { FRONTENDURL } from "@/constants/env";
import { getWorkerLifecycleCreatedTemplate } from "@/utils/emailTemplates";
import { sendMail } from "@/utils/sendMail";

export const notifyEmployeesAboutWorkerCreated = async ({
    workerName,
    lifecycleType,
}: {
    workerName: string;
    lifecycleType: string;
}) => {
    const employees = await prisma.user.findMany({
        where: {
            user_permission: "MITARBEITER",
        },
        select: {
            email: true,
        },
    });

    if (employees.length === 0) {
        return { sent: 0, failed: 0 };
    }

    const workerLifecycleUrl = `${FRONTENDURL.replace(/\/$/, "")}/worker-lifycycle`;

    const template = getWorkerLifecycleCreatedTemplate({
        workerName,
        lifecycleType,
        actionUrl: workerLifecycleUrl,
    });

    const results = await Promise.allSettled(
        employees.map(({ email }) =>
            sendMail({
                to: email,
                ...template,
            }),
        ),
    );

    const sent = results.filter((result) => result.status === "fulfilled").length;
    const failed = results.length - sent;

    return { sent, failed };
};
