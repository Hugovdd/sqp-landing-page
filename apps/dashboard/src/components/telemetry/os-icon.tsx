import {
  IconBrandAndroid,
  IconBrandApple,
  IconBrandUbuntu,
  IconBrandWindows,
  IconDeviceDesktop,
} from "@tabler/icons-react";

import { cn } from "@/lib/utils";

/** Brand icon for an operating-system name; generic desktop for unknowns. */
export function OsIcon({
  name,
  className,
}: {
  name: string;
  className?: string;
}) {
  const cls = cn("text-muted-foreground size-5 shrink-0", className);
  const n = name.toLowerCase();
  if (/mac|ios|ipad|darwin|apple/.test(n))
    return <IconBrandApple aria-hidden className={cls} />;
  if (/win/.test(n)) return <IconBrandWindows aria-hidden className={cls} />;
  if (/android/.test(n)) return <IconBrandAndroid aria-hidden className={cls} />;
  if (/ubuntu|linux|debian/.test(n))
    return <IconBrandUbuntu aria-hidden className={cls} />;
  return <IconDeviceDesktop aria-hidden className={cls} />;
}
