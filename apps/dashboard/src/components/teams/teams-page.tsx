import { IconAlertTriangle, IconUsersGroup } from "@tabler/icons-react";

import {
  CreateTeamForm,
  IdentifiedToggle,
} from "@/components/teams/team-admin-forms";
import { TeamInviteForm } from "@/components/teams/invite-form";
import { IdentifiedUsageCard } from "@/components/identified-usage";
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
  type TeamsPageData,
} from "@/lib/altar-admin";
import {
  TEAM_INVITE_STATUS_LABELS,
  TEAM_ROLE_LABELS,
} from "@/lib/altar-teams";
import type { IdentifiedUsageResult } from "@/lib/altar-usage";
import { usageForOrg } from "@/lib/altar-usage";

type TeamsPageResult =
  | { status: "ready"; data: TeamsPageData }
  | { status: "unavailable"; kind: AltarAdminErrorKind };

function formatTime(seconds: number | null): string {
  return seconds === null
    ? "Not yet"
    : new Date(seconds * 1000).toISOString().replace("T", " ").slice(0, 16) +
        " UTC";
}

function inviteHref(page: number): string {
  const query = new URLSearchParams({ product: "altar" });
  if (page > 1) query.set("page", String(page));
  return `/teams?${query.toString()}`;
}
function inviteStatusVariant(
  status: keyof typeof TEAM_INVITE_STATUS_LABELS,
): "default" | "secondary" | "destructive" {
  if (status === "claimed") return "default";
  if (status === "expired") return "destructive";
  return "secondary";
}

