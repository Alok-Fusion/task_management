import { Request, Response } from "express";
import { HTTPSTATUS } from "../config/http.config";
import { Permissions } from "../enums/role.enum";
import { asyncHandler } from "../middlewares/asyncHandler.middleware";
import ActivityModel from "../models/activity.model";
import MemberModel from "../models/member.model";
import TaskModel from "../models/task.model";
import WorkspaceModel from "../models/workspace.model";
import { getMemberRoleInWorkspace } from "../services/member.service";
import { burnoutAlertTemplate } from "../utils/emailTemplates";
import { roleGuard } from "../utils/roleGuard";
import { sendEmail } from "../utils/sendEmail";
import { workspaceIdSchema } from "../validation/workspace.validation";

/* ───── Activity Feed ───── */
export const getWorkspaceActivityController = asyncHandler(
    async (req: Request, res: Response) => {
        const workspaceId = workspaceIdSchema.parse(req.params.workspaceId);
        const userId = req.user?._id;
        const limit = Math.min(parseInt(req.query.limit as string) || 30, 100);
        const page = parseInt(req.query.page as string) || 1;
        const skip = (page - 1) * limit;

        const { role } = await getMemberRoleInWorkspace(userId, workspaceId);
        roleGuard(role, [Permissions.VIEW_ONLY]);

        const [activities, total] = await Promise.all([
            ActivityModel.find({ workspaceId })
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .populate("actorId", "name profilePicture email")
                .lean(),
            ActivityModel.countDocuments({ workspaceId }),
        ]);

        return res.status(HTTPSTATUS.OK).json({
            message: "Activity fetched successfully",
            activities,
            pagination: { total, page, limit, pages: Math.ceil(total / limit) },
        });
    }
);

/* ───── Team Burnout Radar ───── */
const ALERT_COOLDOWN_MS = 24 * 60 * 60 * 1000; // 24 hours
const lastAlertSent: Record<string, number> = {}; // memberId -> timestamp

const computeHealthScore = (
    ownedTasks: number,
    overdueTasks: number,
    highPriorityOpen: number,
    avgWorkload: number
): number => {
    if (ownedTasks === 0) return 100;

    let score = 100;
    score -= overdueTasks * 15;          // -15 per overdue task
    score -= highPriorityOpen * 8;        // -8 per high-priority open task
    const loadRatio = ownedTasks / Math.max(avgWorkload, 1);
    if (loadRatio > 1.5) score -= 20;    // significantly above average workload
    else if (loadRatio > 1.2) score -= 10;

    return Math.max(0, Math.min(100, Math.round(score)));
};

export const getWorkspaceHealthController = asyncHandler(
    async (req: Request, res: Response) => {
        const workspaceId = workspaceIdSchema.parse(req.params.workspaceId);
        const userId = req.user?._id;
        const now = Date.now();

        const { role } = await getMemberRoleInWorkspace(userId, workspaceId);
        roleGuard(role, [Permissions.VIEW_ONLY]);

        // Fetch all members
        const members = await MemberModel.find({ workspaceId })
            .populate("userId", "name email profilePicture")
            .populate("role", "name")
            .lean();

        const memberIds = members.map((m) => (m.userId as any)._id);

        // Task stats per member in a single aggregation
        const taskStats = await TaskModel.aggregate([
            { $match: { workspace: workspaceId, assignedTo: { $in: memberIds } } },
            {
                $group: {
                    _id: "$assignedTo",
                    totalOpen: {
                        $sum: { $cond: [{ $ne: ["$status", "DONE"] }, 1, 0] },
                    },
                    overdue: {
                        $sum: {
                            $cond: [
                                {
                                    $and: [
                                        { $ne: ["$status", "DONE"] },
                                        { $lt: ["$dueDate", new Date()] },
                                    ],
                                },
                                1,
                                0,
                            ],
                        },
                    },
                    highPriorityOpen: {
                        $sum: {
                            $cond: [
                                {
                                    $and: [
                                        { $eq: ["$priority", "HIGH"] },
                                        { $ne: ["$status", "DONE"] },
                                    ],
                                },
                                1,
                                0,
                            ],
                        },
                    },
                },
            },
        ]);

        const statsMap: Record<string, { totalOpen: number; overdue: number; highPriorityOpen: number }> =
            {};
        for (const s of taskStats) {
            statsMap[s._id.toString()] = s;
        }

        const totalOpen = taskStats.reduce((a, s) => a + s.totalOpen, 0);
        const avgWorkload = members.length > 0 ? totalOpen / members.length : 0;

        const workspace = await WorkspaceModel.findById(workspaceId).select("name owner");

        const healthScores = await Promise.all(
            members.map(async (m) => {
                const user = m.userId as any;
                const uid = user._id.toString();
                const stats = statsMap[uid] || { totalOpen: 0, overdue: 0, highPriorityOpen: 0 };
                const score = computeHealthScore(
                    stats.totalOpen,
                    stats.overdue,
                    stats.highPriorityOpen,
                    avgWorkload
                );

                const status =
                    score >= 80 ? "healthy" : score >= 50 ? "at_risk" : "overloaded";

                // Fire burnout alert email if overloaded and cooldown passed
                if (status === "overloaded" && user.email) {
                    const lastSent = lastAlertSent[uid] || 0;
                    if (now - lastSent > ALERT_COOLDOWN_MS) {
                        lastAlertSent[uid] = now;
                        sendEmail(
                            user.email,
                            `⚠️ Workload Alert: You may be overloaded`,
                            burnoutAlertTemplate(
                                user.name,
                                workspace?.name || "your workspace",
                                stats.totalOpen,
                                stats.overdue,
                                stats.highPriorityOpen,
                                score
                            )
                        );
                    }
                }

                return {
                    memberId: uid,
                    name: user.name,
                    email: user.email,
                    profilePicture: user.profilePicture,
                    role: (m.role as any)?.name,
                    healthScore: score,
                    status,
                    stats: {
                        totalOpen: stats.totalOpen,
                        overdue: stats.overdue,
                        highPriorityOpen: stats.highPriorityOpen,
                    },
                };
            })
        );

        healthScores.sort((a, b) => a.healthScore - b.healthScore);

        return res.status(HTTPSTATUS.OK).json({
            message: "Health scores computed",
            health: healthScores,
            teamAvgScore:
                healthScores.length > 0
                    ? Math.round(
                        healthScores.reduce((a, h) => a + h.healthScore, 0) /
                        healthScores.length
                    )
                    : 100,
        });
    }
);
