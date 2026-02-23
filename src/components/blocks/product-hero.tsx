import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DashedLine } from "@/components/dashed-line";
import { VideoPlayer } from "@/components/video-player";
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
  heroVideoShowControls?: boolean;
  heroImage?: string;
  stats: { value: string; label: string }[];
  showDivider?: boolean;
  mediaStyle?: "default" | "card";
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
  heroVideoShowControls = true,
  heroImage,
  stats,
  showDivider = true,
  mediaStyle = "default",
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
    <section className={cn("py-28 md:py-32 md:pt-44", className)}>
      <div className="container">
        <div
          className={cn(
            "grid items-center gap-12",
            showDivider
              ? "lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] lg:gap-0"
              : "lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] lg:gap-10",
          )}
        >
          {/* Left: Content */}
          <div
            className={cn(
              "animate-hero-stagger flex flex-col gap-6",
              showDivider ? "lg:pr-10" : "lg:pr-2",
            )}
          >
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
                    <a href={checkoutUrl} className="lemonsqueezy-button">Buy for {formattedPrice}</a>
                  </Button>
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

          {showDivider && (
            <DashedLine
              orientation="vertical"
              className="hidden h-full self-stretch lg:block"
            />
          )}

          {/* Right: Video or Image */}
          <div
            className={cn("relative", !showDivider && "lg:justify-self-start")}
            style={{
              opacity: 0,
              animation:
                "hero-fade-up 0.6s cubic-bezier(0.25,0.46,0.45,0.94) 0.3s forwards",
            }}
          >
            {mediaStyle === "card" ? (
              <div
                className={cn(
                  "bg-card border-border w-full overflow-hidden rounded-2xl border shadow-sm",
                  showDivider && "max-w-xl",
                )}
              >
                {heroVideo ? (
                  <VideoPlayer
                    src={heroVideo}
                    poster={heroImage}
                    className={
                      !heroVideoShowControls
                        ? "[&>div.absolute]:hidden [&>video]:cursor-default"
                        : undefined
                    }
                  />
                ) : heroImage ? (
                  <div className="bg-muted relative aspect-video overflow-hidden">
                    <img
                      src={heroImage}
                      alt={`${title} preview`}
                      className="size-full object-cover"
                      width={800}
                      height={450}
                      loading="eager"
                    />
                  </div>
                ) : (
                  <div className="bg-muted flex aspect-video items-center justify-center">
                    <span className="text-muted-foreground text-lg">
                      Preview coming soon
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <>
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
                ) : null}
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
