type SentEmailRecord = {
    to: string;
    subject: string;
    text: string;
    html: string;
    providerId?: string;
    createdAt: string;
};

const sentEmails: SentEmailRecord[] = [];

const isTestLikeEnvironment = () =>
    process.env.NODE_ENV === "test" || process.env.NODE_ENV === "development";

export const recordSentEmail = (email: Omit<SentEmailRecord, "createdAt">) => {
    if (!isTestLikeEnvironment()) {
        return;
    }

    sentEmails.push({
        ...email,
        createdAt: new Date().toISOString(),
    });
};

export const getSentEmails = (recipient?: string) => {
    if (!recipient) {
        return [...sentEmails];
    }

    const normalizedRecipient = recipient.trim().toLowerCase();
    return sentEmails.filter(
        (email) => email.to.trim().toLowerCase() === normalizedRecipient,
    );
};

export const clearSentEmails = (recipient?: string) => {
    if (!recipient) {
        sentEmails.length = 0;
        return;
    }

    const normalizedRecipient = recipient.trim().toLowerCase();
    for (let index = sentEmails.length - 1; index >= 0; index -= 1) {
        if (sentEmails[index].to.trim().toLowerCase() === normalizedRecipient) {
            sentEmails.splice(index, 1);
        }
    }
};