"use client";

import { formatDistanceToNow } from "date-fns";
import { parseAsInteger, useQueryState } from "nuqs";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export interface ErrorGroupRow {
  name: string;
  message: string;
  count: number;
  lastSeen: number;
  affected: number;
}

export function ErrorsTable({
  groups,
  selected,
}: {
  groups: ErrorGroupRow[];
  selected: number | null;
}) {
  const [, setError] = useQueryState(
    "error",
    parseAsInteger.withOptions({ shallow: false }),
  );

  if (groups.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">No errors in range 🎉</p>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Error</TableHead>
          <TableHead>Message</TableHead>
          <TableHead className="text-right">Count</TableHead>
          <TableHead className="text-right">Installs</TableHead>
          <TableHead className="text-right">Last seen</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {groups.map((g, i) => (
          <TableRow
            key={`${g.name}:${g.message}`}
            data-state={selected === i ? "selected" : undefined}
            className="cursor-pointer"
            onClick={() => setError(selected === i ? null : i)}
          >
            <TableCell className="font-medium">{g.name}</TableCell>
            <TableCell className="text-muted-foreground max-w-[420px] truncate">
              {g.message}
            </TableCell>
            <TableCell className="text-right tabular-nums">{g.count}</TableCell>
            <TableCell className="text-right tabular-nums">
              {g.affected}
            </TableCell>
            <TableCell className="text-muted-foreground text-right">
              {formatDistanceToNow(g.lastSeen, { addSuffix: true })}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
