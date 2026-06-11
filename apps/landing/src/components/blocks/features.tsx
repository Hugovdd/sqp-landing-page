import * as LucideIcons from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { DashedLine } from "../dashed-line";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface Feature {
  title: string;
  description: string;
  icon: string;
  image?: string;
  video?: string;
}

interface FeaturesProps {
  features: Feature[];
  heading?: string;
  description?: string;
  className?: string;
}

// Dynamically resolve a Lucide icon by name
function getIcon(name: string): LucideIcon {
  const icons = LucideIcons as Record<string, LucideIcon>;
  return icons[name] || LucideIcons.HelpCircle;
}

export const Features = ({
  features,
  heading,
  description,
  className,
}: FeaturesProps) => {
  // Check if any feature has an image or video to decide on the layout
  const hasRichFeatures = features.some((f) => f.image || f.video);

  return (
    <section className={cn("py-28 lg:py-32", className)}>
      <div className="container">
        {/* Top dashed line with text */}
        <div className="relative flex items-center justify-center">
          <DashedLine className="text-muted-foreground" />
          <span className="bg-muted text-muted-foreground absolute px-3 font-mono text-sm font-medium tracking-wide max-md:hidden">
            FEATURES
          </span>
        </div>

        {/* Optional heading */}
        {(heading || description) && (
          <div className="mx-auto mt-10 mb-16 text-center">
            {heading && (
              <h2 className="text-3xl font-bold md:text-4xl lg:text-5xl tracking-tight">
                {heading}
              </h2>
            )}
            {description && (
              <p className="text-muted-foreground mt-4 text-xl max-w-2xl mx-auto leading-snug">
                {description}
              </p>
            )}
          </div>
        )}

        {hasRichFeatures ? (
          /* Rich features layout: alternating rows with images/videos */
          <div className="grid gap-24 lg:gap-32 mt-16">
            {features.map((feature, index) => {
              const Icon = getIcon(feature.icon);
              const isEven = index % 2 === 0;
              return (
                <div 
                  key={feature.title} 
                  className="grid items-center gap-12 lg:grid-cols-2 lg:gap-20"
                >
                  <div className={cn(
                    "space-y-6", 
                    !isEven && "lg:order-last lg:text-right lg:flex lg:flex-col lg:items-end"
                  )}>
                    <div className="bg-primary/10 text-primary inline-flex rounded-lg p-3">
                      <Icon className="size-6" />
                    </div>
                    <h3 className="text-3xl font-bold tracking-tight">
                      {feature.title}
                    </h3>
                    <p className="text-muted-foreground text-lg leading-relaxed max-w-xl">
                      {feature.description}
                    </p>
                  </div>

                  <div className={cn(
                    "relative overflow-hidden rounded-2xl border bg-card shadow-xl",
                    !isEven && "lg:order-first"
                  )}>
                    {feature.video ? (
                      <video
                        src={feature.video}
                        autoPlay
                        loop
                        muted
                        playsInline
                        className="aspect-video w-full object-cover"
                      />
                    ) : feature.image ? (
                      <img
                        src={feature.image}
                        alt={feature.title}
                        className="w-full h-auto object-cover aspect-video"
                        loading="lazy"
                      />
                    ) : (
                      <div className="bg-muted flex aspect-video items-center justify-center">
                        <Icon className="text-muted-foreground size-12 opacity-20" />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Simple grid layout for features without images/videos */
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:mt-16 lg:grid-cols-4">
            {features.map((feature) => {
              const Icon = getIcon(feature.icon);
              return (
                <Card key={feature.title} className="rounded-2xl">
                  <CardContent className="p-6">
                    <div className="bg-primary/10 text-primary mb-4 inline-flex rounded-lg p-2.5">
                      <Icon className="size-5" />
                    </div>
                    <h3 className="text-foreground mb-2 font-semibold">
                      {feature.title}
                    </h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
};
