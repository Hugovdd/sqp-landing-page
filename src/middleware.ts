import { defineMiddleware } from "astro:middleware";

const DOCS_ORIGIN = "https://sqp-docs.vercel.app";

export const onRequest = defineMiddleware(async (context, next) => {
  const { pathname } = new URL(context.request.url);

  if (pathname === "/docs" || pathname.startsWith("/docs/")) {
    const docsPath = pathname === "/docs" ? "/" : pathname.slice("/docs".length);
    const target = `${DOCS_ORIGIN}${docsPath}${new URL(context.request.url).search}`;

    const response = await fetch(target, {
      method: context.request.method,
      headers: context.request.headers,
      body:
        context.request.method !== "GET" && context.request.method !== "HEAD"
          ? context.request.body
          : undefined,
    });

    return response;
  }

  return next();
});
