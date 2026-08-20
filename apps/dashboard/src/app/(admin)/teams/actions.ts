"use server";

import { revalidatePath } from "next/cache";

import { sendAltarTeamInvite } from "@/lib/altar-admin";
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
