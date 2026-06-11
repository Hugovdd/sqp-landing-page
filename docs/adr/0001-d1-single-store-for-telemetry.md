# Single-store D1 for telemetry (not Analytics Engine)

The telemetry brief suggested splitting storage — Analytics Engine for high-volume usage
events, D1 for errors. We are instead using **D1 as the single store** for everything:
identity (`installs`, `daily_active`), errors, and usage events (`fetch`, `duplication_run`)
as append-only rows.

**Why.** Analytics Engine only earns its complexity at firehose scale (millions of events),
where its sampling and native aggregation beat a database. These are niche pro CEP plugins
whose high-volume events are *user-initiated actions*, realistically thousands/day, not
millions. At that scale AE's costs dominate: a second store and query language, the SQL API
HTTP path + token in the dashboard, and — decisively — **sampled (estimated) sums**, which
clash with the project's "the data is the population, counts are exact" premise. D1 gives
exact `COUNT(DISTINCT)` and exact `SUM` everywhere (including the headline lifetime
comps-duplicated figure) over one binding and one query language.

**The trade-off / when to revisit.** D1 is single-writer per database. Append-only inserts
are fine, but sustained **~50–100+ writes/sec (millions/day)** would make the firehose events
(`fetch`, `duplication_run`) belong in AE while identity/errors stay in D1 — the original
hybrid. The `usage_events` writer is deliberately the only thing that would move, so this
reversal is contained. Until then, D1-only wins on simplicity and exactness.

Status: accepted.
