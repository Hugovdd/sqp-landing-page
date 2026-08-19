import { z } from "zod";

export const DEFAULT_ALTAR_WAITLIST_URL = "https://waitlist.motionaltar.com";
export const ALTAR_EMAIL_PREVIEWS_PATH = "/admin/email-previews";

export type AltarEmailTemplate =
  | {
      ok: true;
      id: string;
      name: string;
      trigger: string;
      subject: string;
      html: string;
      text: string;
    }
  | {
      ok: false;
      id: string;
      name: string;
      trigger: string;
      error: string;
    };

export type AltarEmailPreviewsResult =
  | { status: "missing_config" }
  | { status: "unauthorized" }
  | { status: "unavailable" }
  | { status: "malformed" }
  | { status: "empty" }
  | {
      status: "ready";
      templates: [AltarEmailTemplate, ...AltarEmailTemplate[]];
    };

const readyEmailTemplateSchema = z.object({
  id: z.string().min(1),
  name: z.string(),
  trigger: z.string(),
  subject: z.string(),
  html: z.string(),
  text: z.string(),
});

const errorEmailTemplateSchema = z.object({
  id: z.string().min(1),
  name: z.string().optional(),
  trigger: z.string().optional(),
  error: z.string(),
});

const emailPreviewsResponseSchema = z.object({
  ok: z.literal(true),
  templates: z.array(
    z.union([errorEmailTemplateSchema, readyEmailTemplateSchema]),
  ),
});

export function altarEmailPreviewsUrl(origin: string | undefined): string {
  const trimmed = origin?.trim();
  const base = trimmed
    ? trimmed.replace(/\/+$/, "")
    : DEFAULT_ALTAR_WAITLIST_URL;
  return `${base}${ALTAR_EMAIL_PREVIEWS_PATH}`;
}

function toTemplate(
  raw:
    | z.infer<typeof errorEmailTemplateSchema>
    | z.infer<typeof readyEmailTemplateSchema>,
): AltarEmailTemplate {
  if ("error" in raw) {
    return {
      ok: false,
      id: raw.id,
      name: raw.name ?? raw.id,
      trigger: raw.trigger ?? "",
      error: raw.error,
    };
  }
  return { ok: true, ...raw };
}

export function parseAltarEmailPreviews(
  payload: unknown,
): Extract<
  AltarEmailPreviewsResult,
  { status: "malformed" | "empty" | "ready" }
> {
  const parsed = emailPreviewsResponseSchema.safeParse(payload);
  if (!parsed.success) return { status: "malformed" };
  const [first, ...rest] = parsed.data.templates.map(toTemplate);
  if (!first) return { status: "empty" };
  return { status: "ready", templates: [first, ...rest] };
}
