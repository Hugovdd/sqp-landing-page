import type { APIRoute } from "astro";

export const prerender = false;

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const body = await request.json();
    const {
      name,
      email,
      message,
      "cf-turnstile-response": turnstileToken,
    } = body as {
      name?: string;
      email?: string;
      message?: string;
      "cf-turnstile-response"?: string;
    };

    // Validate fields
    if (!name || name.length < 2) {
      return new Response(
        JSON.stringify({ error: "Name must be at least 2 characters." }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return new Response(
        JSON.stringify({ error: "A valid email is required." }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }
    if (!message || message.length < 10) {
      return new Response(
        JSON.stringify({
          error: "Message must be at least 10 characters.",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    // Access env vars via Cloudflare adapter
    const runtime = (locals as { runtime?: { env?: Record<string, string> } })
      .runtime;
    const env = runtime?.env || {};
    const MAILGUN_API_KEY = env.MAILGUN_API_KEY || import.meta.env.MAILGUN_API_KEY;
    const MAILGUN_DOMAIN = env.MAILGUN_DOMAIN || import.meta.env.MAILGUN_DOMAIN;
    const MAILGUN_EU = env.MAILGUN_EU || import.meta.env.MAILGUN_EU;
    const TURNSTILE_SECRET_KEY =
      env.TURNSTILE_SECRET_KEY || import.meta.env.TURNSTILE_SECRET_KEY;

    // Verify Turnstile token (if secret key is configured)
    if (TURNSTILE_SECRET_KEY && turnstileToken) {
      const turnstileResponse = await fetch(
        "https://challenges.cloudflare.com/turnstile/v0/siteverify",
        {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            secret: TURNSTILE_SECRET_KEY,
            response: turnstileToken,
          }),
        },
      );

      const turnstileResult = (await turnstileResponse.json()) as {
        success: boolean;
      };
      if (!turnstileResult.success) {
        return new Response(
          JSON.stringify({
            error: "Bot verification failed. Please try again.",
          }),
          { status: 400, headers: { "Content-Type": "application/json" } },
        );
      }
    }

    // Send notification email via Mailgun
    if (!MAILGUN_API_KEY || !MAILGUN_DOMAIN) {
      console.error("Missing Mailgun configuration");
      return new Response(
        JSON.stringify({ error: "Server configuration error." }),
        { status: 500, headers: { "Content-Type": "application/json" } },
      );
    }

    const mailgunBase = MAILGUN_EU === "true"
      ? "https://api.eu.mailgun.net/v3"
      : "https://api.mailgun.net/v3";

    const formData = new FormData();
    formData.append(
      "from",
      `SideQuest Contact <noreply@${MAILGUN_DOMAIN}>`,
    );
    formData.append("to", "support@sidequestplugins.com");
    formData.append("subject", `Contact form: ${name}`);
    formData.append("reply-to", email);
    formData.append(
      "html",
      `<h2>New contact form submission</h2>
<p><strong>Name:</strong> ${name}</p>
<p><strong>Email:</strong> ${email}</p>
<p><strong>Message:</strong></p>
<p>${message.replace(/\n/g, "<br>")}</p>`,
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
        JSON.stringify({ error: "Failed to send message." }),
        { status: 500, headers: { "Content-Type": "application/json" } },
      );
    }

    return new Response(
      JSON.stringify({ message: "Message sent successfully." }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("Contact error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error." }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
};
