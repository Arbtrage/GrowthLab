"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Code2, Network, Target, TrendingUp, Flame } from "lucide-react";
import { dashboard, semantic } from "@/constants/design";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { GoalProgressBar } from "@/features/goals/GoalProgressBar";
import { cn } from "@/lib/utils";

export function GlobalDashboard() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["global-dashboard"],
    queryFn: async () => {
      const res = await fetch("/api/dashboard/global");
      if (!res.ok) throw new Error("Failed to load dashboard");
      return res.json();
    },
  });

  if (isLoading) {
    return (
      <div className={`${dashboard.contentMax} space-y-6`}>
        <Skeleton className="h-32 w-full rounded-2xl" />
        <div className={dashboard.kpiGrid}>
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !data) {
    return <p className="text-destructive">Could not load dashboard.</p>;
  }

  const maxActivity = Math.max(...(data.weekActivity?.map((d: { count: number }) => d.count) ?? [0]), 1);

  return (
    <div className={`${dashboard.contentMax} space-y-8`}>
      <div className={dashboard.heroCard}>
        <p className="text-sm text-muted-foreground">Good day,</p>
        <h1 className={dashboard.hero}>{data.greeting}</h1>
        <div className="mt-3 flex flex-wrap gap-2">
          <Badge variant="secondary" className="gap-1">
            <Flame className="size-3" />
            {data.metrics.streak} day streak
          </Badge>
          {data.metrics.goalsTotal > 0 ? (
            <Badge variant="outline">
              {data.metrics.goalsHit}/{data.metrics.goalsTotal} goals hit
            </Badge>
          ) : (
            <Link href="/goals" className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
              <Target className="mr-1 size-4" />
              Set a goal
            </Link>
          )}
        </div>
        <p className="mt-3 text-sm text-muted-foreground">
          This week: {data.metrics.weekTotal ?? 0} learning events
        </p>
      </div>

      <div className={dashboard.kpiGrid}>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>LeetCode today</CardDescription>
            <CardTitle className="text-2xl">
              {data.leetcode.solvedToday}/{data.leetcode.dailyGoal}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>SD avg score</CardDescription>
            <CardTitle className="text-2xl">{data.metrics.avgSdScore ?? "—"}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Goals</CardDescription>
            <CardTitle className="text-2xl">{data.metrics.goalsProgress}%</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Streak</CardDescription>
            <CardTitle className="text-2xl">{data.metrics.streak} days</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {data.topGoals?.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Active goals</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {data.topGoals.map(
              (goal: {
                id: string;
                label: string;
                achievedValue: number;
                targetValue: number;
                progressPercent: number;
              }) => (
                <GoalProgressBar
                  key={goal.id}
                  label={goal.label}
                  achievedValue={goal.achievedValue}
                  targetValue={goal.targetValue}
                  progressPercent={goal.progressPercent}
                />
              ),
            )}
            <Link href="/goals" className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}>
              View all goals
            </Link>
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className={semantic.iconBoxPrimary}>
                <Code2 className="size-5" />
              </div>
              <CardTitle className="text-lg">LeetCode</CardTitle>
            </div>
            <CardDescription>
              {data.leetcode.suggestionCount} AI suggestions for today
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.leetcode.problems?.length ? (
              <ul className="space-y-1 text-sm">
                {data.leetcode.problems.map((p: { title: string; difficulty: string }) => (
                  <li key={p.title} className="text-muted-foreground">
                    {p.title}{" "}
                    <span className="text-xs">({p.difficulty})</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">
                {data.leetcode.configured
                  ? "No suggestions yet — they generate each morning."
                  : "Configure your LeetCode username in Settings."}
              </p>
            )}
            <Link href="/leetcode" className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
              Go to module <ArrowRight className="ml-1 size-4" />
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className={semantic.iconBoxPrimary}>
                <Network className="size-5" />
              </div>
              <CardTitle className="text-lg">System Design</CardTitle>
            </div>
            <CardDescription>Today&apos;s editions</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.systemDesign.am ? (
              <div className="flex items-center justify-between text-sm">
                <span>AM: {data.systemDesign.am.title}</span>
                <Badge variant={data.systemDesign.am.submitted ? "default" : "secondary"}>
                  {data.systemDesign.am.submitted ? "Done" : "Pending"}
                </Badge>
              </div>
            ) : null}
            {data.systemDesign.pm ? (
              <div className="flex items-center justify-between text-sm">
                <span>PM: {data.systemDesign.pm.title}</span>
                <Badge variant={data.systemDesign.pm.submitted ? "default" : "secondary"}>
                  {data.systemDesign.pm.submitted ? "Done" : "Pending"}
                </Badge>
              </div>
            ) : null}
            <Link href="/system-design" className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
              View today <ArrowRight className="ml-1 size-4" />
            </Link>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <TrendingUp className="size-5 text-primary" />
            <CardTitle className="text-lg">7-day activity</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex h-24 items-end gap-2">
            {(data.weekActivity ?? []).map((d: { date: string; count: number }) => (
              <div key={d.date} className="flex flex-1 flex-col items-center gap-1">
                <div
                  className="w-full rounded-t bg-primary/80"
                  style={{
                    height: `${Math.max(8, (d.count / maxActivity) * 80)}px`,
                  }}
                />
                <span className="text-[10px] text-muted-foreground">{d.date.slice(5)}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-4">
        <Link href="/analytics" className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}>
          <TrendingUp className="mr-1 size-4" /> Analytics
        </Link>
        <Link href="/goals" className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}>
          <Target className="mr-1 size-4" /> Goals
        </Link>
      </div>
    </div>
  );
}
