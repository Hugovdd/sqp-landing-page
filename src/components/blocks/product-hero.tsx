import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DashedLine } from "@/components/dashed-line";
import { cn } from "@/lib/utils";

interface ProductHeroProps {
  title: string;
  tagline: string;
  price: number;
  currency: string;
  version: string;
  status: "available" | "coming_soon" | "discontinued";
  supportedApp: string;
  extensionType: string;
  checkoutUrl: string;
  heroVideo?: string;
  heroImage?: string;
  stats: { value: string; label: string }[];
  className?: string;
}

export const ProductHero = ({
  title,
  tagline,
  price,
  currency,
  version,
  status,
  supportedApp,
  checkoutUrl,
  heroVideo,
  heroImage,
  stats,
  className,
}: ProductHeroProps) => {
  const formattedPrice =
    price === 0
      ? "Free"
      : new Intl.NumberFormat("en-US", {
          style: "currency",
          currency,
          minimumFractionDigits: 0,
        }).format(price);

  return (
    <section className={cn("py-28 lg:py-32 lg:pt-44", className)}>
      <div className="container">
        <div className="grid items-center gap-12 lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] lg:gap-0">
          {/* Left: Content */}
          <div className="flex flex-col gap-6 lg:pr-10">
            <div className="flex items-center gap-3">
              {status === "coming_soon" && (
                <Badge variant="secondary" className="text-xs uppercase">
                  Coming Soon
                </Badge>
              )}
              {status === "available" && (
                <Badge variant="secondary" className="text-xs">
                  v{version}
                </Badge>
              )}
              <span className="text-muted-foreground text-sm">
                {supportedApp}
              </span>
            </div>

            <h1 className="text-3xl tracking-tight md:text-4xl lg:text-5xl">
              {title}
            </h1>

            <p className="text-muted-foreground text-lg leading-relaxed md:text-xl">
              {tagline}
            </p>

            {/* Price + CTA */}
            <div className="flex flex-wrap items-center gap-4">
              {status === "available" ? (
                <>
                  <Button size="lg" asChild>
                    <a href={checkoutUrl}>Buy for {formattedPrice}</a>
                  </Button>
                  <span className="text-muted-foreground text-sm">
                    14-day money-back guarantee
                  </span>
                </>
              ) : status === "coming_soon" ? (
                <p className="text-muted-foreground text-sm">
                  Sign up below to get notified when it launches.
                </p>
              ) : null}
            </div>

            {/* Stats */}
            {stats.length > 0 && (
              <div className="mt-4 flex gap-8">
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
          </div>

          <DashedLine
            orientation="vertical"
            className="hidden h-full self-stretch lg:block"
          />

          {/* Right: Video or Image */}
          <div className="relative">
            {heroVideo ? (
              <video
                src={heroVideo}
                autoPlay
                loop
                muted
                playsInline
                className="w-full object-contain object-left"
              />
            ) : heroImage ? (
              <img
                src={heroImage}
                alt={`${title} preview`}
                className="block w-5/6 object-contain object-left"
                width={800}
                height={450}
                loading="eager"
              />
            ) : (
              <div className="bg-muted flex aspect-video items-center justify-center">
                <span className="text-muted-foreground text-lg">
                  Preview coming soon
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
