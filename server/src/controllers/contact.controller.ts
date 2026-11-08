import { OK } from "@/constants/http";
import { contactInquirySchema } from "@/schemas/contact.schemas";
import { sendContactInquiry } from "@/services/contactInquiry.service";
import catchErrors from "@/utils/catchErrors";

export const postContactInquiryHandler = catchErrors(async (req, res) => {
    const data = contactInquirySchema.parse(req.body);
    await sendContactInquiry(data);
    return res.status(OK).json({ message: "Anfrage gesendet" });
});
