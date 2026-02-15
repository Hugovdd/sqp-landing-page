import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface HeroProps {
  title?: string;
  subtitle?: string;
  ctaText?: string;
  ctaHref?: string;
  secondaryCtaText?: string;
  secondaryCtaHref?: string;
  className?: string;
}

export const Hero = ({
  title = "After Effects tools for motion designers",
  subtitle = "Professional plugins, extensions, and scripts to speed up your After Effects workflow.",
  ctaText = "Browse Products",
  ctaHref = "#products",
  secondaryCtaText,
  secondaryCtaHref,
  className,
}: HeroProps) => {
  return (
    <section className={cn("py-28 lg:py-32 lg:pt-44", className)}>
      <div className="container">
        <div className="animate-hero-stagger mx-auto max-w-3xl text-center">
          <h1 className="text-foreground text-3xl tracking-tight md:text-4xl lg:text-5xl xl:text-6xl">
            {title}
          </h1>

          <p className="text-muted-foreground mx-auto mt-6 max-w-xl text-lg leading-relaxed md:text-xl">
            {subtitle}
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Button size="lg" asChild>
              <a href={ctaHref}>{ctaText}</a>
            </Button>
            {secondaryCtaText && secondaryCtaHref && (
              <Button variant="outline" size="lg" className="gap-2" asChild>
                <a href={secondaryCtaHref}>
                  {secondaryCtaText}
                  <ArrowRight className="size-4" />
                </a>
              </Button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
