# Telemetry D1 migrations

Altar Admin (`admin.motionaltar.com`) reads this database directly.

Before adding a migration that renames, drops or retypes a column, check altar-react apps/admin queries (`apps/admin/src/lib/telemetry/queries.ts`), then refresh `apps/admin/test/fixtures/telemetry-schema.sql` and run its tests. See altar-react docs/adr/0042.
