import {
  AlertTriangle,
  FileSpreadsheet,
  Globe,
  Languages,
  Layers,
  Paintbrush,
  Pin,
  Sparkles,
  Table,
  Target,
  Type,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";

export const iconMap: Record<string, LucideIcon> = {
  AlertTriangle,
  FileSpreadsheet,
  Globe,
  Languages,
  Layers,
  Paintbrush,
  Pin,
  Sparkles,
  Table,
  Target,
  Type,
};

interface FeatureChipsProps {
  features: { icon: string; title: string }[];
  className?: string;
}

export function FeatureChips({ features, className }: FeatureChipsProps) {
  return (
    <div className={cn("grid grid-cols-2 gap-x-6 gap-y-3", className)}>
      {features.map((f) => {
        const Icon = iconMap[f.icon];
        return (
          <div key={f.title} className="flex items-center gap-2.5 text-sm">
            {Icon && <Icon className="text-muted-foreground size-4 shrink-0" />}
            <span>{f.title}</span>
          </div>
        );
      })}
    </div>
  );
}
