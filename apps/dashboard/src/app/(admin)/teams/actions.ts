"use server";

import { revalidatePath } from "next/cache";

import { sendAltarTeamInvite } from "@/lib/altar-admin";
import {
  createAltarTeam,
  type CreateTeamActionState,
  type IdentifiedActionState,
  setAltarTeamIdentified,
} from "@/lib/altar-admin-mutations";
import { type TeamInviteActionState } from "@/lib/altar-team-invite";

export async function sendTeamInviteAction(
  _prev: TeamInviteActionState,
  formData: FormData,
): Promise<TeamInviteActionState> {
  const result = await sendAltarTeamInvite({
    email: formData.get("email"),
    orgId: formData.get("orgId"),
    role: formData.get("role"),
  });
  if (
    result.status === "sent" ||
    result.status === "resent" ||
    result.status === "delivery_failed" ||
    result.status === "already_member"
  ) {
    revalidatePath("/teams");
  }
  return result;
}

export async function createTeamAction(
  _prev: CreateTeamActionState,
  formData: FormData,
): Promise<CreateTeamActionState> {
  const result = await createAltarTeam({
    name: formData.get("name"),
    adminUserId: formData.get("adminUserId"),
  });
  if (result.status === "created") revalidatePath("/teams");
  return result;
}

export async function setIdentifiedAction(
  _prev: IdentifiedActionState,
  formData: FormData,
): Promise<IdentifiedActionState> {
  const result = await setAltarTeamIdentified({
    orgId: formData.get("orgId"),
    identified: formData.get("identified"),
  });
  if (result.status === "updated") revalidatePath("/teams");
  return result;
}
