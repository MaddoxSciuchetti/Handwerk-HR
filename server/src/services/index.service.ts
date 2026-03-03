import { INTERNAL_SERVER_ERROR } from "../constants/http";
import appAssert from "../utils/appAssert";
import { getFormReminderTemplate } from "../utils/emailTemplates";
import { sendMail } from "../utils/sendMail";

export const sendEmployeeEmail = async (email: string) => {
    const { data, error } = await sendMail({
        to: email,
        ...getFormReminderTemplate(),
    });
    appAssert(
        data?.id,
        INTERNAL_SERVER_ERROR,
        `${error?.name} - ${error?.message}`,
    );

    return {
        emailId: data.id,
    };
};
