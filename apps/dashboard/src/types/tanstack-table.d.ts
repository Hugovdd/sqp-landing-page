// Re-adds the per-column `meta.className` escape hatch that the Admin Kit's
// data tables rely on. (The original augmentation lived in a demo file removed
// during the telemetry strip.)
import { type RowData } from "@tanstack/react-table";

declare module "@tanstack/react-table" {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface ColumnMeta<TData extends RowData, TValue> {
    className?: string;
  }
}
