import PermissionsGuard from "@/components/resuable/permission-guard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Permissions } from "@/constant";
import { useAuthContext } from "@/context/auth-provider";
import { toast } from "@/hooks/use-toast";
import { resetWorkspaceInviteCodeMutationFn, sendInviteEmailMutationFn } from "@/lib/api";
import { BASE_ROUTE } from "@/routes/common/routePaths";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CheckIcon, CopyIcon, Loader, RefreshCw, Send } from "lucide-react";
import { useState } from "react";

const InviteMember = () => {
  const { workspace, workspaceLoading } = useAuthContext();
  const [copied, setCopied] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const queryClient = useQueryClient();

  const { mutate, isPending } = useMutation({
    mutationFn: resetWorkspaceInviteCodeMutationFn,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["workspace"],
      });
      queryClient.invalidateQueries({
        queryKey: ["userWorkspaces"],
      });
      toast({
        title: "Success",
        description: "Invite link reset successfully",
        variant: "success",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const { mutate: sendInvite, isPending: isSendingInvite } = useMutation({
    mutationFn: sendInviteEmailMutationFn,
    onSuccess: (data) => {
      toast({
        title: "Invite Sent",
        description: data.message,
        variant: "success",
      });
      setInviteEmail("");
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleReset = () => {
    if (workspace) {
      mutate(workspace._id);
    }
  };

  const handleSendInvite = () => {
    if (workspace && inviteEmail) {
      sendInvite({ workspaceId: workspace._id, email: inviteEmail });
    }
  };

  const inviteUrl = workspace
    ? `${window.location.origin}${BASE_ROUTE.INVITE_URL.replace(
      ":inviteCode",
      workspace.inviteCode
    )}`
    : "";

  const handleCopy = () => {
    if (inviteUrl) {
      navigator.clipboard.writeText(inviteUrl).then(() => {
        setCopied(true);
        toast({
          title: "Copied",
          description: "Invite url copied to clipboard",
          variant: "success",
        });
        setTimeout(() => setCopied(false), 2000);
      });
    }
  };

  return (
    <div className="flex flex-col pt-0.5 px-0 ">
      <h5 className="text-lg  leading-[30px] font-semibold mb-1">
        Invite members to join you
      </h5>
      <p className="text-sm text-muted-foreground leading-tight">
        Anyone with an invite link can join this free Workspace. You can also
        disable and create a new invite link for this Workspace at any time.
      </p>

      <PermissionsGuard showMessage requiredPermission={Permissions.ADD_MEMBER}>
        {workspaceLoading ? (
          <Loader
            className="w-8 h-8 
        animate-spin
        place-self-center
        flex"
          />
        ) : (
          <>
            {/* Invite Link Section */}
            <div className="flex py-3 gap-2">
              <Label htmlFor="link" className="sr-only">
                Link
              </Label>
              <Input
                id="link"
                disabled={true}
                className="disabled:opacity-100 disabled:pointer-events-none"
                value={inviteUrl}
                readOnly
              />
              <Button
                disabled={false}
                className="shrink-0"
                size="icon"
                onClick={handleCopy}
              >
                {copied ? <CheckIcon /> : <CopyIcon />}
              </Button>
              <Button
                disabled={isPending}
                className="shrink-0"
                size="icon"
                onClick={handleReset}
              >
                {isPending ? <Loader className="animate-spin w-4 h-4" /> : <RefreshCw className="w-4 h-4" />}
              </Button>
            </div>

            {/* Invite via Email Section */}
            <div className="mt-2">
              <Label htmlFor="invite-email" className="text-sm font-medium mb-1.5 block">
                Invite via Email
              </Label>
              <div className="flex gap-2">
                <Input
                  id="invite-email"
                  type="email"
                  placeholder="colleague@example.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSendInvite()}
                />
                <Button
                  disabled={isSendingInvite || !inviteEmail}
                  className="shrink-0 gap-2"
                  onClick={handleSendInvite}
                >
                  {isSendingInvite ? (
                    <Loader className="animate-spin w-4 h-4" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  Send Invite
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-1.5">
                They'll receive an email with a link to join this workspace.
              </p>
            </div>
          </>
        )}
      </PermissionsGuard>
    </div>
  );
};

export default InviteMember;
