import resend from "../config/resend";
import { EMAIL_SENDER, NODE_ENV } from "../constants/env";
const getFromEmail = () => NODE_ENV === "development" ? "onboarding@resend.dev" : EMAIL_SENDER;
const getToEmail = (to) => (NODE_ENV === "development" ? to : to);
export const sendMail = async ({ to, subject, text, html }) => await resend.emails.send({
    from: getFromEmail(),
    to: getToEmail(to),
    subject,
    text,
    html,
});
