"use client";

import { useActionState } from "react";

import {
  createTeamAction,
  setIdentifiedAction,
} from "@/app/(admin)/teams/actions";
import { Button } from "@/components/ui/button";
import type {
  CreateTeamActionState,
  IdentifiedActionState,
} from "@/lib/altar-admin-mutations";
import type { Team } from "@/lib/altar-teams";

const idleCreate: CreateTeamActionState = { status: "idle" };
const idleIdentified: IdentifiedActionState = { status: "idle" };

export function CreateTeamForm({
  accounts,
  disabled,
}: {
  accounts: { userId: string; email: string }[];
  disabled: boolean;
}) {
  const [state, action, pending] = useActionState(createTeamAction, idleCreate);
  return (
    <form action={action} className="grid gap-3 md:grid-cols-[1fr_1fr_auto]">
      <label className="grid gap-1 text-sm">
        <span className="font-medium">Team name</span>
        <input
          name="name"
          required
          disabled={disabled || pending}
          className="border-input bg-background h-9 rounded-md border px-3"
        />
      </label>
      <label className="grid gap-1 text-sm">
        <span className="font-medium">Admin Account</span>
        <select
          name="adminUserId"
          required
          disabled={disabled || pending || accounts.length === 0}
          className="border-input bg-background h-9 rounded-md border px-3"
        >
          {accounts.map((account) => (
            <option key={account.userId} value={account.userId}>
              {account.email}
            </option>
          ))}
        </select>
      </label>
      <Button type="submit" className="self-end" disabled={disabled || pending}>
        {pending ? "Creating…" : "Create Team"}
      </Button>
      {state.status === "created" ? (
        <p className="text-sm md:col-span-3">Team created.</p>
      ) : null}
      {state.status === "invalid" ||
      state.status === "unauthorized" ||
      state.status === "unavailable" ||
      state.status === "missing_config" ? (
        <p className="text-sm md:col-span-3">
          {state.status === "invalid"
            ? (state.message ?? "Could not create Team.")
            : "Could not create Team."}
        </p>
      ) : null}
    </form>
  );
}

export function IdentifiedToggle({
  team,
  disabled,
}: {
  team: Team;
  disabled: boolean;
}) {
  const [state, action, pending] = useActionState(
    setIdentifiedAction,
    idleIdentified,
  );
  const next = team.identified === 1 ? "false" : "true";
  return (
    <form action={action}>
      <input type="hidden" name="orgId" value={team.orgId} />
      <input type="hidden" name="identified" value={next} />
      <Button
        type="submit"
        size="sm"
        variant={team.identified === 1 ? "default" : "outline"}
        disabled={disabled || pending}
      >
        {pending
          ? "Saving…"
          : team.identified === 1
            ? "Identified"
            : "Anonymous"}
      </Button>
      {state.status === "updated" ? (
        <span className="text-muted-foreground ml-2 text-xs">Saved</span>
      ) : null}
    </form>
  );
}
