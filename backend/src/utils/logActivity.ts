import ActivityModel, { ActivityAction } from "../models/activity.model";

export const logActivity = async (
    workspaceId: string,
    actorId: string,
    action: ActivityAction,
    entityType: "task" | "project" | "member" | "workspace",
    entityName: string,
    metadata?: Record<string, unknown>
) => {
    try {
        await ActivityModel.create({
            workspaceId,
            actorId,
            action,
            entityType,
            entityName,
            metadata: metadata || {},
        });
    } catch (e) {
        console.error("[Activity] Failed to log activity:", e);
    }
};
