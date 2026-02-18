import { ArrowRight } from "lucide-react";

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
  checkoutUrl?: string;
  features?: { title: string; description?: string }[];
}

interface ProductShowcaseProps {
  products: Product[];
  heading?: string;
  description?: string;
  className?: string;
}

const placeholderImages = [
  "https://static.wixstatic.com/media/7e521c_b0ef000940f94f8dab0d3717447e7ce7~mv2.jpg/v1/fill/w_972,h_708,al_c,q_85,usm_0.66_1.00_0.01,enc_avif,quality_auto/Default%20mode.jpg",
  "https://static.wixstatic.com/media/7e521c_6a3aacc163064dc8a2dbb53e4d6fe913~mv2.jpg/v1/fill/w_972,h_708,al_c,q_85,usm_0.66_1.00_0.01,enc_avif,quality_auto/Ready%20to%20use%2C%20instantly.jpg",
  "https://static.wixstatic.com/media/7e521c_22eddcf7e947417f80b180080d1fc70a~mv2.jpg/v1/fill/w_972,h_708,al_c,q_85,usm_0.66_1.00_0.01,enc_avif,quality_auto/Real%20backed%2C%20real%20results.jpg",
];

export const ProductShowcase = ({
  products,
  heading,
  description,
  className,
}: ProductShowcaseProps) => {
  return (
    <section className={cn("relative", className)}>
      <div className="w-full mx-auto grid box-border pt-[16.67vw] pr-[5.6vw] pb-[16.67vw] pl-[5.6vw] gap-[5.55vw] md:pt-[14.3vw] md:pr-[6.5vw] md:pb-[14.3vw] md:pl-[6.5vw] md:gap-[1.8vw] desktop:pt-[6.8vw] desktop:pr-[7.8125vw] desktop:pb-[7.65vw] desktop:pl-[7.8125vw] desktop:gap-[0.625vw]">
        {/* Header */}
        {(heading || description) && (
          <header className="w-full mx-auto grid justify-items-center text-center gap-[2vw] desktop:w-[40vw] desktop:gap-[1.2vw]">
            {heading && (
              <h2 className="m-0 text-foreground font-semibold leading-[1.1] tracking-[-0.02em] text-[clamp(1.875rem,8.3vw,2.4rem)] md:text-[clamp(2.2rem,7.55vw,3.625rem)] desktop:text-[clamp(2.5rem,3.75vw,4.5rem)]">
                {heading}
              </h2>
            )}
            {description && (
              <p className="m-0 text-muted-foreground leading-[1.4] text-[clamp(1rem,4.44vw,1.2rem)] md:text-[clamp(1rem,2.6vw,1.25rem)] desktop:text-[clamp(1rem,1.041vw,1.25rem)]">
                {description}
              </p>
            )}
          </header>
        )}

        {/* Product cards */}
        {products.map((product, index) => {
          const isReversed = index % 2 !== 0;
          const zIndex = 20 + (index + 1) * 10;
          const image = placeholderImages[index % placeholderImages.length];

          const formattedPrice =
            product.price === 0
              ? "Free"
              : new Intl.NumberFormat("en-US", {
                  style: "currency",
                  currency: product.currency,
                  minimumFractionDigits: 0,
                }).format(product.price);

          return (
            <article
              key={product.id}
              className="grid grid-cols-1 relative desktop:grid-cols-[0.9975fr_1fr] desktop:sticky desktop:top-[8vw]"
              style={{ zIndex }}
            >
              {/* Image */}
              <img
                className={cn(
                  "block w-full object-cover h-[73.9vw] rounded-[14px] md:h-[59.9vw] md:rounded-[20px] desktop:h-[30.73vw] desktop:rounded-[40px]",
                  isReversed && "desktop:order-2"
                )}
                src={image}
                alt={`${product.title} preview`}
                loading="lazy"
              />

              {/* Text panel */}
              <div className="bg-[#faf9f7] dark:bg-card grid content-center rounded-[14px] py-[13.89vw] px-[8.33vw] gap-[3.88vw] md:min-h-[59.9vw] md:pt-[6.77vw] md:pr-[4vw] md:pb-[6vw] md:pl-[5.2vw] md:gap-[3.35vw] md:rounded-[20px] desktop:min-h-0 desktop:py-0 desktop:pr-[6.61vw] desktop:pl-[5.21vw] desktop:gap-[1.35vw] desktop:rounded-[40px]">
                <div className="flex flex-col gap-4 desktop:gap-[1.35vw]">
                  {/* Badges */}
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs capitalize">
                      {product.category}
                    </Badge>
                    {product.status === "coming_soon" && (
                      <Badge variant="secondary" className="text-xs uppercase">
                        Coming Soon
                      </Badge>
                    )}
                  </div>

                  {/* Title */}
                  <h3 className="m-0 text-foreground font-normal leading-[1.1] tracking-[-0.02em] text-[clamp(1.625rem,7.2vw,2.25rem)] md:text-[clamp(2rem,6.25vw,3rem)] desktop:text-[clamp(2rem,3.33vw,4rem)]">
                    {product.title}
                  </h3>

                  {/* Tagline */}
                  <p className="m-0 w-full text-muted-foreground leading-[1.4] text-[clamp(1rem,4.44vw,1.2rem)] md:text-[clamp(1rem,2.6vw,1.25rem)] desktop:w-[22vw] desktop:text-[clamp(1rem,1.041vw,1.25rem)]">
                    {product.tagline}
                  </p>

                  {/* Price + CTA */}
                  <div className="flex items-center gap-4 mt-2">
                    <Button size="lg" className="rounded-full px-8" asChild>
                      <a href={product.checkoutUrl ?? product.slug}>
                        {product.status === "coming_soon"
                          ? "Coming Soon"
                          : `Get for ${formattedPrice}`}
                      </a>
                    </Button>
                    <Button
                      size="lg"
                      variant="outline"
                      className="rounded-full px-8"
                      asChild
                    >
                      <a href={product.slug}>
                        Learn more{" "}
                        <ArrowRight className="ml-2 size-4" />
                      </a>
                    </Button>
                  </div>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
};
