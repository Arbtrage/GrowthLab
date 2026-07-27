import type { EditionSlot } from "@/lib/system-design/types";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

interface PromptPanelProps {
  slot: EditionSlot;
  prompt: string;
  constraints: string[];
  tasks: Record<string, unknown>;
}

export function PromptPanel({ slot, prompt, constraints, tasks }: PromptPanelProps) {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Scenario</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm leading-relaxed">{prompt}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Constraints</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 font-mono text-sm">
            {constraints.map((constraint, index) => (
              <li key={index} className="rounded-md bg-muted/50 px-3 py-2">
                {constraint}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {slot === "am" ? "Your tasks" : "Guided sections"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          {slot === "am" ? (
            <>
              <TaskItem
                title="Clarifying questions"
                description={String(tasks.clarifyingQuestionsPrompt ?? "")}
              />
              <Separator />
              <TaskItem
                title="Back-of-envelope"
                description={String(tasks.backOfEnvelopePrompt ?? "")}
              />
              <Separator />
              <TaskItem
                title="Trade-off"
                description={String(tasks.tradeOffPrompt ?? "")}
              />
            </>
          ) : (
            (Array.isArray(tasks.sections) ? tasks.sections : []).map(
              (section: { id: string; title: string; description: string }) => (
                <TaskItem
                  key={section.id}
                  title={section.title}
                  description={section.description}
                />
              ),
            )
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function TaskItem({ title, description }: { title: string; description: string }) {
  return (
    <div>
      <p className="font-medium text-foreground">{title}</p>
      <p className="mt-1">{description}</p>
    </div>
  );
}
