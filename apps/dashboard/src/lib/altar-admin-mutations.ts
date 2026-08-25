import "server-only";

import { getCloudflareContext } from "@opennextjs/cloudflare";
import { z } from "zod";

import {
  type AccessInviteActionState,
  altarAccessInviteUrl,
  altarAccessRevokeUrl,
  parseAccessEmail,
  parseAccessInviteResponse,
  parseAccessRevokeResponse,
} from "./altar-access-invite";
import { altarVaultAdminUrl } from "./altar-team-invite";

export interface AltarAdminHttpEnv {
  ALTAR_ADMIN_TOKEN?: string;
  ALTAR_WAITLIST_URL?: string;
  ALTAR_VAULT_URL?: string;
}

export async function postAltarAdmin(
  url: string,
  token: string,
  body: unknown,
  fetchImpl: typeof globalThis.fetch,
): Promise<{ status: number; payload: unknown }> {
  const response = await fetchImpl(url, {
    method: "POST",
    cache: "no-store",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  let payload: unknown = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }
  return { status: response.status, payload };
}

function adminEnv(env?: AltarAdminHttpEnv): AltarAdminHttpEnv {
  return (
    env ?? (getCloudflareContext().env as unknown as AltarAdminHttpEnv)
  );
}

function adminToken(env?: AltarAdminHttpEnv): string | null {
  return adminEnv(env).ALTAR_ADMIN_TOKEN?.trim() || null;
}

export async function sendAltarAccessInvite(
  input: { email?: unknown },
  options: {
    env?: AltarAdminHttpEnv;
    fetch?: typeof globalThis.fetch;
  } = {},
): Promise<AccessInviteActionState> {
  const parsed = parseAccessEmail(input);
  if (!parsed.ok) return { status: "invalid", message: parsed.message };
  const env = adminEnv(options.env);
  const token = adminToken(env);
  if (!token) {
    console.error("ALTAR_ADMIN_TOKEN is not configured.");
    return { status: "missing_config", email: parsed.email };
  }
  try {
    const { status, payload } = await postAltarAdmin(
      altarAccessInviteUrl(env.ALTAR_WAITLIST_URL),
      token,
      { emails: [parsed.email] },
      options.fetch ?? globalThis.fetch,
    );
    return {
      ...parseAccessInviteResponse(payload, status),
      email: parsed.email,
    };
  } catch (error) {
    console.error("Altar access invite request failed.", error);
    return { status: "unavailable", email: parsed.email };
  }
}

export async function revokeAltarAccess(
  input: { email?: unknown },
  options: {
    env?: AltarAdminHttpEnv;
    fetch?: typeof globalThis.fetch;
  } = {},
): Promise<AccessInviteActionState> {
  const parsed = parseAccessEmail(input);
  if (!parsed.ok) return { status: "invalid", message: parsed.message };
  const env = adminEnv(options.env);
  const token = adminToken(env);
  if (!token) {
    console.error("ALTAR_ADMIN_TOKEN is not configured.");
    return { status: "missing_config", email: parsed.email };
  }
  try {
    const { status, payload } = await postAltarAdmin(
      altarAccessRevokeUrl(env.ALTAR_WAITLIST_URL),
      token,
      { email: parsed.email },
      options.fetch ?? globalThis.fetch,
    );
    return {
      ...parseAccessRevokeResponse(payload, status),
      email: parsed.email,
    };
  } catch (error) {
    console.error("Altar access revoke request failed.", error);
    return { status: "unavailable", email: parsed.email };
  }
}

export type CreateTeamActionState =
  | { status: "idle" }
  | { status: "created"; orgId: string }
  | { status: "invalid"; message?: string }
  | { status: "unauthorized" | "unavailable" | "missing_config" };

export type IdentifiedActionState =
  | { status: "idle" }
  | { status: "updated"; orgId: string; identified: boolean }
  | { status: "unknown_team" }
  | { status: "invalid"; message?: string }
  | { status: "unauthorized" | "unavailable" | "missing_config" };

export async function createAltarTeam(
  input: { name?: unknown; adminUserId?: unknown },
  options: {
    env?: AltarAdminHttpEnv;
    fetch?: typeof globalThis.fetch;
  } = {},
): Promise<CreateTeamActionState> {
  const name = typeof input.name === "string" ? input.name.trim() : "";
  const adminUserId =
    typeof input.adminUserId === "string" ? input.adminUserId.trim() : "";
  if (!name) return { status: "invalid", message: "A Team name is required." };
  if (!adminUserId) {
    return { status: "invalid", message: "A claimed Account is required." };
  }
  const env = adminEnv(options.env);
  const token = adminToken(env);
  if (!token) return { status: "missing_config" };
  try {
    const { status, payload } = await postAltarAdmin(
      altarVaultAdminUrl(env.ALTAR_VAULT_URL, "/admin/org"),
      token,
      { name, adminUserId },
      options.fetch ?? globalThis.fetch,
    );
    if (status === 401) return { status: "unauthorized" };
    const parsed = z
      .object({ ok: z.literal(true), orgId: z.string().min(1) })
      .safeParse(payload);
    if (parsed.success) return { status: "created", orgId: parsed.data.orgId };
    return { status: "unavailable" };
  } catch (error) {
    console.error("Altar create Team request failed.", error);
    return { status: "unavailable" };
  }
}

export async function setAltarTeamIdentified(
  input: { orgId?: unknown; identified?: unknown },
  options: {
    env?: AltarAdminHttpEnv;
    fetch?: typeof globalThis.fetch;
  } = {},
): Promise<IdentifiedActionState> {
  const orgId = typeof input.orgId === "string" ? input.orgId.trim() : "";
  const identified = input.identified === "true" || input.identified === true;
  if (!orgId) return { status: "invalid", message: "A Team is required." };
  const env = adminEnv(options.env);
  const token = adminToken(env);
  if (!token) return { status: "missing_config" };
  try {
    const { status, payload } = await postAltarAdmin(
      altarVaultAdminUrl(env.ALTAR_VAULT_URL, "/admin/org/identified"),
      token,
      { orgId, identified },
      options.fetch ?? globalThis.fetch,
    );
    if (status === 401) return { status: "unauthorized" };
    if (status === 404) return { status: "unknown_team" };
    const parsed = z
      .object({
        ok: z.literal(true),
        orgId: z.string(),
        identified: z.boolean(),
      })
      .safeParse(payload);
    if (parsed.success) {
      return {
        status: "updated",
        orgId: parsed.data.orgId,
        identified: parsed.data.identified,
      };
    }
    return { status: "unavailable" };
  } catch (error) {
    console.error("Altar identified toggle failed.", error);
    return { status: "unavailable" };
  }
}

