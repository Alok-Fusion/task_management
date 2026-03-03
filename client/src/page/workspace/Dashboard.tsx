import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TooltipProvider } from "@/components/ui/tooltip";
import ActivityFeed from "@/components/workspace/activity-feed";
import RecentMembers from "@/components/workspace/member/recent-members";
import RecentProjects from "@/components/workspace/project/recent-projects";
import RecentTasks from "@/components/workspace/task/recent-tasks";
import TeamBurnoutRadar from "@/components/workspace/team-burnout-radar";
import WorkspaceAnalytics from "@/components/workspace/workspace-analytics";
import useCreateProjectDialog from "@/hooks/use-create-project-dialog";

const WorkspaceDashboard = () => {
  const { onOpen } = useCreateProjectDialog();
  return (
    <TooltipProvider>
      <main className="flex flex-1 flex-col py-4 md:pt-3">
        <div className="flex items-center justify-between space-y-2 mb-6">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">
              Workspace Overview
            </h2>
            <p className="text-muted-foreground">
              Here&apos;s an overview for this workspace!
            </p>
          </div>
          <Button onClick={onOpen}>
            <Plus />
            New Project
          </Button>
        </div>
        <WorkspaceAnalytics />
        <div className="mt-4">
          <Tabs defaultValue="projects" className="w-full border rounded-lg p-2">
            <TabsList className="w-full justify-start border-0 bg-gray-50 px-1 h-12 flex-wrap gap-1">
              <TabsTrigger className="py-2" value="projects">
                Recent Projects
              </TabsTrigger>
              <TabsTrigger className="py-2" value="tasks">
                Recent Tasks
              </TabsTrigger>
              <TabsTrigger className="py-2" value="members">
                Recent Members
              </TabsTrigger>
              <TabsTrigger className="py-2 gap-1.5" value="activity">
                Activity Feed
              </TabsTrigger>
              <TabsTrigger className="py-2 gap-1.5" value="health">
                Team Burnout Radar
              </TabsTrigger>
            </TabsList>
            <TabsContent value="projects">
              <RecentProjects />
            </TabsContent>
            <TabsContent value="tasks">
              <RecentTasks />
            </TabsContent>
            <TabsContent value="members">
              <RecentMembers />
            </TabsContent>
            <TabsContent value="activity" className="p-2">
              <ActivityFeed />
            </TabsContent>
            <TabsContent value="health" className="p-2">
              <TeamBurnoutRadar />
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </TooltipProvider>
  );
};

export default WorkspaceDashboard;
