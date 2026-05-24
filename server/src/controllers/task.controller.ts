import { CREATED, OK } from "@/constants/http";
import {
    createTaskInOrg,
    deleteTasksInOrg,
    getTaskHistoryInOrg,
    queryTasks,
    updateTaskInOrg,
    upsertIssueCommentInOrg,
} from "@/services/tasks.service";
import catchErrors from "@/utils/catchErrors";

export const fetchTasks = catchErrors(async (req, res) => {
    const orgId = req.orgId;
    const tasks = await queryTasks(orgId);
    return res.status(OK).json(tasks);
});

export const createTask = catchErrors(async (req, res) => {
    const orgId = req.orgId;
    const userId = req.userId;
    const result = await createTaskInOrg(orgId, userId);
    return res.status(CREATED).json(result);
});

export const updateTask = catchErrors(async (req, res) => {
    const orgId = req.orgId;
    const userId = req.userId;
    const id = String(req.params.id);
    const result = await updateTaskInOrg(orgId, userId, id, req.body);
    return res.status(OK).json(result);
});

export const fetchTaskHistory = catchErrors(async (req, res) => {
    const orgId = req.orgId;
    const id = String(req.params.id);
    const history = await getTaskHistoryInOrg(orgId, id);
    return res.status(OK).json(history);
});

export const upsertTaskComment = catchErrors(async (req, res) => {
    const orgId = req.orgId;
    const userId = req.userId;
    const issueId = String(req.params.id);
    const raw = req.body as { body?: unknown; commentId?: unknown };
    const body =
        typeof raw.body === "string" ? raw.body : String(raw.body ?? "");
    const commentId =
        typeof raw.commentId === "string" && raw.commentId.length > 0
            ? raw.commentId
            : null;
    const result = await upsertIssueCommentInOrg(orgId, userId, issueId, {
        body,
        commentId,
    });
    return res.status(OK).json(result);
});

export const deleteTasks = catchErrors(async (req, res) => {
    const orgId = req.orgId;
    const ids = Array.isArray(req.body?.ids)
        ? (req.body.ids as unknown[]).filter(
              (id): id is string => typeof id === "string",
          )
        : [];
    const result = await deleteTasksInOrg(orgId, ids);
    return res.status(OK).json(result);
});
