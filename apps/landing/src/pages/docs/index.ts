export const prerender = false;

import type { APIRoute } from "astro";

const DOCS_ORIGIN = "https://sqp-docs.vercel.app";

export const GET: APIRoute = async ({ request }) => {
  const { search } = new URL(request.url);
  const target = `${DOCS_ORIGIN}/${search}`;

  const headers = new Headers(request.headers);
  headers.set("host", "sqp-docs.vercel.app");

  return fetch(target, {
    method: "GET",
    headers,
  });
};
