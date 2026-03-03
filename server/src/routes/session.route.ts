import { Router } from "express";
import { deleteSession, getSession } from "../controllers/session.controller";

const sessionRoutes = Router();

// prefix / sessions

sessionRoutes.get("/", getSession);
sessionRoutes.delete("/:id", deleteSession);

export default sessionRoutes;
