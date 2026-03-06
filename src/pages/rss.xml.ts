import rss from "@astrojs/rss";
import { getCollection } from "astro:content";
import type { APIContext } from "astro";
import { SITE } from "@/consts";

export async function GET(context: APIContext) {
  const allPosts = await getCollection("blog");
  const posts = allPosts
    .filter((p) => !p.data.draft)
    .sort((a, b) => b.data.publishedAt.valueOf() - a.data.publishedAt.valueOf());

  return rss({
    title: `${SITE.name} Blog`,
    description:
      "After Effects tutorials, workflow tips, and motion design guides from the team at Sidequest Plugins.",
    site: context.site ?? SITE.domain,
    items: posts.map((post) => ({
      title: post.data.title,
      description: post.data.excerpt ?? post.data.summary,
      pubDate: post.data.publishedAt,
      link: `/blog/${post.id}`,
    })),
    customData: `<language>en-us</language>`,
    stylesheet: "/rss/styles.xsl",
  });
}
