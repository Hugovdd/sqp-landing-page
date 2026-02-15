import type { APIRoute } from "astro";

export const prerender = false;

export const GET: APIRoute = async ({ request, redirect, locals }) => {
  try {
    const url = new URL(request.url);
    const email = url.searchParams.get("email");
    const hash = url.searchParams.get("hash");
    const list = url.searchParams.get("list") || "general";

    if (!email || !hash) {
      return redirect("/subscription-error?reason=invalid_hash");
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
      return redirect("/subscription-error?reason=server_error");
    }

    // Verify HMAC hash
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
    const expectedHash = Array.from(new Uint8Array(signature))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    if (hash !== expectedHash) {
      return redirect("/subscription-error?reason=invalid_hash");
    }

    // Add member to Mailgun mailing list
    const mailgunBase =
      MAILGUN_EU === "true"
        ? "https://api.eu.mailgun.net/v3"
        : "https://api.mailgun.net/v3";

    const listAddress = `${list}@${MAILGUN_DOMAIN}`;

    const formData = new FormData();
    formData.append("address", email);
    formData.append("subscribed", "yes");

    const mailgunResponse = await fetch(
      `${mailgunBase}/lists/${listAddress}/members`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${btoa(`api:${MAILGUN_API_KEY}`)}`,
        },
        body: formData,
      },
    );

    if (mailgunResponse.status === 400) {
      // Member likely already exists
      return redirect("/subscription-confirmed?already=true");
    }

    if (!mailgunResponse.ok) {
      console.error(
        "Mailgun confirm error:",
        mailgunResponse.status,
        await mailgunResponse.text(),
      );
      return redirect("/subscription-error?reason=server_error");
    }

    return redirect("/subscription-confirmed");
  } catch (error) {
    console.error("Confirm error:", error);
    return redirect("/subscription-error?reason=server_error");
  }
};
