import { Globe } from "lucide-react";

import { isKnownCountry } from "@/lib/telemetry/countries";
import { cn } from "@/lib/utils";

/**
 * Round country flag, served self-hosted from /flags/<code>.svg (circle-flags,
 * synced into public/ at build). Falls back to a globe for unknown codes.
 */
export function CountryFlag({
  code,
  className,
}: {
  code: string;
  className?: string;
}) {
  if (!isKnownCountry(code)) {
    return (
      <Globe
        aria-hidden
        className={cn("text-muted-foreground size-5 shrink-0", className)}
      />
    );
  }
  return (
    // Static SVG asset — next/image adds no value here.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`/flags/${code.toLowerCase()}.svg`}
      alt=""
      width={20}
      height={20}
      className={cn("size-5 shrink-0 rounded-full", className)}
    />
  );
}
