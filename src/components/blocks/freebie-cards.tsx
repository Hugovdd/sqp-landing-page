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
  isClickable: boolean;
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
            <div key={freebie.id} className="flex h-full flex-col gap-4">
              <Card className="bg-muted/40 group gap-0 overflow-hidden rounded-2xl border-none py-0 transition-shadow hover:shadow-lg">
                <CardContent className="p-0">
                  {freebie.isClickable ? (
                    <a href={freebie.slug} aria-label={`View ${freebie.title} details`}>
                      <div className="bg-muted relative aspect-[16/9] w-full overflow-hidden">
                        {freebie.heroImage ? (
                          <img
                            src={freebie.heroImage}
                            alt={`${freebie.title} preview`}
                            className="absolute inset-0 block size-full object-cover transition-transform duration-300 group-hover:scale-105"
                            width={1600}
                            height={900}
                            loading="lazy"
                          />
                        ) : (
                          <div className="text-muted-foreground absolute inset-0 flex items-center justify-center text-sm">
                            Preview coming soon
                          </div>
                        )}
                      </div>
                    </a>
                  ) : (
                    <div className="bg-muted relative aspect-[16/9] w-full overflow-hidden">
                      {freebie.heroImage ? (
                        <img
                          src={freebie.heroImage}
                          alt={`${freebie.title} preview`}
                          className="absolute inset-0 block size-full object-cover transition-transform duration-300 group-hover:scale-105"
                          width={1600}
                          height={900}
                          loading="lazy"
                        />
                      ) : (
                        <div className="text-muted-foreground absolute inset-0 flex items-center justify-center text-sm">
                          Preview coming soon
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              <div className="flex flex-1 flex-col gap-4">
                <div className="flex-1">
                  <div className="mb-2 flex items-start justify-between gap-3">
                    <h3 className="text-foreground text-xl font-semibold tracking-tight">
                      {freebie.isClickable ? (
                        <a href={freebie.slug} className="hover:text-primary transition-colors">
                          {freebie.title}
                        </a>
                      ) : (
                        freebie.title
                      )}
                    </h3>
                    {freebie.isClickable ? (
                      <a
                        href={freebie.slug}
                        className="text-primary hover:bg-muted/80 flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors"
                      >
                        <Download className="size-3.5" />
                        Free
                      </a>
                    ) : (
                      <div className="text-primary flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium">
                        <Download className="size-3.5" />
                        Free
                      </div>
                    )}
                  </div>
                  {freebie.isClickable ? (
                    <a
                      href={freebie.slug}
                      className="text-muted-foreground hover:text-foreground block text-sm leading-relaxed transition-colors"
                    >
                      {freebie.tagline}
                    </a>
                  ) : (
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      {freebie.tagline}
                    </p>
                  )}
                </div>

                {freebie.isClickable ? (
                  <Button
                    variant="secondary"
                    size="sm"
                    className="group/btn w-full gap-1 md:hidden"
                    asChild
                  >
                    <a href={freebie.slug}>
                      View details
                      <ArrowRight className="size-4 transition-transform group-hover/btn:translate-x-0.5" />
                    </a>
                  </Button>
                ) : (
                  <Button
                    variant="secondary"
                    size="sm"
                    className="w-full gap-1 opacity-70"
                    disabled
                    aria-label={`${freebie.title} coming soon`}
                  >
                    Coming soon
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
