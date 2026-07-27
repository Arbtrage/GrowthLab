import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MarkdownContent } from "@/components/common/MarkdownContent";
import { Separator } from "@/components/ui/separator";

type FollowUpAnswer = {
  probe?: string;
  question?: string;
  answer?: string;
};

type ReviewFeedbackProps = {
  score: number;
  strengths: string[];
  gaps: string[];
  followUpAnswers?: FollowUpAnswer[];
  referenceOutline?: string;
};

export function ReviewFeedback({
  score,
  strengths,
  gaps,
  followUpAnswers = [],
  referenceOutline,
}: ReviewFeedbackProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <CardTitle>AI Feedback</CardTitle>
          <div className="flex size-16 items-center justify-center rounded-full border-4 border-primary/20 bg-primary/5">
            <span className="text-xl font-bold text-primary">{score}</span>
          </div>
        </div>
        <Badge variant="secondary" className="w-fit">
          Score: {score}/100
        </Badge>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <h3 className="font-medium text-success">Strengths</h3>
          <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-muted-foreground">
            {strengths.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        </div>

        <Separator />

        <div>
          <h3 className="font-medium">Gaps</h3>
          <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-muted-foreground">
            {gaps.map((g) => (
              <li key={g}>{g}</li>
            ))}
          </ul>
        </div>

        {followUpAnswers.length > 0 ? (
          <>
            <Separator />
            <div>
              <h3 className="font-medium">Follow-up Q&amp;A</h3>
              <div className="mt-3 space-y-4">
                {followUpAnswers.map((item, index) => {
                  const question = item.probe ?? item.question ?? `Question ${index + 1}`;
                  return (
                    <div key={question} className="rounded-lg border bg-muted/20 p-3">
                      <p className="text-sm font-medium">{question}</p>
                      <p className="mt-2 text-sm text-muted-foreground">{item.answer ?? "—"}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        ) : null}

        {referenceOutline ? (
          <>
            <Separator />
            <details className="group">
              <summary className="cursor-pointer font-medium">Reference outline</summary>
              <div className="mt-3 rounded-lg border bg-muted/10 p-4">
                <MarkdownContent variant="lesson">{referenceOutline}</MarkdownContent>
              </div>
            </details>
          </>
        ) : null}
      </CardContent>
    </Card>
  );
}
