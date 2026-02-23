import { ArrowRight } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FeatureChips } from "@/components/blocks/feature-chips";
import { cn } from "@/lib/utils";

interface Product {
  id: string;
  title: string;
  tagline: string;
  price: number;
  currency: string;
  status: "available" | "coming_soon" | "discontinued";
  category: "extension" | "plugin" | "script" | "freebie";
  heroImage?: string;
  slug: string;
  features?: { icon: string; title: string; description: string }[];
}

interface ProductCardsProps {
  products: Product[];
  heading?: string;
  description?: string;
  className?: string;
}

export const ProductCards = ({
  products,
  heading,
  description,
  className,
}: ProductCardsProps) => {
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

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => {
            const formattedPrice =
              product.price === 0
                ? "Free"
                : new Intl.NumberFormat("en-US", {
                    style: "currency",
                    currency: product.currency,
                    minimumFractionDigits: 0,
                  }).format(product.price);

            return (
              <Card
                key={product.id}
                className="group overflow-hidden rounded-2xl transition-shadow hover:shadow-lg"
              >
                <CardContent className="flex h-full flex-col p-0">
                  {/* Image */}
                  {product.heroImage && (
                    <div className="bg-muted shrink-0 overflow-hidden">
                      <img
                        src={product.heroImage}
                        alt={`${product.title} preview`}
                        className="block w-full h-auto transition-transform duration-300 group-hover:scale-105"
                        width={600}
                        height={338}
                        loading="lazy"
                      />
                    </div>
                  )}

                  {/* Content */}
                  <div className="flex flex-1 flex-col gap-4 p-6">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs capitalize">
                        {product.category}
                      </Badge>
                      {product.status === "coming_soon" && (
                        <Badge
                          variant="secondary"
                          className="text-xs uppercase"
                        >
                          Coming Soon
                        </Badge>
                      )}
                    </div>

                    <div className="flex-1 space-y-3">
                      <h3 className="text-foreground mb-1.5 text-lg font-semibold">
                        {product.title}
                      </h3>
                      <p className="text-muted-foreground text-sm leading-relaxed">
                        {product.tagline}
                      </p>
                      {product.features && product.features.length > 0 && (
                        <FeatureChips features={product.features} className="gap-y-2" />
                      )}
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-foreground font-semibold">
                        {formattedPrice}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="group/btn gap-1"
                        asChild
                      >
                        <a href={product.slug}>
                          Learn more
                          <ArrowRight className="size-4 transition-transform group-hover/btn:translate-x-0.5" />
                        </a>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
};
