import {
    createTask,
    deleteTasks,
    fetchTasks,
    updateTask,
} from "@/controllers/task.controller";
import { Router } from "express";

export const taskRoutes = Router();

taskRoutes.post("/", createTask);
taskRoutes.get("/", fetchTasks);
taskRoutes.patch("/:id", updateTask);
taskRoutes.delete("/", deleteTasks);
