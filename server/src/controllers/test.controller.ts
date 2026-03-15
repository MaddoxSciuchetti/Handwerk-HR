import { prisma } from "@/lib/prisma";
import catchErrors from "@/utils/catchErrors";
import { clearSentEmails, getSentEmails } from "@/utils/testEmailOutbox";

export const deleteTestEmail = catchErrors(async (req, res) => {
    const { email } = req.body;
    console.log(`Attempting to delete test email: ${email}`);

    await prisma.user.delete({
        where: { email },
    });

    return res.status(200).json({ message: "Test email deleted" });
});

export const getTestEmails = catchErrors(async (req, res) => {
    const recipient =
        typeof req.query.recipient === "string"
            ? req.query.recipient
            : undefined;

    return res.status(200).json({ emails: getSentEmails(recipient) });
});

export const clearTestEmails = catchErrors(async (req, res) => {
    const recipient =
        typeof req.body.email === "string" ? req.body.email : undefined;

    clearSentEmails(recipient);

    return res.status(200).json({ message: "Test emails cleared" });
});
