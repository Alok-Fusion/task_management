import { Router } from "express";
import { enhanceTaskController, suggestTasksController } from "../controllers/ai.controller";

const aiRoutes = Router();

aiRoutes.post("/enhance-task", enhanceTaskController);
aiRoutes.post("/suggest-tasks", suggestTasksController);

export default aiRoutes;
