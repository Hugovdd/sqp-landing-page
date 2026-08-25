/** Join an optional origin override to a path. Trailing slashes on the origin are ignored. */
export function altarOriginUrl(
  origin: string | undefined,
  fallback: string,
  path: string,
): string {
  const trimmed = origin?.trim();
  const base = trimmed ? trimmed.replace(/\/+$/, "") : fallback;
  return `${base}${path}`;
}
