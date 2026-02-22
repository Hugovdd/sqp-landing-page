export const prerender = false;

import type { APIRoute } from "astro";

const DOCS_ORIGIN = "https://sqp-docs.vercel.app";

export const ALL: APIRoute = async ({ params, request }) => {
  const path = params.path ?? "";
  const { search } = new URL(request.url);
  const target = `${DOCS_ORIGIN}/${path}${search}`;

  const headers = new Headers(request.headers);
  headers.set("host", "sqp-docs.vercel.app");

  return fetch(target, {
    method: request.method,
    headers,
    body:
      request.method !== "GET" && request.method !== "HEAD"
        ? request.body
        : undefined,
  });
};