function Unavailable({ kind }: { kind: AltarAdminErrorKind }) {
  return (
    <Card className="border-destructive/40">
      <CardContent className="flex min-h-64 flex-col items-center justify-center gap-3 p-8 text-center">
        <IconAlertTriangle className="text-destructive size-8" />
        <div>
          <h3 className="font-semibold">Altar Teams data is unavailable</h3>
          <p className="text-muted-foreground mt-1 max-w-lg text-sm">
            {kind === "missing_binding"
              ? "The ALTAR_VAULT_CATALOG database binding is not configured."
              : kind === "malformed_data"
                ? "Stored Teams data did not match the expected schema."
                : "The Altar vault catalog could not be queried. Try again shortly."}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

export function TeamsPageView({
  result,
  usage = { status: "empty" },
}: {
  result: TeamsPageResult;
  usage?: IdentifiedUsageResult;
}) {
  return (
    <main id="main-content" className="flex flex-col gap-5 p-4 sm:p-6">
      <div>
        <h2 className="text-2xl font-bold">Teams</h2>
        <p className="text-muted-foreground text-sm">
          Inspect Teams, Memberships, and Team Invites. Membership appears only
          after the recipient redeems a code in Settings &gt; Teams.
        </p>
      </div>

      {result.status === "unavailable" ? (
        <Unavailable kind={result.kind} />
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Send a Team Invite</CardTitle>
            </CardHeader>
            <CardContent>
              {result.data.mutation.status === "missing_config" ? (
                <div className="border-destructive/40 mb-4 rounded-md border p-3 text-sm">
                  Team Invite sending is unavailable. ALTAR_ADMIN_TOKEN is not
                  configured.
                </div>
              ) : null}
              <TeamInviteForm
                teams={result.data.teams}
                peopleEmails={result.data.peopleEmails}
                disabled={
                  result.data.mutation.status !== "ready" ||
                  result.data.teams.length === 0
                }
              />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Create a Team</CardTitle>
            </CardHeader>
            <CardContent>
              <CreateTeamForm
                accounts={result.data.claimedAccounts}
                disabled={result.data.mutation.status !== "ready"}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{result.data.teams.length} Teams</CardTitle>
            </CardHeader>
            <CardContent>
              {result.data.teams.length === 0 ? (
                <div className="text-muted-foreground flex min-h-40 flex-col items-center justify-center gap-2 text-center">
                  <IconUsersGroup className="size-8" />
                  <p className="font-medium">No Teams yet</p>
                  <p className="text-xs">
                    The vault catalog query succeeded and returned no rows.
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Team</TableHead>
                      <TableHead>Members</TableHead>
                      <TableHead>Invites</TableHead>
                      <TableHead>Usage</TableHead>
                      <TableHead>Created</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {result.data.teams.map((team) => (
                      <TableRow key={team.orgId}>
                        <TableCell>
                          <p className="font-medium">{team.name}</p>
                          <p className="text-muted-foreground font-mono text-xs">
                            {team.orgId}
                          </p>
                        </TableCell>
                        <TableCell>{team.memberCount}</TableCell>
                        <TableCell>{team.inviteCount}</TableCell>
                        <TableCell>
                          <IdentifiedToggle
                            team={team}
                            disabled={result.data.mutation.status !== "ready"}
                          />
                        </TableCell>
                        <TableCell>{formatTime(team.createdAt)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {result.data.teams
            .filter((team) => team.identified === 1)
            .map((team) => (
              <IdentifiedUsageCard
                key={team.orgId}
                title={`${team.name} usage`}
                result={usageForOrg(usage, team.orgId)}
              />
            ))}

          <Card>
            <CardHeader>
              <CardTitle>
                {result.data.memberships.length} Memberships
              </CardTitle>
            </CardHeader>
            <CardContent>
              {result.data.memberships.length === 0 ? (
                <p className="text-muted-foreground text-sm">
                  No Memberships yet. They appear only after a Team Invite is
                  redeemed.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Identity</TableHead>
                      <TableHead>Team</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Joined</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {result.data.memberships.map((membership) => (
                      <TableRow
                        key={`${membership.orgId}:${membership.userId}`}
                      >
                        <TableCell>
                          <p className="font-mono text-xs">
                            {membership.identity}
                          </p>
                          {membership.email ? null : (
                            <p className="text-muted-foreground mt-1 text-xs">
                              Clerk user ID
                            </p>
                          )}
                        </TableCell>
                        <TableCell>{membership.orgName}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              membership.role === "admin"
                                ? "default"
                                : "secondary"
                            }
                          >
                            {TEAM_ROLE_LABELS[membership.role]}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {formatTime(membership.createdAt)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{result.data.inviteTotal} Team Invites</CardTitle>
            </CardHeader>
            <CardContent>
              {result.data.invites.length === 0 ? (
                <p className="text-muted-foreground text-sm">
                  No Team Invites have been issued.
                </p>
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Code</TableHead>
                        <TableHead>Team</TableHead>
                        <TableHead>Intended</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Claimed</TableHead>
                        <TableHead>Created</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {result.data.invites.map((invite) => (
                        <TableRow key={invite.code}>
                          <TableCell className="font-mono text-xs">
                            {invite.code}
                          </TableCell>
                          <TableCell>{invite.orgName}</TableCell>
                          <TableCell className="font-mono text-xs">
                            {invite.intendedEmail ?? "Unspecified"}
                          </TableCell>
                          <TableCell>{TEAM_ROLE_LABELS[invite.role]}</TableCell>
                          <TableCell>
                            <Badge
                              variant={inviteStatusVariant(
                                invite.displayStatus,
                              )}
                            >
                              {TEAM_INVITE_STATUS_LABELS[invite.displayStatus]}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-mono text-xs">
                            {invite.claimedIdentity ?? "Not claimed"}
                          </TableCell>
                          <TableCell>{formatTime(invite.createdAt)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  <div className="mt-4 flex items-center justify-between gap-3 text-sm">
                    <p className="text-muted-foreground">
                      Page {result.data.invitePage} of{" "}
                      {result.data.invitePageCount}
                    </p>
                    <div className="flex gap-2">
                      {result.data.invitePage > 1 ? (
                        <Button asChild variant="outline" size="sm">
                          <a href={inviteHref(result.data.invitePage - 1)}>
                            Previous
                          </a>
                        </Button>
                      ) : null}
                      {result.data.invitePage < result.data.invitePageCount ? (
                        <Button asChild variant="outline" size="sm">
                          <a href={inviteHref(result.data.invitePage + 1)}>
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
        </>
      )}
    </main>
  );
}
