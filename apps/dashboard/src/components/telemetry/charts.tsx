"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  XAxis,
} from "recharts";

import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

export interface Series {
  key: string;
  label: string;
  color?: string;
}

function buildConfig(series: Series[]): ChartConfig {
  return Object.fromEntries(
    series.map((s, i) => [
      s.key,
      { label: s.label, color: s.color ?? `var(--chart-${(i % 5) + 1})` },
    ]),
  );
}

const empty = (
  <div className="text-muted-foreground flex h-[240px] items-center justify-center text-sm">
    No data in range
  </div>
);

export function LineSeriesChart({
  data,
  xKey,
  series,
  className,
}: {
  data: unknown[];
  xKey: string;
  series: Series[];
  className?: string;
}) {
  if (data.length === 0) return empty;
  return (
    <ChartContainer config={buildConfig(series)} className={className}>
      <LineChart accessibilityLayer data={data} margin={{ left: 12, right: 12 }}>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey={xKey}
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          minTickGap={28}
        />
        <ChartTooltip content={<ChartTooltipContent />} />
        {series.map((s) => (
          <Line
            key={s.key}
            dataKey={s.key}
            type="monotone"
            stroke={`var(--color-${s.key})`}
            strokeWidth={2}
            dot={false}
          />
        ))}
      </LineChart>
    </ChartContainer>
  );
}

export function BarSeriesChart({
  data,
  xKey,
  series,
  className,
}: {
  data: unknown[];
  xKey: string;
  series: Series[];
  className?: string;
}) {
  if (data.length === 0) return empty;
  return (
    <ChartContainer config={buildConfig(series)} className={className}>
      <BarChart accessibilityLayer data={data} margin={{ left: 12, right: 12 }}>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey={xKey}
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          minTickGap={28}
        />
        <ChartTooltip content={<ChartTooltipContent />} />
        {series.map((s) => (
          <Bar
            key={s.key}
            dataKey={s.key}
            fill={`var(--color-${s.key})`}
            radius={[4, 4, 0, 0]}
          />
        ))}
      </BarChart>
    </ChartContainer>
  );
}
