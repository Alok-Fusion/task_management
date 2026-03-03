import { Request, Response } from "express";
import { HTTPSTATUS } from "../config/http.config";
import { Permissions } from "../enums/role.enum";
import { asyncHandler } from "../middlewares/asyncHandler.middleware";
import ProjectModel from "../models/project.model";
import UserModel from "../models/user.model";
import WorkspaceModel from "../models/workspace.model";
import { getMemberRoleInWorkspace } from "../services/member.service";
import {
  createTaskService,
  deleteTaskService,
  getAllTasksService,
  getTaskByIdService,
  updateTaskService,
} from "../services/task.service";
import {
  taskAssignedTemplate,
  taskDeletedTemplate,
  taskUpdatedTemplate,
} from "../utils/emailTemplates";
import { logActivity } from "../utils/logActivity";
import { roleGuard } from "../utils/roleGuard";
import { sendEmail } from "../utils/sendEmail";
import { projectIdSchema } from "../validation/project.validation";
import {
  createTaskSchema,
  taskIdSchema,
  updateTaskSchema,
} from "../validation/task.validation";
import { workspaceIdSchema } from "../validation/workspace.validation";

export const createTaskController = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?._id;

    const body = createTaskSchema.parse(req.body);
    const projectId = projectIdSchema.parse(req.params.projectId);
    const workspaceId = workspaceIdSchema.parse(req.params.workspaceId);

    const { role } = await getMemberRoleInWorkspace(userId, workspaceId);
    roleGuard(role, [Permissions.CREATE_TASK]);

    const { task } = await createTaskService(
      workspaceId,
      projectId,
      userId,
      body
    );

    // Log activity
    logActivity(workspaceId, userId, "task_created", "task", task.title);

    // Send email to assignee (fire-and-forget)
    if (body.assignedTo) {
      try {
        const [assignee, workspace, project] = await Promise.all([
          UserModel.findById(body.assignedTo).select("email name"),
          WorkspaceModel.findById(workspaceId).select("name"),
          ProjectModel.findById(projectId).select("name"),
        ]);
        if (assignee?.email && workspace && project) {
          await sendEmail(
            assignee.email,
            `New Task Assigned: ${body.title}`,
            taskAssignedTemplate(
              assignee.name,
              body.title,
              project.name,
              workspace.name,
              body.priority,
              body.status,
              body.dueDate
            )
          );
        }
      } catch (e) {
        console.error("[Email] Error sending task assignment email:", e);
      }
    }

    return res.status(HTTPSTATUS.OK).json({
      message: "Task created successfully",
      task,
    });
  }
);

export const updateTaskController = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?._id;

    const body = updateTaskSchema.parse(req.body);

    const taskId = taskIdSchema.parse(req.params.id);
    const projectId = projectIdSchema.parse(req.params.projectId);
    const workspaceId = workspaceIdSchema.parse(req.params.workspaceId);

    const { role } = await getMemberRoleInWorkspace(userId, workspaceId);

    // Fetch the existing task to check if the requester is the assignee
    const existingTask = await import("../models/task.model").then((m) =>
      m.default.findById(taskId).select("assignedTo")
    );

    const isAssignee =
      existingTask?.assignedTo?.toString() === userId?.toString();

    if (!isAssignee) {
      // Non-assignees need EDIT_TASK permission to update
      roleGuard(role, [Permissions.EDIT_TASK]);
    } else if (req.body.status === undefined) {
      // Assignees can only update status; if no status provided, guard normally
      roleGuard(role, [Permissions.EDIT_TASK]);
    }

    // If assignee but trying to change things other than status, restrict
    const updateBody = isAssignee
      ? { ...body, status: body.status } // assignees can update all fields but must provide status
      : body;

    const { updatedTask } = await updateTaskService(
      workspaceId,
      projectId,
      taskId,
      updateBody
    );

    // Log activity
    logActivity(workspaceId, userId, "task_status_changed", "task", body.title, { newStatus: body.status });

    // Send email to assignee if they changed (fire-and-forget)
    if (body.assignedTo) {
      try {
        const [assignee, updater, workspace] = await Promise.all([
          UserModel.findById(body.assignedTo).select("email name"),
          UserModel.findById(userId).select("name"),
          WorkspaceModel.findById(workspaceId).select("name"),
        ]);
        if (assignee?.email && workspace) {
          await sendEmail(
            assignee.email,
            `Task Updated: ${body.title}`,
            taskUpdatedTemplate(
              assignee.name,
              body.title,
              workspace.name,
              updater?.name || "A team member"
            )
          );
        }
      } catch (e) {
        console.error("[Email] Error sending task update email:", e);
      }
    }

    return res.status(HTTPSTATUS.OK).json({
      message: "Task updated successfully",
      task: updatedTask,
    });
  }
);


