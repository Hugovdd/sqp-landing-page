import type { APIRoute } from "astro";

export const GET: APIRoute = () => {
  const body = `User-agent: *
Allow: /
Disallow: /api/
Disallow: /admin/

Sitemap: https://sidequestplugins.com/sitemap-index.xml
Sitemap: https://sidequestplugins.com/docs/sitemap.xml`;

  return new Response(body, {
    headers: { "Content-Type": "text/plain" },
  });
};
