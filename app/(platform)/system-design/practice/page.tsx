import Link from "next/link";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { GeneratePracticeButton } from "@/components/system-design/generate-practice-button";
import { listPracticeEditions } from "@/lib/system-design/practice";
import { requireUser } from "@/lib/users";
import { cn } from "@/lib/utils";

export default async function PracticeListPage() {
  const user = await requireUser();
  const editions = await listPracticeEditions(user.id);

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div>
        <h1 className="text-3xl font-semibold">Practice</h1>
        <p className="text-muted-foreground">Personal system design questions generated on demand</p>
      </div>

      <GeneratePracticeButton />

      {editions.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No practice sessions yet</CardTitle>
            <CardDescription>Generate your first personal challenge above.</CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="grid gap-4">
          {editions.map((edition) => (
            <Card key={edition.id}>
              <CardHeader className="flex flex-row items-start justify-between gap-4">
                <div>
                  <div className="mb-2 flex gap-2">
                    <Badge variant="outline">
                      {edition.slot === "am" ? "Warm-up" : "Full design"}
                    </Badge>
                    <Badge variant="secondary">
                      {format(edition.createdAt, "MMM d, yyyy")}
                    </Badge>
                  </div>
                  <CardTitle className="text-lg">{edition.title}</CardTitle>
                  <CardDescription>{edition.topic}</CardDescription>
                </div>
                <Link
                  href={`/system-design/practice/${edition.id}`}
                  className={cn(buttonVariants())}
                >
                  Open
                </Link>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
