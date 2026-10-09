import { RESEND_WEBHOOK_SECRET } from "@/constants/env";
import resend from "@/config/resend";
import { ingestResendContractReply } from "@/services/signedContractReturn.service";
import type { Request, Response } from "express";

export async function resendInboundHandler(req: Request, res: Response) {
    try {
        const payload = Buffer.isBuffer(req.body)
            ? req.body.toString("utf8")
            : JSON.stringify(req.body);
        const event = RESEND_WEBHOOK_SECRET
            ? resend.webhooks.verify({
                  payload,
                  headers: {
                      id: header(req, "svix-id"),
                      timestamp: header(req, "svix-timestamp"),
                      signature: header(req, "svix-signature"),
                  },
                  webhookSecret: RESEND_WEBHOOK_SECRET,
              })
            : (JSON.parse(payload) as { type?: string; data?: unknown });

        if (event.type === "email.received") {
            const data = event.data as { email_id?: string; subject?: string };
            if (!data.email_id) return res.json({ received: true });
            await ingestResendContractReply({
                subject: data.subject ?? "",
                emailId: data.email_id,
            });
        }

        res.json({ received: true });
    } catch (error) {
        console.error("Resend inbound webhook failed", error);
        res.status(400).json({ received: false });
    }
}

function header(req: Request, name: string) {
    const value = req.headers[name];
    if (typeof value !== "string" || value.length === 0) {
        throw new Error(`Missing ${name} header`);
    }
    return value;
}
