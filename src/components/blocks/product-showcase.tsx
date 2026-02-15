import { ArrowRight, Check } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Product {
  id: string;
  title: string;
  tagline: string;
  price: number;
  currency: string;
  status: "available" | "coming_soon" | "discontinued";
  category: "plugin" | "script" | "freebie";
  heroImage?: string;
  slug: string;
  features?: { title: string; description?: string }[];
}

interface ProductShowcaseProps {
  products: Product[];
  heading?: string;
  description?: string;
  className?: string;
}

export const ProductShowcase = ({
  products,
  heading,
  description,
  className,
}: ProductShowcaseProps) => {
  return (
    <section className={cn("py-24 lg:py-32", className)}>
      <div className="container">
        {(heading || description) && (
          <div className="mb-16 md:mb-24 md:text-center">
            {heading && (
              <h2 className="text-3xl tracking-tight md:text-4xl lg:text-5xl">
                {heading}
              </h2>
            )}
            {description && (
              <p className="text-muted-foreground mx-auto mt-4 max-w-2xl text-lg leading-relaxed">
                {description}
              </p>
            )}
          </div>
        )}

        <div className="flex flex-col gap-24 lg:gap-32">
          {products.map((product, index) => {
            const formattedPrice =
              product.price === 0
                ? "Free"
                : new Intl.NumberFormat("en-US", {
                    style: "currency",
                    currency: product.currency,
                    minimumFractionDigits: 0,
                  }).format(product.price);

            // Format index for display (e.g., "01 / 04")
            const currentIndex = String(index + 1).padStart(2, "0");
            const totalProducts = String(products.length).padStart(2, "0");

            return (
              <div
                key={product.id}
                className="bg-card sticky top-24 grid overflow-hidden rounded-3xl border shadow-sm transition-all lg:grid-cols-2 lg:items-center"
                style={{ top: `calc(6rem + ${index * 1.5}rem)` }}
              >
                {/* Content Section - Order 2 on mobile, Order 1 on desktop */}
                <div className="order-2 flex flex-col gap-6 p-8 lg:order-1 lg:p-12 lg:pr-16">
                  <div className="text-muted-foreground font-mono text-sm tracking-wider">
                    {currentIndex} / {totalProducts}
                  </div>

                  <h3 className="text-3xl font-bold tracking-tight md:text-4xl">
                    {product.title}
                  </h3>

                  <p className="text-muted-foreground text-lg leading-relaxed">
                    {product.tagline}
                  </p>

                  {/* Features List */}
                  {product.features && product.features.length > 0 && (
                    <ul className="my-6 grid gap-3 sm:grid-cols-2">
                      {product.features.slice(0, 6).map((feature, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm">
                          <Check className="text-primary mt-1 size-4 shrink-0" />
                          <span className="text-muted-foreground">
                            {feature.title}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}

                  <div className="mt-2 flex items-center gap-4">
                    <Button size="lg" className="rounded-full px-8" asChild>
                      <a href={product.slug}>
                        {product.status === "coming_soon"
                          ? "Coming Soon"
                          : `Get for ${formattedPrice}`}
                      </a>
                    </Button>
                    
                    {product.status === "coming_soon" && (
                      <Badge variant="secondary" className="text-sm">
                        Notify me
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Visual Section - Order 1 on mobile, Order 2 on desktop */}
                <div className="order-1 h-full lg:order-2">
                  <div className="bg-muted relative h-full min-h-[300px] w-full overflow-hidden lg:min-h-full">
                    {product.heroImage ? (
                      <img
                        src={product.heroImage}
                        alt={`${product.title} preview`}
                        className="size-full object-cover transition-transform duration-500 hover:scale-105"
                        loading="lazy"
                      />
                    ) : (
                      <div className="flex size-full items-center justify-center bg-linear-to-br from-muted to-muted/50">
                        <span className="text-muted-foreground text-lg">
                          No preview available
                        </span>
                      </div>
                    )}
                    
                    {/* Floating badge */}
                    <div className="absolute top-4 left-4 bg-background/80 backdrop-blur-sm rounded-full px-3 py-1 text-xs font-medium border border-border/50">
                      {product.category}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
