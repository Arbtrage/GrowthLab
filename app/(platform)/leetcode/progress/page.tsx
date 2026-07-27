"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer } from "recharts";

export default function LeetcodeProgressPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["leetcode-dashboard"],
    queryFn: async () => {
      const res = await fetch("/api/dashboard/leetcode");
      if (!res.ok) throw new Error("Failed to load");
      return res.json();
    },
  });

  if (isLoading) return <Skeleton className="h-64 w-full" />;
  if (error || !data) return <p className="text-destructive">Failed to load progress.</p>;

  const chartData = (data.snapshots ?? []).map(
    (s: { date: string; submissionCountToday: number; streak: number }) => ({
      date: s.date.slice(5),
      solved: s.submissionCountToday,
      streak: s.streak,
    }),
  );

  const allSkills = [
    ...(data.skills?.fundamental ?? []),
    ...(data.skills?.intermediate ?? []),
    ...(data.skills?.advanced ?? []),
  ]
    .sort((a: { problemsSolved: number }, b: { problemsSolved: number }) => a.problemsSolved - b.problemsSolved)
    .slice(0, 8);

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div>
        <h1 className="text-3xl font-semibold">Progress</h1>
        <p className="text-muted-foreground">Charts and skill gap analysis</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Daily activity (30 days)</CardTitle>
        </CardHeader>
        <CardContent className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="date" className="text-xs" />
              <YAxis className="text-xs" />
              <Bar dataKey="solved" fill="var(--primary)" radius={4} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Weakest skill areas</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm">
            {allSkills.map((tag: { tagName: string; problemsSolved: number }) => (
              <li key={tag.tagName} className="flex justify-between">
                <span>{tag.tagName}</span>
                <span className="text-muted-foreground">{tag.problemsSolved} solved</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
