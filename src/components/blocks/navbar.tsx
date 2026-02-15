import { useState, useEffect } from "react";

import { ThemeToggle } from "@/components/theme-toggle";
import { NAV_LINKS } from "@/consts";
import { cn } from "@/lib/utils";

// Group links by their group field for mobile menu
const groups = NAV_LINKS.reduce(
  (acc, link) => {
    const group = link.group;
    if (!acc[group]) acc[group] = [];
    acc[group].push(link);
    return acc;
  },
  {} as Record<string, typeof NAV_LINKS[number][]>,
);

export const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [pathname, setPathname] = useState("");

  useEffect(() => {
    setPathname(window.location.pathname);
  }, []);

  return (
    <section
      className={cn(
        "bg-background/70 absolute left-1/2 z-50 w-[min(90%,700px)] -translate-x-1/2 rounded-4xl border backdrop-blur-md transition-all duration-300",
        "top-5 lg:top-12",
      )}
    >
      <div className="flex items-center justify-between px-6 py-3">
        <a href="/" className="flex shrink-0 items-center gap-2">
          <img
            src="/logo.svg"
            alt="SideQuest Plugins"
            width={94}
            height={18}
            className="dark:invert"
          />
        </a>

        {/* Desktop Navigation */}
        <nav className="max-lg:hidden">
          <ul className="flex items-center gap-1">
            {NAV_LINKS.map((link) => (
              <li key={link.label}>
                <a
                  href={link.href}
                  className={cn(
                    "relative bg-transparent px-2.5 py-1.5 text-sm font-medium transition-opacity hover:opacity-75",
                    pathname === link.href && "text-muted-foreground",
                  )}
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        {/* Right side controls */}
        <div className="flex items-center gap-2.5">
          <ThemeToggle />

          {/* Hamburger Menu Button (Mobile Only) */}
          <button
            className="text-muted-foreground relative flex size-8 lg:hidden"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <span className="sr-only">Open main menu</span>
            <div className="absolute top-1/2 left-1/2 block w-[18px] -translate-x-1/2 -translate-y-1/2">
              <span
                aria-hidden="true"
                className={`absolute block h-0.5 w-full rounded-full bg-current transition duration-500 ease-in-out ${isMenuOpen ? "rotate-45" : "-translate-y-1.5"}`}
              ></span>
              <span
                aria-hidden="true"
                className={`absolute block h-0.5 w-full rounded-full bg-current transition duration-500 ease-in-out ${isMenuOpen ? "opacity-0" : ""}`}
              ></span>
              <span
                aria-hidden="true"
                className={`absolute block h-0.5 w-full rounded-full bg-current transition duration-500 ease-in-out ${isMenuOpen ? "-rotate-45" : "translate-y-1.5"}`}
              ></span>
            </div>
          </button>
        </div>
      </div>

      {/* Mobile Menu Navigation */}
      <div
        className={cn(
          "bg-background fixed inset-x-0 top-[calc(100%+1rem)] flex flex-col rounded-2xl border p-6 transition-all duration-300 ease-in-out lg:hidden",
          isMenuOpen
            ? "visible translate-y-0 opacity-100"
            : "invisible -translate-y-4 opacity-0",
        )}
      >
        <nav className="flex flex-1 flex-col gap-6">
          {Object.entries(groups).map(([groupName, links]) => (
            <div key={groupName}>
              <h3 className="text-muted-foreground mb-3 text-xs font-semibold uppercase tracking-wider">
                {groupName}
              </h3>
              <div className="space-y-1">
                {links.map((link) => (
                  <a
                    key={link.label}
                    href={link.href}
                    className={cn(
                      "text-foreground hover:text-foreground/80 block py-2 text-base font-medium transition-colors",
                      pathname === link.href && "text-muted-foreground",
                    )}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {link.label}
                  </a>
                ))}
              </div>
            </div>
          ))}
        </nav>
      </div>
    </section>
  );
};
