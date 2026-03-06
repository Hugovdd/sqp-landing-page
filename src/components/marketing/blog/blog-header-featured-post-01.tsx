"use client";

import { useState } from "react";
import { ArrowUpRight } from "@untitledui/icons";
import { PaginationPageDefault } from "@/components/application/pagination/pagination";
import { TabList, Tabs } from "@/components/application/tabs/tabs";
import { Avatar } from "@/components/base/avatar/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { type Article, Simple01Vertical } from "@/components/marketing/blog/base-components/blog-cards";

const sortByOptions = [
    { id: "recent", label: "Most recent" },
    { id: "oldest", label: "Oldest first" },
];

interface Props {
    articles: Article[];
    heading?: string;
    subheading?: string;
    description?: string;
}

export const BlogHeaderFeaturedPost01 = ({
    articles,
    heading = "Resources and insights",
    subheading = "Our blog",
    description = "The latest tutorials, tips, and guides for After Effects motion designers.",
}: Props) => {
    const [sortBy, setSortBy] = useState(sortByOptions[0].id);
    const [activeTab, setActiveTab] = useState("all");
    const [currentPage, setCurrentPage] = useState(1);

    const ARTICLES_PER_PAGE = 6;

    const featuredArticle = articles.find((a) => a.isFeatured) ?? articles[0];

    const categories = ["all", ...Array.from(new Set(articles.map((a) => a.category.name)))];
    const tabs = categories.map((cat) => ({
        id: cat === "all" ? "all" : cat.toLowerCase().replace(/\s+/g, "-"),
        label: cat === "all" ? "View all" : cat,
    }));

    const filteredArticles = articles.filter((a) => {
        if (activeTab === "all") return true;
        return a.category.name.toLowerCase().replace(/\s+/g, "-") === activeTab;
    });

    const sortedArticles = [...filteredArticles].sort((a, b) => {
        if (sortBy === "oldest") return a.publishedAt.localeCompare(b.publishedAt);
        return b.publishedAt.localeCompare(a.publishedAt);
    });

    const totalPages = Math.ceil(sortedArticles.length / ARTICLES_PER_PAGE);
    const paginatedArticles = sortedArticles.slice(
        (currentPage - 1) * ARTICLES_PER_PAGE,
        currentPage * ARTICLES_PER_PAGE,
    );

    const handleTabChange = (key: string) => {
        setActiveTab(key);
        setCurrentPage(1);
    };

    const handleSortChange = (value: string) => {
        setSortBy(value);
        setCurrentPage(1);
    };

    if (!featuredArticle) return null;

    return (
        <div className="bg-background">
            <section className="py-28 md:py-32 md:pt-44">
                <div className="container">
                    <div className="animate-hero-stagger mx-auto max-w-3xl text-center">
                        <span className="text-sm font-semibold text-primary">{subheading}</span>
                        <h1 className="text-foreground mt-3 text-3xl tracking-tight md:text-4xl lg:text-5xl xl:text-6xl">{heading}</h1>
                        <p className="text-muted-foreground mx-auto mt-6 max-w-xl text-lg leading-relaxed md:text-xl">{description}</p>
                    </div>
                </div>
            </section>

            <main className="container mx-auto flex w-full max-w-[1220px] flex-col gap-12 pb-16 md:gap-16 md:pb-24">
                <a
                    href={featuredArticle.href}
                    className="relative hidden w-full overflow-hidden rounded-2xl outline-none select-none focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring md:block md:h-[580px] lg:h-[720px]"
                >
                    <img src={featuredArticle.thumbnailUrl} alt={featuredArticle.title} className="absolute inset-0 size-full object-cover" />

                    <div className="absolute inset-x-0 bottom-0 w-full bg-gradient-to-t from-black/60 to-transparent pt-24">
                        <div className="flex w-full flex-col gap-6 p-8">
                            <div className="flex flex-col gap-2">
                                <div className="flex gap-4">
                                    <p className="flex-1 text-2xl font-semibold text-white">{featuredArticle.title}</p>
                                    <ArrowUpRight className="size-6 shrink-0 text-white" />
                                </div>
                                <p className="line-clamp-2 text-base text-white/90">{featuredArticle.summary}</p>
                            </div>
                            <div className="flex gap-6">
                                <div className="flex flex-1 gap-8">
                                    <div className="flex flex-col gap-2">
                                        <p className="text-sm font-semibold text-white">Written by</p>
                                        <div className="flex items-center gap-2">
                                            <Avatar focusable size="md" src={featuredArticle.author.avatarUrl} alt={featuredArticle.author.name} />
                                            <p className="text-sm font-semibold text-white">{featuredArticle.author.name}</p>
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <p className="text-sm font-semibold text-white">Published on</p>
                                        <div className="flex h-10 items-center">
                                            <p className="text-base font-semibold text-white">{featuredArticle.publishedAt}</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex flex-col gap-2">
                                    <p className="text-sm font-semibold text-white">File under</p>
                                    <ul className="flex h-10 items-center gap-2">
                                        {featuredArticle.tags.map((tag) => (
                                            <li
                                                key={tag.name}
                                                className="rounded-full bg-transparent px-2 py-0.5 text-xs font-medium text-white ring-1 ring-white ring-inset"
                                            >
                                                {tag.name}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                </a>

                <div className="md:hidden">
                    <Simple01Vertical article={featuredArticle} />
                </div>

                <div className="flex flex-col items-end gap-8 md:flex-row">
                    <Tabs className="w-full" selectedKey={activeTab} onSelectionChange={(key) => handleTabChange(key as string)}>
                        <TabList type="underline" size="md" items={tabs} className="overflow-auto" />
                    </Tabs>

                    <div className="relative w-full md:max-w-44">
                        <Select value={sortBy} onValueChange={handleSortChange}>
                            <SelectTrigger aria-label="Sort by">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {sortByOptions.map((item) => (
                                    <SelectItem key={item.id} value={item.id}>
                                        {item.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {paginatedArticles.length > 0 ? (
                    <ul className="grid grid-cols-1 gap-x-8 gap-y-12 md:grid-cols-2 md:gap-y-12 lg:grid-cols-3">
                        {paginatedArticles.map((article) => (
                            <li key={article.id}>
                                <Simple01Vertical article={article} />
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="text-base text-muted-foreground">No posts in this category yet.</p>
                )}

                {totalPages > 1 && (
                    <PaginationPageDefault
                        rounded
                        page={currentPage}
                        total={totalPages}
                        onPageChange={setCurrentPage}
                    />
                )}
            </main>
        </div>
    );
};
