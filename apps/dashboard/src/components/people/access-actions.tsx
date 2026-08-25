"use client";

import { useActionState } from "react";

import {
  revokeAccessAction,
  sendAccessInviteAction,
} from "@/app/(admin)/people/actions";
import { Button } from "@/components/ui/button";
import {
  idleAccessInviteState,
  type AccessInviteActionState,
} from "@/lib/altar-access-invite";
import type { PersonDetail } from "@/lib/altar-people";

const OUTCOME_COPY: Record<
  Exclude<AccessInviteActionState["status"], "idle">,
  string
> = {
  sent: "Access Invite sent.",
  resent: "Access Invite resent.",
  revoked: "Access revoked.",
  unknown_person: "No Waitlist Entry for that email.",
  invalid: "The request was rejected.",
  unauthorized: "Not authorized to change access.",
  unavailable: "The waitlist Worker is unavailable. Try again shortly.",
  missing_config: "ALTAR_ADMIN_TOKEN is not configured.",
};

export function AccessActions({
  detail,
  disabled,
}: {
  detail: PersonDetail;
  disabled: boolean;
}) {
  const [inviteState, inviteAction, invitePending] = useActionState(
    sendAccessInviteAction,
    idleAccessInviteState,
  );
  const [revokeState, revokeAction, revokePending] = useActionState(
    revokeAccessAction,
    idleAccessInviteState,
  );
  const pending = invitePending || revokePending;
  const outcome =
    revokeState.status !== "idle" ? revokeState : inviteState;
  const now = Date.now();
  const hasActiveInvite = detail.invites.some(
    (invite) => invite.status === "sent" && invite.expiresAt > now,
  );
  const canSend =
    detail.waitlistStatus !== "joined" || hasActiveInvite;
  const canRevoke =
    detail.waitlistStatus !== "revoked" &&
    (detail.waitlistStatus === "invited" ||
      detail.waitlistStatus === "joined" ||
      detail.invites.some((invite) => invite.status === "claimed"));
  return (
    <div className="space-y-3">
      <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
        Access
      </p>
      <div className="flex flex-wrap gap-2">
        {canSend ? (
          <form action={inviteAction}>
            <input type="hidden" name="email" value={detail.email} />
            <Button type="submit" size="sm" disabled={disabled || pending}>
              {invitePending
                ? "Sending…"
                : hasActiveInvite
                  ? "Resend invite"
                  : "Send Access Invite"}
            </Button>
          </form>
        ) : null}
        {canRevoke ? (
          <form action={revokeAction}>
            <input type="hidden" name="email" value={detail.email} />
            <Button
              type="submit"
              size="sm"
              variant="destructive"
              disabled={disabled || pending}
            >
              {revokePending ? "Revoking…" : "Revoke access"}
            </Button>
          </form>
        ) : null}
      </div>
      {outcome.status !== "idle" ? (
        <p className="text-sm">{OUTCOME_COPY[outcome.status]}</p>
      ) : null}
    </div>
  );
}
