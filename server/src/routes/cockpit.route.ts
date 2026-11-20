import { getCockpit } from "@/controllers/cockpit.controller";
import { Router } from "express";

const cockpitRoutes = Router();
cockpitRoutes.get("/", getCockpit);

export { cockpitRoutes };
