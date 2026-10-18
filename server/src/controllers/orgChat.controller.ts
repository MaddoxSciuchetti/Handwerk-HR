import { CREATED, OK } from "@/constants/http";
import {
    listOrgChatMessages,
    postOrgChatMessage,
} from "@/services/orgChat";
import catchErrors from "@/utils/catchErrors";

export const fetchOrgChat = catchErrors(async (req, res) => {
    const messages = await listOrgChatMessages(req.orgId);
    return res.status(OK).json(messages);
});

export const createOrgChatMessage = catchErrors(async (req, res) => {
    const raw = req.body as { body?: unknown; mentionUserIds?: unknown };
    const body = typeof raw.body === "string" ? raw.body : String(raw.body ?? "");
    const mentionUserIds = Array.isArray(raw.mentionUserIds)
        ? raw.mentionUserIds.filter(
              (id): id is string => typeof id === "string" && id.length > 0,
          )
        : [];
    const result = await postOrgChatMessage(req.orgId, req.userId, {
        body,
        mentionUserIds,
    });
    return res.status(CREATED).json(result);
});
