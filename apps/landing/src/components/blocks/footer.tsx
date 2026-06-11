import { ArrowUpRight } from "lucide-react";

import { FOOTER_COLUMNS, LEGAL_LINKS, SITE } from "@/consts";

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t pt-16 pb-8">
      <div className="container">
        {/* Footer columns */}
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand column */}
          <div className="space-y-4">
            <a href="/" className="flex items-center gap-2">
              <img
                src="/images/logo-light.svg"
                alt={SITE.name}
                width={170}
                height={33}
                className="dark:hidden"
              />
              <img
                src="/images/logo-dark.svg"
                alt={SITE.name}
                width={170}
                height={33}
                className="hidden dark:block"
              />
            </a>
            <p className="text-muted-foreground max-w-xs text-sm leading-relaxed">
              {SITE.tagline}
            </p>
          </div>

          {/* Link columns */}
          {FOOTER_COLUMNS.map((column) => (
            <div key={column.title}>
              <h3 className="mb-4 text-sm font-semibold">{column.title}</h3>
              <ul className="space-y-3">
                {column.links.map((link) => {
                  const isExternal = link.url.startsWith("http");
                  return (
                    <li key={link.text}>
                      <a
                        href={link.url}
                        className="text-muted-foreground hover:text-foreground flex items-center gap-1 text-sm transition-colors"
                        {...(isExternal
                          ? { target: "_blank", rel: "noopener noreferrer" }
                          : {})}
                      >
                        {link.text}
                        {isExternal && <ArrowUpRight className="size-3" />}
                      </a>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t pt-8 sm:flex-row">
          <p className="text-muted-foreground text-sm">
            &copy; {year} {SITE.name}. All rights reserved.
          </p>
          <ul className="flex items-center gap-6">
            {LEGAL_LINKS.map((link) => (
              <li key={link.text}>
                <a
                  href={link.url}
                  className="text-muted-foreground hover:text-foreground text-sm transition-colors"
                >
                  {link.text}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  );
}
