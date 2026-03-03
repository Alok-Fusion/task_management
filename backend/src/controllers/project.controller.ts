import { Request, Response } from "express";
import { HTTPSTATUS } from "../config/http.config";
import { Permissions } from "../enums/role.enum";
import { asyncHandler } from "../middlewares/asyncHandler.middleware";
import UserModel from "../models/user.model";
import WorkspaceModel from "../models/workspace.model";
import { getMemberRoleInWorkspace } from "../services/member.service";
import {
  createProjectService,
  deleteProjectService,
  getProjectAnalyticsService,
  getProjectByIdAndWorkspaceIdService,
  getProjectsInWorkspaceService,
  updateProjectService,
} from "../services/project.service";
import {
  projectCreatedTemplate,
  projectDeletedTemplate,
  projectUpdatedTemplate,
} from "../utils/emailTemplates";
import { logActivity } from "../utils/logActivity";
import { roleGuard } from "../utils/roleGuard";
import { sendEmail } from "../utils/sendEmail";
import {
  createProjectSchema,
  projectIdSchema,
  updateProjectSchema,
} from "../validation/project.validation";
import { workspaceIdSchema } from "../validation/workspace.validation";

/** Helper: fetch and email both the project creator and workspace owner */
const notifyProjectParties = async (
  workspaceId: string,
  creatorId: string,
  projectName: string,
  projectEmoji: string,
  actorId: string,
  templateFn: (
    recipientName: string,
    projectName: string,
    projectEmoji: string,
    workspaceName: string,
    actorName: string
  ) => string,
  subject: string
) => {
  try {
    const [actor, workspace] = await Promise.all([
      UserModel.findById(actorId).select("name"),
      WorkspaceModel.findById(workspaceId).select("name owner"),
    ]);
    if (!workspace || !actor) return;

    const actorName = actor.name || "A team member";
    const workspaceName = workspace.name;

    const recipientIds = new Set<string>();
    recipientIds.add(creatorId.toString());
    recipientIds.add(workspace.owner.toString());

    const recipients = await UserModel.find({
      _id: { $in: Array.from(recipientIds) },
    }).select("email name");

    for (const recipient of recipients) {
      if (recipient.email) {
        await sendEmail(
          recipient.email,
          subject,
          templateFn(
            recipient.name,
            projectName,
            projectEmoji,
            workspaceName,
            actorName
          )
        );
      }
    }
  } catch (e) {
    console.error("[Email] Error sending project notification:", e);
  }
};

export const createProjectController = asyncHandler(
  async (req: Request, res: Response) => {
    const body = createProjectSchema.parse(req.body);
    const workspaceId = workspaceIdSchema.parse(req.params.workspaceId);

    const userId = req.user?._id;
    const { role } = await getMemberRoleInWorkspace(userId, workspaceId);
    roleGuard(role, [Permissions.CREATE_PROJECT]);

    const { project } = await createProjectService(userId, workspaceId, body);

    // Notify creator and workspace owner
    notifyProjectParties(
      workspaceId,
      userId,
      project.name,
      project.emoji || "📁",
      userId,
      projectCreatedTemplate,
      `New Project Created: ${project.emoji || "📁"} ${project.name}`
    );
    logActivity(workspaceId, userId, "project_created", "project", project.name);

    return res.status(HTTPSTATUS.CREATED).json({
      message: "Project created successfully",
      project,
    });
  }
);

export const getAllProjectsInWorkspaceController = asyncHandler(
  async (req: Request, res: Response) => {
    const workspaceId = workspaceIdSchema.parse(req.params.workspaceId);
    const userId = req.user?._id;

    const { role } = await getMemberRoleInWorkspace(userId, workspaceId);
    roleGuard(role, [Permissions.VIEW_ONLY]);

    const pageSize = parseInt(req.query.pageSize as string) || 10;
    const pageNumber = parseInt(req.query.pageNumber as string) || 1;

    const { projects, totalCount, totalPages, skip } =
      await getProjectsInWorkspaceService(workspaceId, pageSize, pageNumber);

    return res.status(HTTPSTATUS.OK).json({
      message: "Project fetched successfully",
      projects,
      pagination: {
        totalCount,
        pageSize,
        pageNumber,
        totalPages,
        skip,
        limit: pageSize,
      },
    });
  }
);

