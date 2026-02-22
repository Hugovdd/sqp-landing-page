// @ts-check
import cloudflare from "@astrojs/cloudflare";
import mdx from "@astrojs/mdx";
import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "astro/config";

// https://astro.build/config
export default defineConfig({
  site: "https://sidequestplugins.com",
  output: "static",
  adapter: cloudflare({
    routes: {
      extend: {
        include: [{ pattern: "/docs" }, { pattern: "/docs/*" }],
      },
    },
  }),
  integrations: [
    react(),
    sitemap({
      filter: (page) =>
        !["/subscription-confirmed", "/subscription-error", "/404"].some((p) =>
          page.includes(p),
        ),
      serialize: (item) => {
        if (item.url === "https://sidequestplugins.com/") item.priority = 1.0;
        if (item.url.includes("/find-and-replace-fonts")) item.priority = 0.9;
        if (item.url.includes("/ae-sheets")) item.priority = 0.9;
        if (
          item.url.includes("/free-ae-scripts") &&
          !item.url.includes("/ae-calculator")
        )
          item.priority = 0.7;
        if (item.url.includes("/ae-calculator")) item.priority = 0.6;
        if (item.url.includes("/contact")) item.priority = 0.5;
        if (item.url.includes("/privacy") || item.url.includes("/terms"))
          item.priority = 0.3;
        return item;
      },
    }),
    mdx(),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
  redirects: {
    "/products/find-and-replace-fonts-ae": {
      status: 301,
      destination: "/find-and-replace-fonts",
    },
  },
});
