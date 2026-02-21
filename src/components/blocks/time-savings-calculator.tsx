import { useState } from "react";

import { cn } from "@/lib/utils";

const SIZES = [
  { label: "16:9", pw: 44, ph: 25 },
  { label: "1:1", pw: 36, ph: 36 },
  { label: "9:16", pw: 25, ph: 44 },
  { label: "4:5", pw: 32, ph: 40 },
] as const;

const LANGUAGE_OPTIONS = [
  { label: "5", value: 5 },
  { label: "10", value: 10 },
  { label: "20", value: 20 },
  { label: "45+", value: 45 },
] as const;

// Conservative estimate: duplicate comp, translate text, swap fonts, fix layout
const MINUTES_PER_COMP_MANUAL = 12;

// AE Sheets: fixed setup (open tool, configure, click batch) + ~10s per comp for AE to process
const AE_SHEETS_SETUP_MINUTES = 8;
const AE_SHEETS_SECONDS_PER_COMP = 10;

function calcAESheetsMinutes(comps: number): number {
  return AE_SHEETS_SETUP_MINUTES + (comps * AE_SHEETS_SECONDS_PER_COMP) / 60;
}

function formatTime(totalMinutes: number): { value: string; unit: string } {
  if (totalMinutes < 60) {
    return {
      value: String(Math.round(totalMinutes)),
      unit: Math.round(totalMinutes) === 1 ? "minute" : "minutes",
    };
  }
  const hours = Math.round((totalMinutes / 60) * 10) / 10;
  return { value: String(hours), unit: hours === 1 ? "hour" : "hours" };
}

function formatAESheetsTime(minutes: number): string {
  if (minutes < 60) return `~${Math.round(minutes)} min`;
  const hours = Math.round((minutes / 60) * 10) / 10;
  return `~${hours} hr`;
}

function getTagline(minutes: number): string {
  if (minutes < 30) return "Think of all those keyframes you could be easing instead.";
  if (minutes < 60) return "You didn't get into motion design to rename comps. We assume.";
  if (minutes < 180) return "Don't Command+Tab yourself into oblivion.";
  if (minutes < 360) return "Somewhere a client is asking for 'one small change'. You'll never hear about it — you're too busy renaming comps.";
  if (minutes < 600) return "A full work day of not doing motion design. Bold creative choice.";
  return "At this point, just send the client a spreadsheet and call it art.";
}

export function TimeSavingsCalculator() {
  const [selectedSizes, setSelectedSizes] = useState<string[]>(["16:9", "9:16"]);
  const [languages, setLanguages] = useState(10);

  const toggleSize = (label: string) => {
    setSelectedSizes((prev) =>
      prev.includes(label) ? prev.filter((s) => s !== label) : [...prev, label],
    );
  };

  const totalComps = selectedSizes.length * languages;
  const manualMinutes = totalComps * MINUTES_PER_COMP_MANUAL;
  const aeSheetsMinutes = calcAESheetsMinutes(totalComps);
  const { value, unit } = formatTime(manualMinutes);
  const tagline = getTagline(manualMinutes);
  const hasSelection = selectedSizes.length > 0;

  return (
    <section className="py-28 lg:py-32">
      <div className="container">
        <div className="mx-auto max-w-3xl">
          {/* Heading */}
          <div className="mb-12 text-center">
            <h2 className="text-3xl tracking-tight md:text-4xl lg:text-5xl">
              The math your client never does
            </h2>
            <p className="text-muted-foreground mx-auto mt-4 max-w-xl text-lg leading-relaxed">
              Delivering video in multiple languages and formats? Pick your
              deliverable mix and see what manual After Effects localisations
              actually costs you.
            </p>
          </div>

          {/* Calculator card */}
          <div className="bg-muted rounded-3xl p-8 md:p-10">
            <div className="grid gap-8 md:grid-cols-[1fr_auto]">
              {/* Controls */}
              <div className="flex flex-col gap-8">
                {/* Aspect ratios */}
                <div>
                  <p className="text-muted-foreground mb-4 text-xs font-semibold uppercase tracking-widest">
                    Aspect ratios
                  </p>
                  <div className="flex gap-3">
                    {SIZES.map(({ label, pw, ph }) => {
                      const active = selectedSizes.includes(label);
                      return (
                        <button
                          key={label}
                          onClick={() => toggleSize(label)}
                          aria-pressed={active}
                          className={cn(
                            "flex w-full flex-col items-center gap-2.5 rounded-xl border-2 px-2 py-3 transition-all duration-150 cursor-pointer",
                            active
                              ? "border-primary bg-primary/10 text-primary"
                              : "border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground",
                          )}
                        >
                          {/* Visual ratio preview */}
                          <div className="flex h-11 w-11 items-center justify-center">
                            <div
                              className={cn(
                                "rounded-[3px] border-[2.5px] transition-colors",
                                active ? "border-primary" : "border-current",
                              )}
                              style={{ width: pw, height: ph }}
                            />
                          </div>
                          <span className="text-xs font-semibold tabular-nums">
                            {label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Languages */}
                <div>
                  <p className="text-muted-foreground mb-4 text-xs font-semibold uppercase tracking-widest">
                    Languages
                  </p>
                  <div className="flex gap-2">
                    {LANGUAGE_OPTIONS.map(({ label, value: val }) => (
                      <button
                        key={label}
                        onClick={() => setLanguages(val)}
                        aria-pressed={languages === val}
                        className={cn(
                          "flex-1 cursor-pointer rounded-xl border-2 py-3 text-sm font-semibold transition-all duration-150",
                          languages === val
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground",
                        )}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Result panel */}
              <div className="bg-card border-border flex min-w-48 flex-col items-center justify-center rounded-2xl border p-8 text-center">
                {hasSelection ? (
                  <>
                    <p className="text-muted-foreground mb-2 text-xs font-semibold uppercase tracking-widest">
                      Manual workflow
                    </p>
                    <div className="text-foreground text-5xl font-bold leading-none tracking-tight">
                      {value}
                    </div>
                    <div className="text-muted-foreground mt-1.5 text-base font-medium">
                      {unit}
                    </div>
                    <div className="border-border my-5 w-8 border-t" />
                    <p className="text-muted-foreground mb-1 text-xs">
                      With AE Sheets
                    </p>
                    <p className="text-foreground text-lg font-bold">
                      {formatAESheetsTime(aeSheetsMinutes)}
                    </p>
                  </>
                ) : (
                  <p className="text-muted-foreground text-sm">
                    Select a format to see your damage.
                  </p>
                )}
              </div>
            </div>

            {/* Tagline */}
            {hasSelection && (
              <p className="text-muted-foreground border-border mt-8 border-t pt-6 text-center text-sm italic">
                {tagline}
              </p>
            )}
          </div>

          {/* Methodology note */}
          <p className="text-muted-foreground mt-5 text-center text-xs">
            Manual: ~12 min per version for comp duplication, text translation,
            font adjustments, and layout verification. AE Sheets: ~8 min setup
            + ~10 sec per comp for batch processing.
          </p>
        </div>
      </div>
    </section>
  );
}
