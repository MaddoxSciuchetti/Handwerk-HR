import { BAD_REQUEST, NOT_FOUND } from "@/constants/http";
import { prisma } from "@/lib/prisma";
import appAssert from "@/utils/appAssert";
import { sendMail } from "@/utils/sendMail";
import { microsoft365LicenseAvailability } from "./licenses";

export async function pingMicrosoftLicenseAdmin(organizationId: string, engagementId: string) {
    const engagement = await prisma.workerEngagement.findFirst({
        where: { id: engagementId, organizationId, worker: { organizationId } },
        select: { worker: { select: { firstName: true, lastName: true } } },
    });
    appAssert(engagement, NOT_FOUND, "Engagement nicht gefunden.");
    const licenses = await microsoft365LicenseAvailability(organizationId);
    appAssert(!licenses.error && licenses.available === 0, BAD_REQUEST,
        licenses.error || "Es sind noch Microsoft-Lizenzen verfügbar.");
    const admins = await prisma.organizationMember.findMany({
        where: {
            organizationId,
            membershipRole: "admin",
            status: "active",
            user: { status: "active" },
        },
        select: { user: { select: { email: true } } },
    });
    const recipients = [...new Set(admins.map(({ user }) => user.email.trim()).filter(Boolean))];
    appAssert(recipients.length, BAD_REQUEST, "Keine Administration mit E-Mail-Adresse gefunden.");
    const name = `${engagement.worker.firstName} ${engagement.worker.lastName}`.trim();
    const text = `Hallo,\n\nfür ${name} wird eine neue Microsoft-365-Lizenz benötigt. Es sind keine freien Lizenzen mehr verfügbar.\n\nBitte eine weitere Lizenz bereitstellen.\nEngagement: ${engagementId}`;
    const html = `<p>${text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\n/g, "<br>")}</p>`;
    for (const to of recipients) {
        const sent = await sendMail({
            organizationId, to, subject: `Microsoft-365-Lizenz benötigt: ${name}`, text, html,
        });
        appAssert(!sent.error && sent.data?.id, BAD_REQUEST,
            "E-Mail konnte nicht an die Administration gesendet werden. Bitte erneut versuchen.");
    }
}
