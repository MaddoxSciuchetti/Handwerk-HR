import {
    createTask,
    deleteTasks,
    fetchTaskHistory,
    fetchTasks,
    updateTask,
    upsertTaskComment,
} from "@/controllers/task.controller";
import { Router } from "express";

export const taskRoutes = Router();

taskRoutes.post("/", createTask);
taskRoutes.get("/", fetchTasks);
taskRoutes.get("/:id/history", fetchTaskHistory);
taskRoutes.post("/:id/comments", upsertTaskComment);
taskRoutes.patch("/:id", updateTask);
taskRoutes.delete("/", deleteTasks);
