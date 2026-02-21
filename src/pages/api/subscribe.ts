import type { APIRoute } from "astro";

export const prerender = false;

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const body = await request.json();
    const { email, product, list } = body as {
      email?: string;
      product?: string;
      list?: string;
    };

    // Validate email
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return new Response(
        JSON.stringify({ error: "A valid email is required." }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    // Access env vars via Cloudflare adapter
    const runtime = (locals as { runtime?: { env?: Record<string, string> } })
      .runtime;
    const env = runtime?.env || {};
    const MAILGUN_API_KEY =
      env.MAILGUN_API_KEY || import.meta.env.MAILGUN_API_KEY;
    const MAILGUN_DOMAIN = env.MAILGUN_DOMAIN || import.meta.env.MAILGUN_DOMAIN;
    const SUBSCRIBE_SECRET =
      env.SUBSCRIBE_SECRET || import.meta.env.SUBSCRIBE_SECRET;
    const MAILGUN_EU = env.MAILGUN_EU || import.meta.env.MAILGUN_EU;

    if (!MAILGUN_API_KEY || !MAILGUN_DOMAIN || !SUBSCRIBE_SECRET) {
      console.error("Missing environment variables for subscription");
      return new Response(
        JSON.stringify({ error: "Server configuration error." }),
        { status: 500, headers: { "Content-Type": "application/json" } },
      );
    }

    // Generate HMAC hash for double opt-in
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(SUBSCRIBE_SECRET),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"],
    );
    const signature = await crypto.subtle.sign(
      "HMAC",
      key,
      encoder.encode(email),
    );
    const hash = Array.from(new Uint8Array(signature))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    // Build confirmation URL
    const listName = list || product || "general";
    const confirmUrl = new URL("/api/confirm", request.url);
    confirmUrl.searchParams.set("email", email);
    confirmUrl.searchParams.set("hash", hash);
    confirmUrl.searchParams.set("list", listName);

    // Send confirmation email via Mailgun
    const mailgunBase =
      MAILGUN_EU === "true"
        ? "https://api.eu.mailgun.net/v3"
        : "https://api.mailgun.net/v3";

    const formData = new FormData();
    formData.append("from", `Sidequest Plugins <noreply@${MAILGUN_DOMAIN}>`);
    formData.append("to", email);
    formData.append("subject", "Confirm your subscription");
    formData.append(
      "html",
      `<p>Hi there!</p>
<p>Please confirm your subscription by clicking the link below:</p>
<p><a href="${confirmUrl.toString()}">Confirm my subscription</a></p>
<p>If you didn't sign up for this, you can safely ignore this email.</p>
<p>— Sidequest Plugins</p>`,
    );

    const mailgunResponse = await fetch(
      `${mailgunBase}/${MAILGUN_DOMAIN}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${btoa(`api:${MAILGUN_API_KEY}`)}`,
        },
        body: formData,
      },
    );

    if (!mailgunResponse.ok) {
      console.error(
        "Mailgun error:",
        mailgunResponse.status,
        await mailgunResponse.text(),
      );
      return new Response(
        JSON.stringify({ error: "Failed to send confirmation email." }),
        { status: 500, headers: { "Content-Type": "application/json" } },
      );
    }

    return new Response(
      JSON.stringify({ message: "Confirmation email sent." }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("Subscribe error:", error);
    return new Response(JSON.stringify({ error: "Internal server error." }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
