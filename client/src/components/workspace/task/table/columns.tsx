import { Column, ColumnDef, Row } from "@tanstack/react-table";
import { format } from "date-fns";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  TaskPriorityEnum,
  TaskPriorityEnumType,
  TaskStatusEnum,
  TaskStatusEnumType,
} from "@/constant";
import { toast } from "@/hooks/use-toast";
import { editTaskMutationFn } from "@/lib/api";
import {
  formatStatusToEnum,
  getAvatarColor,
  getAvatarFallbackText,
} from "@/lib/helper";
import { TaskType } from "@/types/api.type";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { priorities, statuses } from "./data";
import { DataTableColumnHeader } from "./table-column-header";
import { DataTableRowActions } from "./table-row-actions";

/** Inline status selector — usable by assigned user or users with EDIT_TASK permission */
const InlineStatusSelect = ({
  task,
  workspaceId,
}: {
  task: TaskType;
  workspaceId: string;
}) => {
  const queryClient = useQueryClient();

  const { mutate, isPending } = useMutation({
    mutationFn: editTaskMutationFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-tasks", workspaceId] });
      queryClient.invalidateQueries({ queryKey: ["project-analytics"] });
      queryClient.invalidateQueries({ queryKey: ["workspace-analytics"] });
      toast({ title: "Status updated", variant: "success" });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const currentStatus = statuses.find((s) => s.value === task.status);
  const statusKey = currentStatus
    ? (formatStatusToEnum(currentStatus.value) as TaskStatusEnumType)
    : null;

  const handleChange = (newStatus: string) => {
    mutate({
      taskId: task._id as string,
      projectId: task.project?._id as string,
      workspaceId,
      data: {
        title: task.title,
        status: newStatus,
        priority: task.priority,
        assignedTo: task.assignedTo?._id || null,
        dueDate: task.dueDate,
        description: task.description,
      },
    });
  };

  return (
    <Select value={task.status} onValueChange={handleChange} disabled={isPending}>
      <SelectTrigger className="h-auto border-0 shadow-none p-0 focus:ring-0 w-fit">
        <SelectValue>
          {currentStatus && statusKey && (
            <Badge
              variant={TaskStatusEnum[statusKey]}
              className="flex w-auto p-1 px-2 gap-1 font-medium shadow-sm uppercase border-0 cursor-pointer hover:opacity-80 transition-opacity"
            >
              {currentStatus.icon && (
                <currentStatus.icon className="h-4 w-4 rounded-full text-inherit" />
              )}
              <span>{currentStatus.label}</span>
            </Badge>
          )}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {statuses.map((s) => (
          <SelectItem key={s.value} value={s.value} className="cursor-pointer">
            <div className="flex items-center gap-2">
              {s.icon && <s.icon className="h-4 w-4" />}
              <span>{s.label}</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export const getColumns = (
  projectId?: string,
  workspaceId?: string
): ColumnDef<TaskType>[] => {
  const columns: ColumnDef<TaskType>[] = [
    {
      id: "_id",
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
          className="translate-y-[2px]"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
          className="translate-y-[2px]"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "title",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Title" />
      ),
      cell: ({ row }) => {
        return (
          <div className="flex flex-wrap space-x-2">
            <Badge variant="outline" className="capitalize shrink-0 h-[25px]">
              {row.original.taskCode}
            </Badge>
            <span className="block lg:max-w-[220px] max-w-[200px] font-medium">
              {row.original.title}
            </span>
          </div>
        );
      },
    },
    ...(projectId
      ? []
      : [
        {
          accessorKey: "project",
          header: ({ column }: { column: Column<TaskType, unknown> }) => (
            <DataTableColumnHeader column={column} title="Project" />
          ),
          cell: ({ row }: { row: Row<TaskType> }) => {
            const project = row.original.project;
            if (!project) return null;
            return (
              <div className="flex items-center gap-1">
                <span className="rounded-full border">{project.emoji}</span>
                <span className="block capitalize truncate w-[100px] text-ellipsis">
                  {project.name}
                </span>
              </div>
            );
          },
        },
      ]),
    {
      accessorKey: "assignedTo",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Assigned To" />
      ),
      cell: ({ row }) => {
        const assignee = row.original.assignedTo || null;
        const name = assignee?.name || "";
        const initials = getAvatarFallbackText(name);
        const avatarColor = getAvatarColor(name);
        return (
          name && (
            <div className="flex items-center gap-1">
              <Avatar className="h-6 w-6">
                <AvatarImage src={assignee?.profilePicture || ""} alt={name} />
                <AvatarFallback className={avatarColor}>{initials}</AvatarFallback>
              </Avatar>
              <span className="block text-ellipsis w-[100px] truncate">
                {assignee?.name}
              </span>
            </div>
          )
        );
      },
    },
    {
      accessorKey: "dueDate",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Due Date" />
      ),
      cell: ({ row }) => (
        <span className="lg:max-w-[100px] text-sm">
          {row.original.dueDate ? format(row.original.dueDate, "PPP") : null}
        </span>
      ),
    },
    {
      accessorKey: "status",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Status" />
      ),
      cell: ({ row }) => (
        <div className="flex lg:w-[140px] items-center">
          <InlineStatusSelect
            task={row.original}
            workspaceId={workspaceId || ""}
          />
        </div>
      ),
    },
    {
      accessorKey: "priority",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Priority" />
      ),
      cell: ({ row }) => {
        const priority = priorities.find(
          (priority) => priority.value === row.getValue("priority")
        );
        if (!priority) return null;
        const statusKey = formatStatusToEnum(priority.value) as TaskPriorityEnumType;
        const Icon = priority.icon;
        if (!Icon) return null;
        return (
          <div className="flex items-center">
            <Badge
              variant={TaskPriorityEnum[statusKey]}
              className="flex lg:w-[110px] p-1 gap-1 !bg-transparent font-medium !shadow-none uppercase border-0"
            >
              <Icon className="h-4 w-4 rounded-full text-inherit" />
              <span>{priority.label}</span>
            </Badge>
          </div>
        );
      },
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <>
          <DataTableRowActions row={row} />
        </>
      ),
    },
  ];

  return columns;
};
