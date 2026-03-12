import { prisma } from "@/lib/prisma";
import catchErrors from "@/utils/catchErrors";

export const deleteTestEmail = catchErrors(async (req, res) => {
    const { email } = req.body;
    console.log(`Attempting to delete test email: ${email}`);

    await prisma.user.delete({
        where: { email },
    });

    return res.status(200).json({ message: "Test email deleted" });
});
