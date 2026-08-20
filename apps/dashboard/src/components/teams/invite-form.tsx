"use client";

import { useActionState } from "react";

import { sendTeamInviteAction } from "@/app/(admin)/teams/actions";
import { Button } from "@/components/ui/button";
import {
  idleTeamInviteState,
  type TeamInviteActionState,
} from "@/lib/altar-team-invite";
import type { Team } from "@/lib/altar-teams";

const OUTCOME_COPY: Record<
  Exclude<TeamInviteActionState["status"], "idle">,
  string
> = {
  sent: "Team Invite sent.",
  resent: "Existing Team Invite resent.",
  already_member: "Already a member of this Team. No new invite needed.",
  delivery_failed:
    "Invite code created but the email failed. Retry to resend the same code.",
  invalid: "The Team Invite request was rejected.",
  unknown_team: "That Team does not exist.",
  unauthorized: "Not authorized to send Team Invites.",
  unavailable: "The vault Worker is unavailable. Try again shortly.",
  missing_config: "ALTAR_ADMIN_TOKEN is not configured.",
};

export function TeamInviteFormFields({
  teams,
  peopleEmails,
  disabled,
  pending,
  outcome,
}: {
  teams: Team[];
  peopleEmails: string[];
  disabled: boolean;
  pending: boolean;
  outcome: TeamInviteActionState;
}) {
  const locked = disabled || pending;
  const outcomeMessage =
    outcome.status === "idle"
      ? null
      : (outcome.message ?? OUTCOME_COPY[outcome.status]);
  const retryable = outcome.status === "delivery_failed";

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-3 md:grid-cols-[minmax(220px,1fr)_minmax(180px,1fr)]">
        <label className="grid gap-1 text-sm">
          <span className="font-medium">Person / email</span>
          <input
            name="email"
            type="email"
            required
            list="altar-people-emails"
            defaultValue={outcome.email}
            placeholder="name@example.com"
            disabled={locked}
            className="border-input bg-background h-9 rounded-md border px-3"
          />
          <datalist id="altar-people-emails">
            {peopleEmails.map((email) => (
              <option key={email} value={email} />
            ))}
          </datalist>
        </label>
        <label className="grid gap-1 text-sm">
          <span className="font-medium">Team</span>
          <select
            name="orgId"
            required
            defaultValue={outcome.orgId ?? ""}
            disabled={locked}
            className="border-input bg-background h-9 rounded-md border px-3"
          >
            <option value="" disabled>
              Select a Team
            </option>
            {teams.map((team) => (
              <option key={team.orgId} value={team.orgId}>
                {team.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <fieldset className="grid gap-2" disabled={locked}>
        <legend className="text-sm font-medium">Role</legend>
        <label className="flex items-start gap-2 text-sm">
          <input
            type="radio"
            name="role"
            value="member"
            defaultChecked={outcome.role !== "admin"}
            className="mt-1"
          />
          <span>
            <span className="font-medium">Member</span>
            <span className="text-muted-foreground mt-0.5 block text-xs">
              Default. Can browse and upload to this Team.
            </span>
          </span>
        </label>
        <label className="flex items-start gap-2 rounded-md border border-amber-500/40 bg-amber-500/5 p-3 text-sm">
          <input
            type="radio"
            name="role"
            value="admin"
            defaultChecked={outcome.role === "admin"}
            className="mt-1"
          />
          <span>
            <span className="font-medium">Admin</span>
            <span className="text-muted-foreground mt-0.5 block text-xs">
              Can manage this Team. Choose only when that access is intended.
            </span>
          </span>
        </label>
      </fieldset>

      {outcomeMessage ? (
        <p
          role="status"
          className={
            outcome.status === "sent" || outcome.status === "resent"
              ? "text-sm"
              : "text-destructive text-sm"
          }
        >
          {outcomeMessage}
        </p>
      ) : null}

      <div>
        <Button
          type="submit"
          disabled={locked}
          variant={retryable ? "outline" : "default"}
        >
          {pending ? "Sending…" : retryable ? "Retry" : "Send Team Invite"}
        </Button>
      </div>
    </div>
  );
}

export function TeamInviteForm({
  teams,
  peopleEmails,
  disabled,
}: {
  teams: Team[];
  peopleEmails: string[];
  disabled: boolean;
}) {
  const [outcome, action, pending] = useActionState(
    sendTeamInviteAction,
    idleTeamInviteState,
  );

  return (
    <form action={action}>
      <TeamInviteFormFields
        teams={teams}
        peopleEmails={peopleEmails}
        disabled={disabled}
        pending={pending}
        outcome={outcome}
      />
    </form>
  );
}
