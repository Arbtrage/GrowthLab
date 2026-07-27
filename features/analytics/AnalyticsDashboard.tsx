"use client";

import Link from "next/link";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { dashboard } from "@/constants/design";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import type { AnalyticsRange } from "@/lib/analytics/aggregate";

export function AnalyticsDashboard() {
  const [range, setRange] = useState<AnalyticsRange>("7d");

  const { data, isLoading, error } = useQuery({
    queryKey: ["analytics", range],
    queryFn: async () => {
      const res = await fetch(`/api/analytics?range=${range}`);
      if (!res.ok) throw new Error("Failed to load analytics");
      return res.json();
    },
  });

  if (isLoading) {
    return (
      <div className={`${dashboard.contentMax} space-y-6`}>
        <Skeleton className="h-10 w-64" />
        <div className={dashboard.kpiGrid}>
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error || !data) {
    return <p className="text-destructive">Could not load analytics.</p>;
  }

  const chartData = (data.timeSeries ?? []).map((d: { date: string; count: number }) => ({
    date: d.date.slice(5),
    count: d.count,
  }));

  const hasActivity = chartData.some((d: { count: number }) => d.count > 0);
  const scoreData = (data.scoreHistory ?? []).map(
    (s: { date: string; score: number }) => ({
      date: s.date.slice(5),
      score: s.score,
    }),
  );

  return (
    <div className={`${dashboard.contentMax} space-y-8`}>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold">Analytics</h1>
          <p className="text-muted-foreground">Cross-module trends and goal completion</p>
        </div>
        <Tabs value={range} onValueChange={(v) => setRange(v as AnalyticsRange)}>
          <TabsList>
            <TabsTrigger value="7d">7d</TabsTrigger>
            <TabsTrigger value="30d">30d</TabsTrigger>
            <TabsTrigger value="90d">90d</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className={dashboard.kpiGrid}>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>LeetCode solved</CardDescription>
            <CardTitle className="text-2xl">{data.summary.leetcode.problemsSolved}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>SD editions</CardDescription>
            <CardTitle className="text-2xl">{data.summary.systemDesign.editionsCompleted}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>SD avg score</CardDescription>
            <CardTitle className="text-2xl">
              {data.summary.systemDesign.avgScore ?? "—"}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Active days</CardDescription>
            <CardTitle className="text-2xl">{data.summary.global.activeDays}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Activity over time</CardTitle>
          <CardDescription>Total learning events per day</CardDescription>
        </CardHeader>
        <CardContent className="h-64">
          {hasActivity ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="date" className="text-xs" />
                <YAxis className="text-xs" allowDecimals={false} />
                <Tooltip />
                <Line type="monotone" dataKey="count" stroke="var(--primary)" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
              No activity in this range yet. Solve a problem or submit an SD edition to get started.
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Module breakdown</CardTitle>
          </CardHeader>
          <CardContent className="h-56">
            {(data.moduleComparison ?? []).some((m: { count: number }) => m.count > 0) ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.moduleComparison}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="module" className="text-xs" />
                  <YAxis className="text-xs" allowDecimals={false} />
                  <Bar dataKey="count" fill="var(--primary)" radius={4} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                No module data yet.
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>SD score trend</CardTitle>
          </CardHeader>
          <CardContent className="h-56">
            {scoreData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={scoreData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="date" className="text-xs" />
                  <YAxis domain={[0, 100]} className="text-xs" />
                  <Line type="monotone" dataKey="score" stroke="var(--primary)" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                Submit a system design edition to see scores.
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Goals</CardTitle>
          <CardDescription>
            {data.goalSummary.hit}/{data.goalSummary.total} completed ({data.goalSummary.completionRate}%)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Link href="/goals" className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
            Manage goals
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
