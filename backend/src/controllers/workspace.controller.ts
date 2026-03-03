import { Request, Response } from "express";

import { z } from "zod";
import { HTTPSTATUS } from "../config/http.config";
import { Permissions } from "../enums/role.enum";
import { asyncHandler } from "../middlewares/asyncHandler.middleware";
import UserModel from "../models/user.model";
import { getMemberRoleInWorkspace } from "../services/member.service";
import {
  changeMemberRoleService,
  createWorkspaceService,
  deleteWorkspaceService,
  getAllWorkspacesUserIsMemberService,
  getWorkspaceAnalyticsService,
  getWorkspaceByIdService,
  getWorkspaceMembersService,
  resetWorkspaceInviteCodeService,
  sendWorkspaceInviteEmailService,
  updateWorkspaceByIdService,
} from "../services/workspace.service";
import { memberRoleChangedTemplate, workspaceInviteTemplate } from "../utils/emailTemplates";
import { roleGuard } from "../utils/roleGuard";
import { sendEmail } from "../utils/sendEmail";
import {
  changeRoleSchema,
  createWorkspaceSchema,
  updateWorkspaceSchema,
  workspaceIdSchema,
} from "../validation/workspace.validation";

export const createWorkspaceController = asyncHandler(
  async (req: Request, res: Response) => {
    const body = createWorkspaceSchema.parse(req.body);

    const userId = req.user?._id;
    const { workspace } = await createWorkspaceService(userId, body);

    return res.status(HTTPSTATUS.CREATED).json({
      message: "Workspace created successfully",
      workspace,
    });
  }
);

// Controller: Get all workspaces the user is part of

export const getAllWorkspacesUserIsMemberController = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?._id;

    const { workspaces } = await getAllWorkspacesUserIsMemberService(userId);

    return res.status(HTTPSTATUS.OK).json({
      message: "User workspaces fetched successfully",
      workspaces,
    });
  }
);

export const getWorkspaceByIdController = asyncHandler(
  async (req: Request, res: Response) => {
    const workspaceId = workspaceIdSchema.parse(req.params.id);
    const userId = req.user?._id;

    await getMemberRoleInWorkspace(userId, workspaceId);

    const { workspace } = await getWorkspaceByIdService(workspaceId);

    return res.status(HTTPSTATUS.OK).json({
      message: "Workspace fetched successfully",
      workspace,
    });
  }
);

export const getWorkspaceMembersController = asyncHandler(
  async (req: Request, res: Response) => {
    const workspaceId = workspaceIdSchema.parse(req.params.id);
    const userId = req.user?._id;

    const { role } = await getMemberRoleInWorkspace(userId, workspaceId);
    roleGuard(role, [Permissions.VIEW_ONLY]);

    const { members, roles } = await getWorkspaceMembersService(workspaceId);

    return res.status(HTTPSTATUS.OK).json({
      message: "Workspace members retrieved successfully",
      members,
      roles,
    });
  }
);

export const getWorkspaceAnalyticsController = asyncHandler(
  async (req: Request, res: Response) => {
    const workspaceId = workspaceIdSchema.parse(req.params.id);
    const userId = req.user?._id;

    const { role } = await getMemberRoleInWorkspace(userId, workspaceId);
    roleGuard(role, [Permissions.VIEW_ONLY]);

    const { analytics } = await getWorkspaceAnalyticsService(workspaceId);

    return res.status(HTTPSTATUS.OK).json({
      message: "Workspace analytics retrieved successfully",
      analytics,
    });
  }
);

export const changeWorkspaceMemberRoleController = asyncHandler(
  async (req: Request, res: Response) => {
    const workspaceId = workspaceIdSchema.parse(req.params.id);
    const { memberId, roleId } = changeRoleSchema.parse(req.body);

    const userId = req.user?._id;

    const { role } = await getMemberRoleInWorkspace(userId, workspaceId);
    roleGuard(role, [Permissions.CHANGE_MEMBER_ROLE]);

    const { member, roleName } = await changeMemberRoleService(
      workspaceId,
      memberId,
      roleId
    );

    // Notify the affected member of their role change (fire-and-forget)
    try {
      const [affectedUser, workspace] = await Promise.all([
        UserModel.findById(memberId).select("email name"),
        import("../models/workspace.model").then((m) =>
          m.default.findById(workspaceId).select("name")
        ),
      ]);
      if (affectedUser?.email && workspace) {
        await sendEmail(
          affectedUser.email,
          `Your Role in ${workspace.name} Was Updated`,
          memberRoleChangedTemplate(affectedUser.name, roleName, workspace.name)
        );
      }
    } catch (e) {
      console.error("[Email] Error sending role change email:", e);
    }

    return res.status(HTTPSTATUS.OK).json({
      message: "Member Role changed successfully",
      member,
    });
  }
);

export const updateWorkspaceByIdController = asyncHandler(
  async (req: Request, res: Response) => {
    const workspaceId = workspaceIdSchema.parse(req.params.id);
    const { name, description } = updateWorkspaceSchema.parse(req.body);

    const userId = req.user?._id;

    const { role } = await getMemberRoleInWorkspace(userId, workspaceId);
    roleGuard(role, [Permissions.EDIT_WORKSPACE]);

    const { workspace } = await updateWorkspaceByIdService(
      workspaceId,
      name,
      description
    );

    return res.status(HTTPSTATUS.OK).json({
      message: "Workspace updated successfully",
      workspace,
    });
  }
);

export const deleteWorkspaceByIdController = asyncHandler(
  async (req: Request, res: Response) => {
    const workspaceId = workspaceIdSchema.parse(req.params.id);

    const userId = req.user?._id;

    const { role } = await getMemberRoleInWorkspace(userId, workspaceId);
    roleGuard(role, [Permissions.DELETE_WORKSPACE]);

    const { currentWorkspace } = await deleteWorkspaceService(
      workspaceId,
      userId
    );

    return res.status(HTTPSTATUS.OK).json({
      message: "Workspace deleted successfully",
      currentWorkspace,
    });
  }
);

export const resetWorkspaceInviteCodeController = asyncHandler(
  async (req: Request, res: Response) => {
    const workspaceId = workspaceIdSchema.parse(req.params.id);
    const userId = req.user?._id;

    const { role } = await getMemberRoleInWorkspace(userId, workspaceId);
    roleGuard(role, [Permissions.EDIT_WORKSPACE]);

    const { workspace } = await resetWorkspaceInviteCodeService(workspaceId);

    return res.status(HTTPSTATUS.OK).json({
      message: "Invite code reset successfully",
      workspace,
    });
  }
);

export const sendWorkspaceInviteEmailController = asyncHandler(
  async (req: Request, res: Response) => {
    const workspaceId = workspaceIdSchema.parse(req.params.id);
    const recipientEmail = z.string().email().parse(req.body.email);
    const userId = req.user?._id;

    const { role } = await getMemberRoleInWorkspace(userId, workspaceId);
    roleGuard(role, [Permissions.EDIT_WORKSPACE]);

    const { workspaceName, inviteCode, ownerId } =
      await sendWorkspaceInviteEmailService(workspaceId);

    const inviter = await UserModel.findById(userId).select("name");
    const inviteUrl = `${process.env.FRONTEND_ORIGIN}/invite/workspace/${inviteCode}/join`;

    await sendEmail(
      recipientEmail,
      `You're Invited to Join ${workspaceName}`,
      workspaceInviteTemplate(
        workspaceName,
        inviteUrl,
        inviter?.name || "A team member"
      )
    );

    return res.status(HTTPSTATUS.OK).json({
      message: `Invite email sent to ${recipientEmail}`,
    });
  }
);
