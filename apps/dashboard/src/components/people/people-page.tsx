import {
  IconAlertTriangle,
  IconArrowRight,
  IconUserSearch,
} from "@tabler/icons-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  type AltarAdminErrorKind,
  type PeoplePageData,
} from "@/lib/altar-admin";
import {
  LIFECYCLE_LABELS,
  LIFECYCLE_STATES,
  type PeopleParams,
  type PersonDetail,
  type PersonLifecycle,
} from "@/lib/altar-people";

type PeoplePageResult =
  | { status: "ready"; data: PeoplePageData }
  | { status: "unavailable"; kind: AltarAdminErrorKind };

function formatTime(ms: number | null): string {
  return ms === null
    ? "Not yet"
    : new Date(ms).toISOString().replace("T", " ").slice(0, 16) + " UTC";
}

function lifecycleVariant(
  state: PersonLifecycle["state"],
): "default" | "secondary" | "outline" | "destructive" {
  if (state === "active_in_panel" || state === "account_joined")
    return "default";
  if (state === "invite_expired") return "destructive";
  if (state === "manual_legacy_grant") return "secondary";
  return "outline";
}

function hrefFor(
  params: PeopleParams,
  patch: Record<string, string | null>,
): string {
  const sp = new URLSearchParams({ product: "altar" });
  if (params.search) sp.set("search", params.search);
  for (const state of params.states) sp.append("state", state);
  sp.set("order", params.order);
  if (params.page > 1) sp.set("page", String(params.page));
  if (params.selectedEmail) sp.set("person", params.selectedEmail);
  for (const [key, value] of Object.entries(patch)) {
    sp.delete(key);
    if (value !== null) sp.set(key, value);
  }
  return `/people?${sp.toString()}`;
}

