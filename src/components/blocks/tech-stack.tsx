import { cn } from "@/lib/utils";

interface TechItem {
  name: string;
  icon: string;
  label?: string;
}

interface TechStackProps {
  items: TechItem[];
  heading?: string;
  className?: string;
}

export const TechStack = ({
  items,
  heading = "Built with",
  className,
}: TechStackProps) => {
  if (items.length === 0) return null;

  return (
    <section className={cn("py-16 lg:py-20", className)}>
      <div className="container">
        <div className="text-center">
          <h2 className="text-muted-foreground mb-8 text-sm font-medium tracking-wider uppercase">
            {heading}
          </h2>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-8 lg:gap-16">
          {items.map((item) => (
            <div
              key={item.name}
              className="flex flex-col items-center gap-2 transition-opacity hover:opacity-75"
            >
              <img
                src={item.icon}
                alt={`${item.name} logo`}
                width={48}
                height={48}
                className="size-12 object-contain dark:invert"
              />
              <span className="text-muted-foreground text-xs font-medium">
                {item.label || item.name}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