export const getProjectByIdAndWorkspaceIdController = asyncHandler(
  async (req: Request, res: Response) => {
    const projectId = projectIdSchema.parse(req.params.id);
    const workspaceId = workspaceIdSchema.parse(req.params.workspaceId);

    const userId = req.user?._id;

    const { role } = await getMemberRoleInWorkspace(userId, workspaceId);
    roleGuard(role, [Permissions.VIEW_ONLY]);

    const { project } = await getProjectByIdAndWorkspaceIdService(
      workspaceId,
      projectId
    );

    return res.status(HTTPSTATUS.OK).json({
      message: "Project fetched successfully",
      project,
    });
  }
);

export const getProjectAnalyticsController = asyncHandler(
  async (req: Request, res: Response) => {
    const projectId = projectIdSchema.parse(req.params.id);
    const workspaceId = workspaceIdSchema.parse(req.params.workspaceId);

    const userId = req.user?._id;

    const { role } = await getMemberRoleInWorkspace(userId, workspaceId);
    roleGuard(role, [Permissions.VIEW_ONLY]);

    const { analytics } = await getProjectAnalyticsService(
      workspaceId,
      projectId
    );

    return res.status(HTTPSTATUS.OK).json({
      message: "Project analytics retrieved successfully",
      analytics,
    });
  }
);

export const updateProjectController = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?._id;

    const projectId = projectIdSchema.parse(req.params.id);
    const workspaceId = workspaceIdSchema.parse(req.params.workspaceId);

    const body = updateProjectSchema.parse(req.body);

    const { role } = await getMemberRoleInWorkspace(userId, workspaceId);
    roleGuard(role, [Permissions.EDIT_PROJECT]);

    const { project } = await updateProjectService(workspaceId, projectId, body);

    // Notify creator and workspace owner
    notifyProjectParties(
      workspaceId,
      project.createdBy?.toString() || userId,
      project.name,
      project.emoji || "📁",
      userId,
      projectUpdatedTemplate,
      `Project Updated: ${project.emoji || "📁"} ${project.name}`
    );

    return res.status(HTTPSTATUS.OK).json({
      message: "Project updated successfully",
      project,
    });
  }
);

export const deleteProjectController = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?._id;

    const projectId = projectIdSchema.parse(req.params.id);
    const workspaceId = workspaceIdSchema.parse(req.params.workspaceId);

    const { role } = await getMemberRoleInWorkspace(userId, workspaceId);
    roleGuard(role, [Permissions.DELETE_PROJECT]);

    // Fetch project before deleting to use its name in the email
    let projectName = "A project";
    let creatorId = userId;
    let projectEmoji = "📁";
    try {
      const proj = await import("../models/project.model").then((m) =>
        m.default.findById(projectId).select("name emoji createdBy")
      );
      if (proj) {
        projectName = proj.name;
        projectEmoji = proj.emoji || "📁";
        creatorId = proj.createdBy?.toString() || userId;
      }
    } catch (_) { }

    await deleteProjectService(workspaceId, projectId);

    // Notify creator and workspace owner
    notifyProjectParties(
      workspaceId,
      creatorId,
      projectName,
      projectEmoji,
      userId,
      (recipientName, projName, _emoji, workspaceName, actorName) =>
        projectDeletedTemplate(recipientName, projName, workspaceName, actorName),
      `Project Deleted: ${projectName}`
    );

    return res.status(HTTPSTATUS.OK).json({
      message: "Project deleted successfully",
    });
  }
);
