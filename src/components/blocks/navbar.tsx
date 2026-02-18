import { useEffect, useState } from "react";

import { ThemeToggle } from "@/components/theme-toggle";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import { NAV_LINKS, PRODUCT_LINKS } from "@/consts";
import { cn } from "@/lib/utils";

const MOBILE_MENU_GROUPS = [
  { title: "Products", links: PRODUCT_LINKS },
  { title: "Resources", links: NAV_LINKS },
] as const;

export const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [pathname, setPathname] = useState("");
  const [activeProductHref, setActiveProductHref] = useState<string>(
    PRODUCT_LINKS[0]?.href ?? "",
  );
  const isProductRoute = PRODUCT_LINKS.some((link) => link.href === pathname);
  const activeProduct =
    PRODUCT_LINKS.find((product) => product.href === activeProductHref) ??
    PRODUCT_LINKS[0];

  useEffect(() => {
    setPathname(window.location.pathname);
  }, []);

  useEffect(() => {
    const matchingProduct = PRODUCT_LINKS.find((product) => {
      return product.href === pathname;
    });
    if (matchingProduct) {
      setActiveProductHref(matchingProduct.href);
    }
  }, [pathname]);

  return (
    <section
      className={cn(
        "bg-background/70 absolute left-1/2 z-50 w-auto max-w-[90%] -translate-x-1/2 rounded-4xl border backdrop-blur-md transition-all duration-300",
        "top-5 lg:top-12",
      )}
    >
      <div className="flex items-center justify-between px-6 py-3">
        <a href="/" className="mr-4 flex shrink-0 items-center gap-2 lg:mr-6">
          <img
            src="/logo.svg"
            alt="SideQuest Plugins"
            width={94}
            height={18}
            className="dark:invert"
          />
        </a>

        {/* Desktop Navigation */}
        <div className="max-lg:hidden">
          <NavigationMenu>
            <NavigationMenuList>
              <NavigationMenuItem>
                <NavigationMenuTrigger
                  className={cn(
                    "relative inline-flex h-auto items-center gap-1 rounded-none bg-transparent px-2.5 py-1.5 text-sm font-medium transition-opacity hover:bg-transparent hover:text-inherit hover:opacity-75 focus:bg-transparent focus:text-inherit data-[state=open]:bg-transparent data-[state=open]:text-inherit data-[state=open]:hover:bg-transparent data-[state=open]:focus:bg-transparent",
                    isProductRoute && "text-muted-foreground",
                  )}
                >
                  Products
                </NavigationMenuTrigger>
                    <NavigationMenuContent className="w-max overflow-hidden p-0">
                      <div className="grid grid-cols-[280px_220px] gap-0">
                    <ul className="space-y-1 p-4">
                      {PRODUCT_LINKS.map((link) => {
                        const isActive = activeProduct?.href === link.href;
                        return (
                          <li key={link.label}>
                            <NavigationMenuLink asChild>
                              <a
                                href={link.href}
                                onMouseEnter={() =>
                                  setActiveProductHref(link.href)
                                }
                                onFocus={() => setActiveProductHref(link.href)}
                                className={cn(
                                  "block rounded-md border border-transparent px-3 py-2.5 transition-colors",
                                  isActive && "bg-accent/50 border-border",
                                )}
                              >
                                <span className="block text-sm font-medium">
                                  {link.label}
                                </span>
                                <span className="text-muted-foreground mt-0.5 block text-xs leading-relaxed">
                                  {link.description}
                                </span>
                              </a>
                            </NavigationMenuLink>
                          </li>
                        );
                      })}
                    </ul>

                    {activeProduct && (
                      <a
                        href={activeProduct.href}
                        className="group bg-muted/30 hover:bg-muted/50 block overflow-hidden border-l transition-colors"
                      >
                        <div className="aspect-[4/5] w-[220px] overflow-hidden">
                          <img
                            src={activeProduct.previewImage}
                            alt={activeProduct.label}
                            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                          />
                        </div>
                      </a>
                    )}
                  </div>
                </NavigationMenuContent>
              </NavigationMenuItem>

              {NAV_LINKS.map((link) => (
                <NavigationMenuItem key={link.label}>
                  <NavigationMenuLink asChild>
                    <a
                      href={link.href}
                      className={cn(
                        "group inline-flex h-9 w-max items-center justify-center rounded-md bg-transparent px-2.5 py-1.5 text-sm font-medium transition-opacity hover:bg-transparent hover:text-inherit hover:opacity-75 focus:bg-transparent focus:text-inherit disabled:pointer-events-none disabled:opacity-50 data-[active]:bg-transparent data-[state=open]:bg-transparent",
                        pathname === link.href && "text-muted-foreground",
                      )}
                    >
                      {link.label}
                    </a>
                  </NavigationMenuLink>
                </NavigationMenuItem>
              ))}
            </NavigationMenuList>
          </NavigationMenu>
        </div>

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
          {MOBILE_MENU_GROUPS.map((group) => (
            <div key={group.title}>
              <h3 className="text-muted-foreground mb-3 text-xs font-semibold tracking-wider uppercase">
                {group.title}
              </h3>
              <div className="space-y-1">
                {group.links.map((link) => (
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
