import type { APIRoute } from "astro";

export const GET: APIRoute = () => {
  const body = `User-agent: *
Allow: /
Disallow: /api/
Disallow: /admin/

User-agent: GPTBot
Allow: /

User-agent: ChatGPT-User
Allow: /

User-agent: Google-Extended
Allow: /

User-agent: PerplexityBot
Allow: /

User-agent: ClaudeBot
Allow: /

Sitemap: https://sidequestplugins.com/sitemap-index.xml
Sitemap: https://sidequestplugins.com/docs/sitemap.xml`;

  return new Response(body, {
    headers: { "Content-Type": "text/plain" },
  });
};
