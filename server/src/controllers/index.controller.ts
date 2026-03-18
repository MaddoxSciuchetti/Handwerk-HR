import type { Request, Response } from "express-serve-static-core";
import { google } from "googleapis";
import { Readable } from "stream";
import z from "zod";

import { sendEmployeeEmail } from "@/services/index.service";
import { OK } from "../constants/http";

export const historySchemaget = z.object({
    id: z.coerce.number(),
});

export const sendReminder = async (req: Request, res: Response) => {
    const email = req.body.email;
    await sendEmployeeEmail(email);
    return res.status(OK).json({ success: true });
};

const getOAuthClient = () => {
    const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_OAUTH_CLIENT_ID,
        process.env.GOOGLE_OAUTH_CLIENT_SECRET,
        process.env.GOOGLE_OAUTH_REDIRECT_URI,
    );

    oauth2Client.setCredentials({
        refresh_token: process.env.GOOGLE_OAUTH_REFRESH_TOKEN,
    });

    return oauth2Client;
};

export const postFeature = async (req: Request, res: Response) => {
    const { importance, text } = req.body;
    const files = req.files as Express.Multer.File[];

    const fileUrls: string[] = [];

    const auth = getOAuthClient();

    if (files?.length) {
        const drive = google.drive({ version: "v3", auth });

        for (const file of files) {
            const driveResponse = await drive.files.create({
                requestBody: {
                    name: file.originalname,
                    parents: ["1mQBgb6Xzh4vxHKBZ2n18tzyolgRAmqra"],
                },
                media: {
                    mimeType: file.mimetype,
                    body: Readable.from(file.buffer),
                },
                fields: "id",
            });
            fileUrls.push(
                `https://drive.google.com/file/d/${driveResponse.data.id}`,
            );
        }
    }

    const sheets = google.sheets({ version: "v4", auth });
    await sheets.spreadsheets.values.append({
        spreadsheetId: "1oUL_P3L20PIcktjeEFw7phMGu8Es27ioUnRMIjWoqXg",
        range: "Sheet1!A:C",
        valueInputOption: "RAW",
        requestBody: {
            values: [[importance, text, fileUrls.join(", ")]],
        },
    });

    res.json({ success: true });
};
