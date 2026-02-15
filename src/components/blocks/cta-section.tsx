import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface CTASectionProps {
  title: string;
  tagline: string;
  price: number;
  currency: string;
  status: "available" | "coming_soon" | "discontinued";
  checkoutUrl: string;
  stats: { value: string; label: string }[];
  className?: string;
}

export const CTASection = ({
  title,
  tagline,
  price,
  currency,
  status,
  checkoutUrl,
  stats,
  className,
}: CTASectionProps) => {
  const formattedPrice =
    price === 0
      ? "Free"
      : new Intl.NumberFormat("en-US", {
          style: "currency",
          currency,
          minimumFractionDigits: 0,
        }).format(price);

  return (
    <section className={cn("py-28 lg:py-32", className)}>
      <div className="container">
        <div className="bg-muted mx-auto max-w-3xl rounded-3xl p-8 text-center md:p-12 lg:p-16">
          <h2 className="text-2xl tracking-tight md:text-4xl lg:text-5xl">
            Get {title}
          </h2>
          <p className="text-muted-foreground mx-auto mt-4 max-w-lg leading-relaxed">
            {tagline}
          </p>

          {/* Stats */}
          {stats.length > 0 && (
            <div className="mt-8 flex justify-center gap-8">
              {stats.map((stat) => (
                <div key={stat.label}>
                  <div className="text-foreground text-2xl font-bold">
                    {stat.value}
                  </div>
                  <div className="text-muted-foreground text-sm">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* CTA */}
          <div className="mt-8">
            {status === "available" ? (
              <Button size="lg" asChild>
                <a href={checkoutUrl}>
                  Buy for {formattedPrice}
                </a>
              </Button>
            ) : status === "coming_soon" ? (
              <p className="text-muted-foreground text-sm">
                Coming soon — sign up above to get notified.
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
};
