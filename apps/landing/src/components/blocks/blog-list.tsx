"use client";

import type { Article } from "@/components/marketing/blog/base-components/blog-cards";
import { BlogHeaderFeaturedPost01 } from "@/components/marketing/blog/blog-header-featured-post-01";

interface BlogListProps {
    articles: Article[];
    heading?: string;
    subheading?: string;
    description?: string;
}

export function BlogList({ articles, heading, subheading, description }: BlogListProps) {
    return (
        <BlogHeaderFeaturedPost01
            articles={articles}
            heading={heading}
            subheading={subheading}
            description={description}
        />
    );
}
