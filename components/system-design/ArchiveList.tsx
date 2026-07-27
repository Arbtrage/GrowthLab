"use client";

import * as React from "react";
import Link from "next/link";
import { format, parseISO } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

type ArchiveEdition = {
  id: string;
  date: string;
  slot: "am" | "pm";
  title: string;
  href: string;
  submitted: boolean;
  score?: number | null;
};

type ArchiveListProps = {
  editions: ArchiveEdition[];
};

export function ArchiveList({ editions }: ArchiveListProps) {
  const [filter, setFilter] = React.useState<"all" | "completed" | "open">("all");

  const filtered = editions.filter((edition) => {
    if (filter === "completed") return edition.submitted;
    if (filter === "open") return !edition.submitted;
    return true;
  });

  return (
    <div className="space-y-4">
      <Tabs value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
          <TabsTrigger value="open">Open</TabsTrigger>
        </TabsList>
      </Tabs>

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            No editions match this filter.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((edition) => (
            <Link key={edition.id} href={edition.href}>
              <Card className="transition-colors hover:bg-muted/30">
                <CardContent className="flex items-center justify-between py-4">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">
                      {edition.slot === "am" ? "Morning" : "Evening"} ·{" "}
                      {format(parseISO(edition.date), "MMM d, yyyy")}
                    </p>
                    <p className="mt-1 font-medium">{edition.title}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {edition.submitted && edition.score != null ? (
                      <Badge variant="outline">{edition.score}/100</Badge>
                    ) : null}
                    <Badge variant={edition.submitted ? "default" : "secondary"}>
                      {edition.submitted ? "Completed" : "Open"}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
