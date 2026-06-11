import * as LucideIcons from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

interface HelpCard {
  icon: string;
  title: string;
  description: string;
  href: string;
  external?: boolean;
}

interface HelpCardsProps {
  cards: HelpCard[];
  heading?: string;
  className?: string;
}

function getIcon(name: string): LucideIcon {
  const icons = LucideIcons as Record<string, LucideIcon>;
  return icons[name] || LucideIcons.HelpCircle;
}

export const HelpCards = ({ cards, heading, className }: HelpCardsProps) => {
  return (
    <section className={cn("pb-28 lg:pb-32", className)}>
      <div className="container">
        {heading && (
          <p className="text-muted-foreground mb-6 text-sm font-medium uppercase tracking-wider">
            {heading}
          </p>
        )}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((card) => {
            const Icon = getIcon(card.icon);
            const isExternal = card.external ?? card.href.startsWith("http");
            return (
              <a
                key={card.href}
                href={card.href}
                {...(isExternal && { target: "_blank", rel: "noopener noreferrer" })}
                className="bg-card hover:bg-muted/60 group flex flex-col gap-8 rounded-2xl border p-6 transition-colors"
              >
                <Icon className="text-muted-foreground size-5" />
                <div>
                  <h2 className="text-foreground mb-2 font-semibold">
                    {card.title}
                  </h2>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {card.description}
                  </p>
                </div>
              </a>
            );
          })}
        </div>
      </div>
    </section>
  );
};
