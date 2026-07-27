import type { EditionSlot } from "@/lib/system-design/types";
import { format } from "date-fns";

import { Badge } from "@/components/ui/badge";

interface EditionHeaderProps {
  slot: EditionSlot;
  date: Date;
  title: string;
  submitted?: boolean;
  subtitle?: string;
}

export function EditionHeader({ slot, date, title, submitted, subtitle }: EditionHeaderProps) {
  const slotLabel = slot === "am" ? "Morning Edition" : "Evening Edition";

  return (
    <div className="flex flex-col gap-3 border-b pb-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary">{slotLabel}</Badge>
          <span className="text-sm text-muted-foreground">
            {subtitle ?? format(date, "EEEE, MMMM d, yyyy")}
          </span>
        </div>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">{title}</h1>
      </div>
      {submitted && <Badge>Submitted</Badge>}
    </div>
  );
}
