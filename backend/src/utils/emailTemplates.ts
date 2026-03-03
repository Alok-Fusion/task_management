import { config } from "../config/app.config";

const baseTemplate = (title: string, body: string) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>${title}</title>
  <style>
    body { margin:0; padding:0; font-family: 'Segoe UI', Arial, sans-serif; background:#f4f6f9; color:#333; }
    .wrapper { max-width:600px; margin:40px auto; background:#fff; border-radius:12px; overflow:hidden; box-shadow:0 4px 20px rgba(0,0,0,0.08); }
    .header { background:linear-gradient(135deg,#6366f1,#8b5cf6); padding:36px 40px; text-align:center; }
    .header h1 { color:#fff; margin:0; font-size:22px; font-weight:700; letter-spacing:-0.3px; }
    .header p { color:rgba(255,255,255,0.8); margin:6px 0 0; font-size:14px; }
    .body { padding:36px 40px; }
    .body h2 { margin:0 0 12px; font-size:18px; color:#1e1e2d; }
    .body p { margin:0 0 16px; font-size:15px; line-height:1.6; color:#555; }
    .meta-box { background:#f8f9ff; border-left:4px solid #6366f1; border-radius:6px; padding:16px 20px; margin:20px 0; }
    .meta-box p { margin:4px 0; font-size:14px; color:#444; }
    .meta-box span { font-weight:600; color:#1e1e2d; }
    .btn { display:inline-block; background:linear-gradient(135deg,#6366f1,#8b5cf6); color:#fff; text-decoration:none; padding:14px 28px; border-radius:8px; font-size:15px; font-weight:600; margin:20px 0; }
    .footer { background:#f8f9ff; padding:20px 40px; text-align:center; font-size:12px; color:#999; border-top:1px solid #eee; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <h1>🔗 Team Sync</h1>
      <p>${title}</p>
    </div>
    <div class="body">${body}</div>
    <div class="footer">
      © ${new Date().getFullYear()} <strong>Team Sync</strong> &mdash; Built by <a href="#" style="color:#6366f1;text-decoration:none;">Alok Kushwaha</a><br/>
      You're receiving this because you're a member of a workspace.
    </div>
  </div>
</body>
</html>`;

export const taskAssignedTemplate = (
    assigneeName: string,
    taskTitle: string,
    projectName: string,
    workspaceName: string,
    priority: string,
    status: string,
    dueDate: string | undefined
) =>
    baseTemplate(
        "New Task Assigned to You",
        `
    <h2>Hi ${assigneeName}, you've been assigned a task! 🎯</h2>
    <p>A new task has just been assigned to you. Here are the details:</p>
    <div class="meta-box">
      <p>📌 <span>Task:</span> ${taskTitle}</p>
      <p>📁 <span>Project:</span> ${projectName}</p>
      <p>🏢 <span>Workspace:</span> ${workspaceName}</p>
      <p>🔥 <span>Priority:</span> ${priority}</p>
      <p>📊 <span>Status:</span> ${status}</p>
      ${dueDate ? `<p>📅 <span>Due Date:</span> ${new Date(dueDate).toDateString()}</p>` : ""}
    </div>
    <p>Log in to view your task and get started.</p>
    <a href="${config.FRONTEND_ORIGIN}" class="btn">View Task →</a>
  `
    );

export const taskUpdatedTemplate = (
    assigneeName: string,
    taskTitle: string,
    workspaceName: string,
    updatedByName: string
) =>
    baseTemplate(
        "Your Task Has Been Updated",
        `
    <h2>Hi ${assigneeName}, your task was updated ✏️</h2>
    <p><strong>${updatedByName}</strong> has made changes to a task assigned to you.</p>
    <div class="meta-box">
      <p>📌 <span>Task:</span> ${taskTitle}</p>
      <p>🏢 <span>Workspace:</span> ${workspaceName}</p>
      <p>👤 <span>Updated by:</span> ${updatedByName}</p>
    </div>
    <p>Log in to see what changed.</p>
    <a href="${config.FRONTEND_ORIGIN}" class="btn">View Task →</a>
  `
    );

export const taskDeletedTemplate = (
    assigneeName: string,
    taskTitle: string,
    workspaceName: string,
    deletedByName: string
) =>
    baseTemplate(
        "A Task Assigned to You Was Deleted",
        `
    <h2>Hi ${assigneeName}, a task was deleted 🗑️</h2>
    <p><strong>${deletedByName}</strong> has deleted a task that was assigned to you.</p>
    <div class="meta-box">
      <p>📌 <span>Task:</span> ${taskTitle}</p>
      <p>🏢 <span>Workspace:</span> ${workspaceName}</p>
    </div>
    <p>Log in to your workspace to see the current task board.</p>
    <a href="${config.FRONTEND_ORIGIN}" class="btn">Go to Workspace →</a>
  `
    );

export const workspaceInviteTemplate = (
    workspaceName: string,
    inviteUrl: string,
    inviterName: string
) =>
    baseTemplate(
        `You're Invited to Join ${workspaceName}`,
        `
    <h2>You've been invited! 🎉</h2>
    <p><strong>${inviterName}</strong> has invited you to join the workspace <strong>${workspaceName}</strong> on Task Manager.</p>
    <p>Click the button below to accept the invitation and start collaborating:</p>
    <a href="${inviteUrl}" class="btn">Accept Invitation →</a>
    <p style="font-size:13px;color:#999;margin-top:16px;">Or copy this link: <br/><code style="font-size:12px;word-break:break-all;">${inviteUrl}</code></p>
    <p style="font-size:13px;color:#aaa;">This invite link is unique to this workspace. Do not share it with others you don't want to join.</p>
  `
    );

export const memberJoinedTemplate = (
    ownerName: string,
    newMemberName: string,
    workspaceName: string
) =>
    baseTemplate(
        "A New Member Has Joined Your Workspace",
        `
    <h2>Hi ${ownerName}, a new member joined! 👋</h2>
    <p><strong>${newMemberName}</strong> has joined the workspace <strong>${workspaceName}</strong>.</p>
    <a href="${config.FRONTEND_ORIGIN}" class="btn">View Members →</a>
  `
    );

export const memberRoleChangedTemplate = (
    memberName: string,
    newRole: string,
    workspaceName: string
) =>
    baseTemplate(
        "Your Workspace Role Has Changed",
        `
    <h2>Hi ${memberName}, your role was updated 🔑</h2>
    <p>Your role in the workspace <strong>${workspaceName}</strong> has been changed.</p>
    <div class="meta-box">
      <p>🔑 <span>New Role:</span> ${newRole}</p>
      <p>🏢 <span>Workspace:</span> ${workspaceName}</p>
    </div>
    <p>Your new permissions are now active. Log in to get started.</p>
    <a href="${config.FRONTEND_ORIGIN}" class="btn">Go to Workspace →</a>
  `
    );

export const projectCreatedTemplate = (
    recipientName: string,
    projectName: string,
    projectEmoji: string,
    workspaceName: string,
    creatorName: string
) =>
    baseTemplate(
        `New Project: ${projectEmoji} ${projectName}`,
        `
    <h2>Hi ${recipientName}, a new project was created! 🚀</h2>
    <p><strong>${creatorName}</strong> created a new project in <strong>${workspaceName}</strong>.</p>
    <div class="meta-box">
      <p>${projectEmoji} <span>Project:</span> ${projectName}</p>
      <p>🏢 <span>Workspace:</span> ${workspaceName}</p>
      <p>👤 <span>Created by:</span> ${creatorName}</p>
    </div>
    <a href="${config.FRONTEND_ORIGIN}" class="btn">View Project →</a>
  `
    );

export const projectUpdatedTemplate = (
    recipientName: string,
    projectName: string,
    projectEmoji: string,
    workspaceName: string,
    updaterName: string
) =>
    baseTemplate(
        `Project Updated: ${projectEmoji} ${projectName}`,
        `
    <h2>Hi ${recipientName}, a project was updated ✏️</h2>
    <p><strong>${updaterName}</strong> made changes to a project in <strong>${workspaceName}</strong>.</p>
    <div class="meta-box">
      <p>${projectEmoji} <span>Project:</span> ${projectName}</p>
      <p>🏢 <span>Workspace:</span> ${workspaceName}</p>
      <p>👤 <span>Updated by:</span> ${updaterName}</p>
    </div>
    <a href="${config.FRONTEND_ORIGIN}" class="btn">View Project →</a>
  `
    );

export const projectDeletedTemplate = (
    recipientName: string,
    projectName: string,
    workspaceName: string,
    deletedByName: string
) =>
    baseTemplate(
        `Project Deleted: ${projectName}`,
        `
    <h2>Hi ${recipientName}, a project was deleted 🗑️</h2>
    <p><strong>${deletedByName}</strong> deleted the project <strong>${projectName}</strong> from <strong>${workspaceName}</strong>.</p>
    <div class="meta-box">
      <p>📁 <span>Project:</span> ${projectName}</p>
      <p>🏢 <span>Workspace:</span> ${workspaceName}</p>
      <p>👤 <span>Deleted by:</span> ${deletedByName}</p>
    </div>
    <a href="${config.FRONTEND_ORIGIN}" class="btn">Go to Workspace →</a>
    `
    );

export const burnoutAlertTemplate = (
    memberName: string,
    workspaceName: string,
    totalOpen: number,
    overdue: number,
    highPriority: number,
    score: number
) =>
    baseTemplate(
        "⚠️ Workload Alert — You May Be Overloaded",
        `
    <h2>Hi ${memberName}, your workload looks heavy 🔥</h2>
    <p>Your current task load in <strong>${workspaceName}</strong> has been flagged as potentially overwhelming. Here's a quick summary:</p>
    <div class="meta-box">
      <p>📊 <span>Health Score:</span> ${score}/100 — <strong style="color:#ef4444;">Overloaded</strong></p>
      <p>📋 <span>Open Tasks:</span> ${totalOpen}</p>
      <p>🚨 <span>Overdue Tasks:</span> ${overdue}</p>
      <p>🔥 <span>High-Priority Open:</span> ${highPriority}</p>
    </div>
    <p>We recommend talking to your workspace admin about redistributing some tasks to keep things sustainable.</p>
    <a href="${config.FRONTEND_ORIGIN}" class="btn">Review My Tasks →</a>
    <p style="font-size:12px;color:#aaa;margin-top:16px;">This alert is sent automatically when your health score drops below 50. You'll only receive it once per 24 hours.</p>
  `
    );
