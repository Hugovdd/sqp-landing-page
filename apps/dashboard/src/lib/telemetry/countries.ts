import { countryTuples } from "country-region-data";

// ISO alpha-2 (uppercase) → English country name, built once from
// country-region-data. Stored country codes come from Cloudflare's
// `request.cf.country` (uppercase alpha-2).
const NAME_BY_CODE = new Map<string, string>(
  (countryTuples as [string, string][]).map(([name, code]) => [code, name]),
);

/** Full English name for an ISO alpha-2 country code; falls back to the code. */
export function countryName(code: string): string {
  return NAME_BY_CODE.get(code.toUpperCase()) ?? code;
}

/** Whether the code is a recognised country (so a circle-flags SVG exists). */
export function isKnownCountry(code: string): boolean {
  return NAME_BY_CODE.has(code.toUpperCase());
}
