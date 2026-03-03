import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import useWorkspaceId from "@/hooks/use-workspace-id";
import { getWorkspaceHealthQueryFn } from "@/lib/api";
import { getAvatarColor, getAvatarFallbackText } from "@/lib/helper";
import { useQuery } from "@tanstack/react-query";
import { Loader, RefreshCw } from "lucide-react";

const ScoreRing = ({ score, status }: { score: number; status: string }) => {
    const radius = 22;
    const circumference = 2 * Math.PI * radius;
    const progress = (score / 100) * circumference;
    const colorMap: Record<string, string> = {
        healthy: "#22c55e",
        at_risk: "#f59e0b",
        overloaded: "#ef4444",
    };
    const color = colorMap[status] || "#94a3b8";

    return (
        <svg width="60" height="60" viewBox="0 0 60 60" className="rotate-[-90deg]">
            {/* Background ring */}
            <circle
                cx="30" cy="30" r={radius}
                fill="none" stroke="currentColor"
                strokeWidth="5" className="text-muted/20"
            />
            {/* Progress ring */}
            <circle
                cx="30" cy="30" r={radius}
                fill="none" stroke={color}
                strokeWidth="5"
                strokeDasharray={circumference}
                strokeDashoffset={circumference - progress}
                strokeLinecap="round"
                style={{ transition: "stroke-dashoffset 0.6s ease" }}
            />
            {/* Score text (un-rotated) */}
            <text
                x="30" y="35"
                textAnchor="middle"
                fontSize="13"
                fontWeight="700"
                fill={color}
                style={{ transform: "rotate(90deg)", transformOrigin: "30px 30px" }}
            >
                {score}
            </text>
        </svg>
    );
};

const STATUS_CONFIG = {
    healthy: { label: "Healthy", bg: "bg-green-50 border-green-200", badge: "bg-green-100 text-green-700" },
    at_risk: { label: "At Risk", bg: "bg-yellow-50 border-yellow-200", badge: "bg-yellow-100 text-yellow-700" },
    overloaded: { label: "Overloaded", bg: "bg-red-50 border-red-200", badge: "bg-red-100 text-red-700" },
};

const TeamBurnoutRadar = () => {
    const workspaceId = useWorkspaceId();

    const { data, isLoading, refetch, isFetching } = useQuery({
        queryKey: ["workspace-health", workspaceId],
        queryFn: () => getWorkspaceHealthQueryFn(workspaceId),
        enabled: !!workspaceId,
        staleTime: 0,
        refetchInterval: 30000,
    });

    const health = data?.health || [];
    const teamAvgScore = data?.teamAvgScore ?? 100;
    const teamStatus =
        teamAvgScore >= 80 ? "healthy" : teamAvgScore >= 50 ? "at_risk" : "overloaded";

    return (
        <div className="flex flex-col gap-4">
            {/* Team average banner */}
            {!isLoading && health.length > 0 && (
                <div
                    className={`flex items-center justify-between rounded-xl px-5 py-3 border ${STATUS_CONFIG[teamStatus as keyof typeof STATUS_CONFIG]?.bg}`}
                >
                    <div>
                        <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                            Team Health Score
                        </p>
                        <p className="text-2xl font-bold mt-0.5">
                            {teamAvgScore}
                            <span className="text-sm font-normal text-muted-foreground">/100</span>
                        </p>
                    </div>
                    <span
                        className={`text-xs font-semibold px-3 py-1 rounded-full ${STATUS_CONFIG[teamStatus as keyof typeof STATUS_CONFIG]?.badge}`}
                    >
                        {STATUS_CONFIG[teamStatus as keyof typeof STATUS_CONFIG]?.label}
                    </span>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => refetch()}
                        disabled={isFetching}
                        className="h-8 w-8"
                    >
                        <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
                    </Button>
                </div>
            )}

            {isLoading && (
                <div className="flex justify-center py-10">
                    <Loader className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
            )}

            {!isLoading && health.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-10">
                    No team members found.
                </p>
            )}

            {/* Member cards */}
            <div className="grid gap-3">
                {health.map((member) => {
                    const cfg = STATUS_CONFIG[member.status as keyof typeof STATUS_CONFIG];
                    const initials = getAvatarFallbackText(member.name);
                    const avatarColor = getAvatarColor(member.name);

                    return (
                        <Tooltip key={member.memberId}>
                            <TooltipTrigger asChild>
                                <div
                                    className={`flex items-center gap-4 rounded-xl border px-4 py-3 cursor-default hover:shadow-sm transition-shadow ${cfg.bg}`}
                                >
                                    <Avatar className="h-10 w-10 shrink-0">
                                        <AvatarImage src={member.profilePicture || ""} alt={member.name} />
                                        <AvatarFallback className={avatarColor}>{initials}</AvatarFallback>
                                    </Avatar>

                                    <div className="flex-1 min-w-0">
                                        <p className="font-semibold text-sm truncate">{member.name}</p>
                                        <p className="text-xs text-muted-foreground capitalize">{member.role}</p>
                                        <div className="flex gap-3 mt-1">
                                            <span className="text-xs text-muted-foreground">
                                                📋 {member.stats.totalOpen} open
                                            </span>
                                            {member.stats.overdue > 0 && (
                                                <span className="text-xs text-red-600 font-medium">
                                                    🚨 {member.stats.overdue} overdue
                                                </span>
                                            )}
                                            {member.stats.highPriorityOpen > 0 && (
                                                <span className="text-xs text-orange-600 font-medium">
                                                    🔥 {member.stats.highPriorityOpen} high-pri
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="shrink-0 flex flex-col items-center gap-1">
                                        <ScoreRing score={member.healthScore} status={member.status} />
                                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${cfg.badge}`}>
                                            {cfg.label}
                                        </span>
                                    </div>
                                </div>
                            </TooltipTrigger>
                            <TooltipContent side="left">
                                <p className="text-xs">
                                    Health: {member.healthScore}/100 · {member.stats.totalOpen} open · {member.stats.overdue} overdue · {member.stats.highPriorityOpen} high-priority
                                </p>
                            </TooltipContent>
                        </Tooltip>
                    );
                })}
            </div>
        </div>
    );
};

export default TeamBurnoutRadar;
