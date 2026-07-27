import Link from "next/link";
import { RegenerateSuggestionsButton } from "@/components/leetcode/regenerate-suggestions-button";
import { SyncNowButton } from "@/components/leetcode/sync-now-button";
import {
  markSuggestionCompleted,
  markSuggestionSkipped,
} from "@/app/actions";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { SuggestedProblem } from "@/lib/leetcode/types";
import { getDashboardData } from "@/lib/leetcode/sync";
import { requireUser } from "@/lib/users";

export const dynamic = "force-dynamic";

export default async function LeetcodePage() {
  const user = await requireUser();

  let data: Awaited<ReturnType<typeof getDashboardData>> | null = null;
  let error: string | null = null;

  try {
    data = await getDashboardData(user.id);
  } catch (e) {
    error = e instanceof Error ? e.message : "Failed to load dashboard";
  }

  if (error || !data) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Unable to load LeetCode dashboard</AlertTitle>
        <AlertDescription>
          {error}. Set your LeetCode username in{" "}
          <Link href="/settings" className="underline">
            Settings
          </Link>
          .
        </AlertDescription>
      </Alert>
    );
  }

  const { profile, calendar, solvedToday, todaySuggestion, recentSubmissions } = data;
  const problems = (todaySuggestion?.problems as SuggestedProblem[] | undefined) ?? [];

  const difficultyItems = [
    { label: "Easy", solved: profile.easySolved, total: profile.totalEasy },
    { label: "Medium", solved: profile.mediumSolved, total: profile.totalMedium },
    { label: "Hard", solved: profile.hardSolved, total: profile.totalHard },
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div>
        <h1 className="text-3xl font-semibold">LeetCode</h1>
        <p className="text-muted-foreground">Track progress and daily AI suggestions</p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Badge variant={solvedToday > 0 ? "default" : "destructive"}>
          {solvedToday > 0 ? "Solved today" : "Not solved today"}
        </Badge>
        <Badge variant="secondary">Streak: {calendar.streak} days</Badge>
        <Badge variant="outline">Rank #{profile.ranking.toLocaleString("en-US")}</Badge>
        <SyncNowButton />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardDescription>Total solved</CardDescription>
            <CardTitle className="text-3xl">{profile.totalSolved}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">of {profile.totalQuestions} problems</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Active days</CardDescription>
            <CardTitle className="text-3xl">{calendar.totalActiveDays}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Reputation</CardDescription>
            <CardTitle className="text-3xl">{profile.reputation}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Difficulty breakdown</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {difficultyItems.map((item) => (
            <div key={item.label} className="space-y-1">
              <div className="flex justify-between text-sm">
                <span>{item.label}</span>
                <span>
                  {item.solved}/{item.total}
                </span>
              </div>
              <Progress value={item.total ? (item.solved / item.total) * 100 : 0} />
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Today&apos;s suggestions</CardTitle>
            <CardDescription>AI-picked problems based on your weak areas</CardDescription>
          </div>
          <RegenerateSuggestionsButton />
        </CardHeader>
        <CardContent className="space-y-4">
          {problems.length === 0 ? (
            <p className="text-sm text-muted-foreground">No suggestions yet for today.</p>
          ) : (
            problems.map((problem, index) => (
              <div
                key={problem.slug}
                className="flex flex-wrap items-start justify-between gap-4 rounded-lg border p-4"
              >
                <div>
                  <p className="font-medium">
                    {index + 1}. {problem.title}{" "}
                    <Badge variant="outline">{problem.difficulty}</Badge>
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">{problem.reason}</p>
                  <a
                    href={problem.leetcodeUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 inline-block text-sm text-primary underline"
                  >
                    Open on LeetCode
                  </a>
                </div>
                <div className="flex gap-2">
                  <form action={markSuggestionCompleted.bind(null, problem.slug)}>
                    <Button type="submit" size="sm">
                      Done
                    </Button>
                  </form>
                  <form action={markSuggestionSkipped.bind(null, problem.slug)}>
                    <Button type="submit" variant="ghost" size="sm">
                      Skip
                    </Button>
                  </form>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {recentSubmissions.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Recent submissions</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              {recentSubmissions.map((s) => (
                <li key={`${s.titleSlug}-${s.timestamp}`} className="flex justify-between">
                  <span>{s.title}</span>
                  <span className="text-muted-foreground">{s.lang}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
