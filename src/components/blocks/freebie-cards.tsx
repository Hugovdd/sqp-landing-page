import { ArrowRight, Download } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface Freebie {
  id: string;
  title: string;
  tagline: string;
  heroImage?: string;
  slug: string;
}

interface FreebieCardsProps {
  freebies: Freebie[];
  heading?: string;
  description?: string;
  className?: string;
}

export const FreebieCards = ({
  freebies,
  heading,
  description,
  className,
}: FreebieCardsProps) => {
  return (
    <section className={cn("py-28 lg:py-32", className)}>
      <div className="container">
        {(heading || description) && (
          <div className="mb-12 max-w-2xl space-y-4">
            {heading && (
              <h2 className="text-2xl tracking-tight md:text-4xl lg:text-5xl">
                {heading}
              </h2>
            )}
            {description && (
              <p className="text-muted-foreground leading-relaxed">
                {description}
              </p>
            )}
          </div>
        )}

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {freebies.map((freebie) => (
            <Card
              key={freebie.id}
              className="group overflow-hidden rounded-2xl transition-shadow hover:shadow-lg"
            >
              <CardContent className="flex h-full flex-col p-0">
                {freebie.heroImage && (
                  <div className="bg-muted relative aspect-video overflow-hidden">
                    <img
                      src={freebie.heroImage}
                      alt={`${freebie.title} preview`}
                      className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
                      width={600}
                      height={338}
                      loading="lazy"
                    />
                  </div>
                )}

                <div className="flex flex-1 flex-col gap-4 p-6">
                  <div className="flex-1">
                    <div className="text-primary mb-2 flex items-center gap-1.5 text-sm font-medium">
                      <Download className="size-3.5" />
                      Free
                    </div>
                    <h3 className="text-foreground mb-1.5 text-lg font-semibold">
                      {freebie.title}
                    </h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      {freebie.tagline}
                    </p>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    className="group/btn w-full gap-1"
                    asChild
                  >
                    <a href={freebie.slug}>
                      View details
                      <ArrowRight className="size-4 transition-transform group-hover/btn:translate-x-0.5" />
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};