export const getAllTasksController = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?._id;

    const workspaceId = workspaceIdSchema.parse(req.params.workspaceId);

    const filters = {
      projectId: req.query.projectId as string | undefined,
      status: req.query.status
        ? (req.query.status as string)?.split(",")
        : undefined,
      priority: req.query.priority
        ? (req.query.priority as string)?.split(",")
        : undefined,
      assignedTo: req.query.assignedTo
        ? (req.query.assignedTo as string)?.split(",")
        : undefined,
      keyword: req.query.keyword as string | undefined,
      dueDate: req.query.dueDate as string | undefined,
    };

    const pagination = {
      pageSize: parseInt(req.query.pageSize as string) || 10,
      pageNumber: parseInt(req.query.pageNumber as string) || 1,
    };

    const { role } = await getMemberRoleInWorkspace(userId, workspaceId);
    roleGuard(role, [Permissions.VIEW_ONLY]);

    const result = await getAllTasksService(workspaceId, filters, pagination);

    return res.status(HTTPSTATUS.OK).json({
      message: "All tasks fetched successfully",
      ...result,
    });
  }
);

export const getTaskByIdController = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?._id;

    const taskId = taskIdSchema.parse(req.params.id);
    const projectId = projectIdSchema.parse(req.params.projectId);
    const workspaceId = workspaceIdSchema.parse(req.params.workspaceId);

    const { role } = await getMemberRoleInWorkspace(userId, workspaceId);
    roleGuard(role, [Permissions.VIEW_ONLY]);

    const task = await getTaskByIdService(workspaceId, projectId, taskId);

    return res.status(HTTPSTATUS.OK).json({
      message: "Task fetched successfully",
      task,
    });
  }
);

export const deleteTaskController = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?._id;

    const taskId = taskIdSchema.parse(req.params.id);
    const workspaceId = workspaceIdSchema.parse(req.params.workspaceId);

    const { role } = await getMemberRoleInWorkspace(userId, workspaceId);
    roleGuard(role, [Permissions.DELETE_TASK]);

    // Fetch task before deleting (to notify the assignee)
    let assignedToId: string | null = null;
    let taskTitle = "";
    try {
      const task = await import("../models/task.model").then((m) =>
        m.default.findById(taskId).select("assignedTo title")
      );
      assignedToId = task?.assignedTo?.toString() || null;
      taskTitle = task?.title || "A task";
    } catch (_) { }

    await deleteTaskService(workspaceId, taskId);

    // Log activity
    logActivity(workspaceId, userId, "task_deleted", "task", taskTitle);

    // Send email to previously assigned user (fire-and-forget)
    if (assignedToId) {
      try {
        const [assignee, deleter, workspace] = await Promise.all([
          UserModel.findById(assignedToId).select("email name"),
          UserModel.findById(userId).select("name"),
          WorkspaceModel.findById(workspaceId).select("name"),
        ]);
        if (assignee?.email && workspace) {
          await sendEmail(
            assignee.email,
            `Task Deleted: ${taskTitle}`,
            taskDeletedTemplate(
              assignee.name,
              taskTitle,
              workspace.name,
              deleter?.name || "A team member"
            )
          );
        }
      } catch (e) {
        console.error("[Email] Error sending task deletion email:", e);
      }
    }

    return res.status(HTTPSTATUS.OK).json({
      message: "Task deleted successfully",
    });
  }
);
