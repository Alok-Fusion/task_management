import mongoose, { Document, Schema } from "mongoose";

export type ActivityAction =
    | "task_created"
    | "task_updated"
    | "task_deleted"
    | "task_status_changed"
    | "project_created"
    | "project_updated"
    | "project_deleted"
    | "member_joined"
    | "member_role_changed"
    | "invite_code_reset"
    | "workspace_updated";

export interface ActivityDocument extends Document {
    workspaceId: mongoose.Types.ObjectId;
    actorId: mongoose.Types.ObjectId;
    action: ActivityAction;
    entityType: "task" | "project" | "member" | "workspace";
    entityName: string;
    metadata?: Record<string, unknown>;
    createdAt: Date;
}

const activitySchema = new Schema<ActivityDocument>(
    {
        workspaceId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Workspace",
            required: true,
            index: true,
        },
        actorId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        action: {
            type: String,
            required: true,
            enum: [
                "task_created",
                "task_updated",
                "task_deleted",
                "task_status_changed",
                "project_created",
                "project_updated",
                "project_deleted",
                "member_joined",
                "member_role_changed",
                "invite_code_reset",
                "workspace_updated",
            ],
        },
        entityType: {
            type: String,
            required: true,
            enum: ["task", "project", "member", "workspace"],
        },
        entityName: { type: String, required: true },
        metadata: { type: Schema.Types.Mixed, default: {} },
    },
    { timestamps: { createdAt: true, updatedAt: false } }
);

// Auto-delete activities older than 90 days
activitySchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 90 });

const ActivityModel = mongoose.model<ActivityDocument>("Activity", activitySchema);
export default ActivityModel;
