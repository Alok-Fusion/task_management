import { Request, Response } from "express";
import { z } from "zod";
import { HTTPSTATUS } from "../config/http.config";
import { asyncHandler } from "../middlewares/asyncHandler.middleware";
import UserModel from "../models/user.model";
import WorkspaceModel from "../models/workspace.model";
import { joinWorkspaceByInviteService } from "../services/member.service";
import { memberJoinedTemplate } from "../utils/emailTemplates";
import { sendEmail } from "../utils/sendEmail";

export const joinWorkspaceController = asyncHandler(
  async (req: Request, res: Response) => {
    const inviteCode = z.string().parse(req.params.inviteCode);
    const userId = req.user?._id;

    const { workspaceId, role } = await joinWorkspaceByInviteService(
      userId,
      inviteCode
    );

    // Notify workspace owner (fire-and-forget)
    try {
      const [newMember, workspace] = await Promise.all([
        UserModel.findById(userId).select("name email"),
        WorkspaceModel.findById(workspaceId).select("name owner"),
      ]);
      if (workspace?.owner) {
        const owner = await UserModel.findById(workspace.owner).select("email name");
        if (owner?.email && newMember) {
          await sendEmail(
            owner.email,
            `New Member Joined: ${newMember.name}`,
            memberJoinedTemplate(owner.name, newMember.name, workspace.name)
          );
        }
      }
    } catch (e) {
      console.error("[Email] Error sending member joined email:", e);
    }

    return res.status(HTTPSTATUS.OK).json({
      message: "Successfully joined the workspace",
      workspaceId,
      role,
    });
  }
);
