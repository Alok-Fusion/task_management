import { Router } from "express";
import {
    getWorkspaceActivityController,
    getWorkspaceHealthController,
} from "../controllers/analytics.controller";

const analyticsRoutes = Router();

analyticsRoutes.get("/workspace/:workspaceId/activity", getWorkspaceActivityController);
analyticsRoutes.get("/workspace/:workspaceId/health", getWorkspaceHealthController);

export default analyticsRoutes;
