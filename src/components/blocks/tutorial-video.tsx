import { cn } from "@/lib/utils";

interface TutorialVideoProps {
  youtubeId: string;
  heading?: string;
  description?: string;
  className?: string;
}

export const TutorialVideo = ({
  youtubeId,
  heading = "Watch the tutorial",
  description,
  className,
}: TutorialVideoProps) => {
  return (
    <section className={cn("py-28 lg:py-32", className)}>
      <div className="container">
        <div className="mx-auto max-w-3xl space-y-10">
          {(heading || description) && (
            <div className="space-y-3">
              {heading && (
                <h2 className="text-2xl tracking-tight md:text-3xl lg:text-4xl">
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

          <div className="bg-card border-border overflow-hidden rounded-2xl border shadow-sm">
            <div className="relative aspect-[16/10] w-full">
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${youtubeId}?rel=0&modestbranding=1`}
                title={heading ?? "Tutorial video"}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                loading="lazy"
                className="absolute inset-0 size-full"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
