import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import useWorkspaceId from "@/hooks/use-workspace-id";
import { getWorkspaceActivityQueryFn } from "@/lib/api";
import { getAvatarColor, getAvatarFallbackText } from "@/lib/helper";
import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { Loader } from "lucide-react";
import { useState } from "react";

const ACTION_META: Record<
    string,
    { label: string; icon: string; color: string }
> = {
    task_created: { label: "created task", icon: "✅", color: "bg-green-100 text-green-700" },
    task_updated: { label: "updated task", icon: "✏️", color: "bg-blue-100 text-blue-700" },
    task_deleted: { label: "deleted task", icon: "🗑️", color: "bg-red-100 text-red-700" },
    task_status_changed: { label: "changed status of", icon: "🔄", color: "bg-purple-100 text-purple-700" },
    project_created: { label: "created project", icon: "🚀", color: "bg-indigo-100 text-indigo-700" },
    project_updated: { label: "updated project", icon: "🔧", color: "bg-yellow-100 text-yellow-800" },
    project_deleted: { label: "deleted project", icon: "🗑️", color: "bg-red-100 text-red-700" },
    member_joined: { label: "joined workspace", icon: "👋", color: "bg-teal-100 text-teal-700" },
    member_role_changed: { label: "changed role of", icon: "🔑", color: "bg-orange-100 text-orange-700" },
    invite_code_reset: { label: "reset invite link for", icon: "🔗", color: "bg-gray-100 text-gray-700" },
    workspace_updated: { label: "updated workspace", icon: "🏢", color: "bg-cyan-100 text-cyan-700" },
};

const ActivityFeed = () => {
    const workspaceId = useWorkspaceId();
    const [page, setPage] = useState(1);

    const { data, isLoading, isFetching } = useQuery({
        queryKey: ["workspace-activity", workspaceId, page],
        queryFn: () => getWorkspaceActivityQueryFn({ workspaceId, page, limit: 20 }),
        enabled: !!workspaceId,
        staleTime: 0,
        refetchInterval: 10000,
    });

    const activities = data?.activities || [];
    const pagination = data?.pagination;

    return (
        <div className="flex flex-col gap-3">
            {isLoading && (
                <div className="flex justify-center py-10">
                    <Loader className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
            )}

            {!isLoading && activities.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-10">
                    No activity yet. Start creating tasks and projects!
                </p>
            )}

            <div className="relative">
                {/* Timeline vertical line */}
                {activities.length > 0 && (
                    <div className="absolute left-5 top-0 bottom-0 w-px bg-border" />
                )}

                <ul className="space-y-4">
                    {activities.map((activity: any) => {
                        const actor = activity.actorId;
                        const name = actor?.name || "Unknown";
                        const meta = ACTION_META[activity.action] || {
                            label: activity.action,
                            icon: "📌",
                            color: "bg-gray-100 text-gray-700",
                        };
                        const initials = getAvatarFallbackText(name);
                        const avatarColor = getAvatarColor(name);

                        return (
                            <li key={activity._id} className="flex items-start gap-4 relative">
                                {/* Avatar over the line */}
                                <div className="relative z-10 shrink-0">
                                    <Avatar className="h-10 w-10 border-2 border-background shadow-sm">
                                        <AvatarImage src={actor?.profilePicture || ""} alt={name} />
                                        <AvatarFallback className={avatarColor}>
                                            {initials}
                                        </AvatarFallback>
                                    </Avatar>
                                </div>

                                {/* Content */}
                                <div className="flex-1 bg-background rounded-lg border px-4 py-3 shadow-sm hover:shadow-md transition-shadow">
                                    <div className="flex items-start justify-between flex-wrap gap-1">
                                        <p className="text-sm">
                                            <span className="font-semibold">{name}</span>{" "}
                                            <span className="text-muted-foreground">{meta.label}</span>{" "}
                                            <span
                                                className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${meta.color}`}
                                            >
                                                {meta.icon} {activity.entityName}
                                            </span>
                                        </p>
                                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                                            {formatDistanceToNow(new Date(activity.createdAt), {
                                                addSuffix: true,
                                            })}
                                        </span>
                                    </div>
                                    {activity.metadata?.newStatus && (
                                        <p className="text-xs text-muted-foreground mt-1">
                                            → New status:{" "}
                                            <span className="font-medium capitalize">
                                                {String(activity.metadata.newStatus).toLowerCase().replace("_", " ")}
                                            </span>
                                        </p>
                                    )}
                                </div>
                            </li>
                        );
                    })}
                </ul>
            </div>

            {/* Pagination */}
            {pagination && pagination.pages > 1 && (
                <div className="flex items-center justify-center gap-3 mt-2">
                    <button
                        disabled={page === 1 || isFetching}
                        onClick={() => setPage((p) => p - 1)}
                        className="text-xs text-primary disabled:opacity-40 hover:underline"
                    >
                        ← Newer
                    </button>
                    <span className="text-xs text-muted-foreground">
                        Page {page} of {pagination.pages}
                    </span>
                    <button
                        disabled={page >= pagination.pages || isFetching}
                        onClick={() => setPage((p) => p + 1)}
                        className="text-xs text-primary disabled:opacity-40 hover:underline"
                    >
                        Older →
                    </button>
                </div>
            )}
        </div>
    );
};

export default ActivityFeed;
