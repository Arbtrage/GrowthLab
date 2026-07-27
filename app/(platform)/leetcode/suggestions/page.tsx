import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { db, leetcodeAiSuggestions } from "@/lib/db";
import type { SuggestedProblem } from "@/lib/leetcode/types";
import { requireUser } from "@/lib/users";

export default async function SuggestionsPage() {
  const user = await requireUser();

  const suggestions = await db
    .select()
    .from(leetcodeAiSuggestions)
    .where(eq(leetcodeAiSuggestions.userId, user.id))
    .orderBy(desc(leetcodeAiSuggestions.date))
    .limit(30);

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <h1 className="text-3xl font-semibold">Suggestions history</h1>
        <p className="text-muted-foreground">Past AI-generated daily plans</p>
      </div>

      {suggestions.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No suggestions yet</CardTitle>
          </CardHeader>
        </Card>
      ) : (
        <div className="space-y-4">
          {suggestions.map((s) => {
            const problems = s.problems as SuggestedProblem[];
            return (
              <Card key={s.id}>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-base">{s.date}</CardTitle>
                  <Badge variant="outline">{s.status}</Badge>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm">
                    {problems.map((p) => (
                      <li key={p.slug}>
                        <Link href={p.leetcodeUrl} className="text-primary underline" target="_blank">
                          {p.title}
                        </Link>{" "}
                        — {p.reason}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