function Detail({ detail }: { detail: PersonDetail }) {
  const events = [
    {
      at: detail.createdAt,
      title: "Waitlist Entry created",
      body: detail.email,
    },
    ...detail.invites.flatMap((invite) => {
      const inviteEvents = [
        {
          at: invite.createdAt,
          title: "Access Invite issued",
          body: `Intended email: ${invite.intendedEmail ?? "Unknown"} · Code: ${invite.code}`,
        },
        invite.claimedAt !== null
          ? {
              at: invite.claimedAt,
              title: "Access Invite claimed",
              body: `Claimed Account: ${invite.claimedEmail ?? "Unknown"}${invite.claimedUserId ? ` · ${invite.claimedUserId}` : ""}`,
            }
          : {
              at: invite.expiresAt,
              title: "Access Invite expiry",
              body:
                invite.expiresAt <= Date.now()
                  ? "Expired without a claim"
                  : "Scheduled expiry if unclaimed",
            },
      ];
      if (invite.accountFirstSignedInAt !== null) {
        inviteEvents.push({
          at: invite.accountFirstSignedInAt,
          title: "First panel sign-in",
          body: invite.claimedEmail ?? "Unknown Account",
        });
      }
      return inviteEvents;
    }),
    ...(detail.firstSignedInAt === null ||
    detail.invites.some((invite) => invite.accountFirstSignedInAt !== null)
      ? []
      : [
          {
            at: detail.firstSignedInAt,
            title: "First panel sign-in",
            body: detail.email,
          },
        ]),
  ].sort((a, b) => a.at - b.at);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex flex-wrap items-center justify-between gap-2">
          <span>Lifecycle detail</span>
          <span className="font-mono text-sm font-normal">{detail.email}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(260px,0.45fr)]">
        <ol className="border-border relative ml-2 space-y-5 border-l pl-5">
          {events.map((event, index) => (
            <li
              key={`${event.title}-${event.at}-${index}`}
              className="relative"
            >
              <span className="bg-primary absolute top-1.5 -left-[25px] size-2 rounded-full" />
              <p className="text-sm font-medium">{event.title}</p>
              <p className="text-muted-foreground text-xs">
                {formatTime(event.at)}
              </p>
              <p className="mt-1 text-sm">{event.body}</p>
            </li>
          ))}
        </ol>
        <div className="space-y-3">
          <div className="bg-muted/40 rounded-lg p-3 text-sm">
            <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
              Waitlist Entry
            </p>
            <p className="mt-1 font-mono break-all">{detail.email}</p>
            <p className="text-muted-foreground mt-1">
              Status: {detail.waitlistStatus}
            </p>
          </div>
          {detail.invites.map((invite) => (
            <div key={invite.code} className="rounded-lg border p-3 text-sm">
              <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                Access Invite
              </p>
              <p className="mt-1">Intended email</p>
              <p className="font-mono text-xs break-all">
                {invite.intendedEmail ?? "Unknown"}
              </p>
              <p className="mt-2">Claimed Account</p>
              <p className="font-mono text-xs break-all">
                {invite.claimedEmail ?? "Not claimed"}
              </p>
              {invite.identityDiverged ? (
                <Badge variant="secondary" className="mt-2">
                  Different identities
                </Badge>
              ) : null}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function PeoplePageView({
  params,
  result,
}: {
  params: PeopleParams;
  result: PeoplePageResult;
}) {
  return (
    <main id="main-content" className="flex flex-col gap-5 p-4 sm:p-6">
      <div>
        <h2 className="text-2xl font-bold">People</h2>
        <p className="text-muted-foreground text-sm">
          Altar beta intent, invite credentials, verified Accounts, and first
          panel sign-in.
        </p>
      </div>

      {result.status === "unavailable" ? (
        <Card className="border-destructive/40">
          <CardContent className="flex min-h-64 flex-col items-center justify-center gap-3 p-8 text-center">
            <IconAlertTriangle className="text-destructive size-8" />
            <div>
              <h3 className="font-semibold">
                Altar lifecycle data is unavailable
              </h3>
              <p className="text-muted-foreground mt-1 max-w-lg text-sm">
                {result.kind === "missing_binding"
                  ? "The ALTAR_WAITLIST database binding is not configured."
                  : result.kind === "malformed_data"
                    ? "Stored lifecycle data did not match the expected schema."
                    : "The Altar waitlist database could not be queried. Try again shortly."}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardContent className="pt-6">
              <form
                action="/people"
                method="get"
                className="flex flex-col gap-4"
              >
                <input type="hidden" name="product" value="altar" />
                <div className="grid gap-3 md:grid-cols-[minmax(220px,1fr)_180px_auto]">
                  <label className="grid gap-1 text-sm">
                    <span className="font-medium">Search identities</span>
                    <input
                      name="search"
                      defaultValue={params.search}
                      placeholder="Email or Clerk user ID"
                      className="border-input bg-background h-9 rounded-md border px-3"
                    />
                  </label>
                  <label className="grid gap-1 text-sm">
                    <span className="font-medium">Order</span>
                    <select
                      name="order"
                      defaultValue={params.order}
                      className="border-input bg-background h-9 rounded-md border px-3"
                    >
                      <option value="newest">Newest first</option>
                      <option value="oldest">Oldest first</option>
                    </select>
                  </label>
                  <Button type="submit" className="self-end">
                    Apply filters
                  </Button>
                </div>
                <fieldset className="flex flex-wrap gap-x-4 gap-y-2">
                  <legend className="mb-2 text-sm font-medium">
                    Lifecycle state
                  </legend>
                  {LIFECYCLE_STATES.map((state) => (
                    <label
                      key={state}
                      className="flex items-center gap-2 text-sm"
                    >
                      <input
                        type="checkbox"
                        name="state"
                        value={state}
                        defaultChecked={params.states.includes(state)}
                      />
                      {LIFECYCLE_LABELS[state]}
                    </label>
                  ))}
                </fieldset>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{result.data.total} Waitlist Entries</CardTitle>
            </CardHeader>
            <CardContent>
              {result.data.people.length === 0 ? (
                <div className="text-muted-foreground flex min-h-56 flex-col items-center justify-center gap-2 text-center">
                  <IconUserSearch className="size-8" />
                  <p className="font-medium">
                    No Waitlist Entries match these filters
                  </p>
                  <p className="text-xs">
                    The database query succeeded and returned no rows.
                  </p>
                </div>
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Waitlist Entry</TableHead>
                        <TableHead>Access Invite</TableHead>
                        <TableHead>Account</TableHead>
                        <TableHead>Lifecycle</TableHead>
                        <TableHead className="text-right">Detail</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {result.data.people.map((person) => (
                        <TableRow key={person.email}>
                          <TableCell>
                            <p className="font-mono text-xs">{person.email}</p>
                            <p className="text-muted-foreground mt-1 text-xs">
                              Joined waitlist {formatTime(person.createdAt)}
                            </p>
                          </TableCell>
                          <TableCell>
                            {person.inviteCount === 0 ? (
                              <span className="text-muted-foreground">
                                None
                              </span>
                            ) : (
                              <>
                                <p>{person.inviteCount} issued</p>
                                <p className="text-muted-foreground font-mono text-xs">
                                  {person.latestInviteCode}
                                </p>
                              </>
                            )}
                          </TableCell>
                          <TableCell>
                            {person.claimedEmail ? (
                              <>
                                <p className="font-mono text-xs">
                                  {person.claimedEmail}
                                </p>
                                {person.identityDiverged ? (
                                  <Badge variant="secondary" className="mt-1">
                                    Different from intended
                                  </Badge>
                                ) : null}
                              </>
                            ) : (
                              <span className="text-muted-foreground">
                                Not claimed
                              </span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge variant={lifecycleVariant(person.state)}>
                              {LIFECYCLE_LABELS[person.state]}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button asChild variant="ghost" size="sm">
                              <a
                                href={hrefFor(params, { person: person.email })}
                              >
                                View <IconArrowRight />
                              </a>
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  <div className="mt-4 flex items-center justify-between gap-3 text-sm">
                    <p className="text-muted-foreground">
                      Page {result.data.page} of {result.data.pageCount}
                    </p>
                    <div className="flex gap-2">
                      {result.data.page > 1 ? (
                        <Button asChild variant="outline" size="sm">
                          <a
                            href={hrefFor(params, {
                              page: String(result.data.page - 1),
                              person: null,
                            })}
                          >
                            Previous
                          </a>
                        </Button>
                      ) : null}
                      {result.data.page < result.data.pageCount ? (
                        <Button asChild variant="outline" size="sm">
                          <a
                            href={hrefFor(params, {
                              page: String(result.data.page + 1),
                              person: null,
                            })}
                          >
                            Next
                          </a>
                        </Button>
                      ) : null}
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {result.data.detail ? <Detail detail={result.data.detail} /> : null}
        </>
      )}
    </main>
  );
}
