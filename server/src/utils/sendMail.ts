import resend from "../config/resend";
import { EMAIL_SENDER, NODE_ENV } from "../constants/env";
import { recordSentEmail } from "./testEmailOutbox";

type Params = {
    to: string;
    subject: string;
    text: string;
    html: string;
};

const getFromEmail = () => EMAIL_SENDER;

const getToEmail = (to: string) => (NODE_ENV === "development" ? to : to);

export const sendMail = async ({ to, subject, text, html }: Params) => {
    const response = await resend.emails.send({
        from: getFromEmail(),
        to: getToEmail(to),
        subject,
        text,
        html,
    });
    recordSentEmail({
        to: getToEmail(to),
        subject,
        text,
        html,
        providerId: response.data?.id,
    });

    return response;
};
