import { FilterBar } from "./filter-bar";

/** Standard telemetry page header: title/description on the left, filters right. */
export function PageShell({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <main id="main-content" className="flex flex-col gap-5 p-4 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold">{title}</h2>
          {description ? (
            <p className="text-muted-foreground text-sm">{description}</p>
          ) : null}
        </div>
        <FilterBar />
      </div>
      {children}
    </main>
  );
}
