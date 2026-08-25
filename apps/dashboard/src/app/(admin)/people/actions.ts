"use server";

import { revalidatePath } from "next/cache";

import { type AccessInviteActionState } from "@/lib/altar-access-invite";
import {
  revokeAltarAccess,
  sendAltarAccessInvite,
} from "@/lib/altar-admin-mutations";

export async function sendAccessInviteAction(
  _prev: AccessInviteActionState,
  formData: FormData,
): Promise<AccessInviteActionState> {
  const result = await sendAltarAccessInvite({
    email: formData.get("email"),
  });
  if (result.status === "sent" || result.status === "resent") {
    revalidatePath("/people");
  }
  return result;
}

export async function revokeAccessAction(
  _prev: AccessInviteActionState,
  formData: FormData,
): Promise<AccessInviteActionState> {
  const result = await revokeAltarAccess({ email: formData.get("email") });
  if (result.status === "revoked") {
    revalidatePath("/people");
  }
  return result;
}
