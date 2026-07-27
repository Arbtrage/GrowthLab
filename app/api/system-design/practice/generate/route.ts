import { NextResponse } from "next/server";
import { z } from "zod";
import { generatePracticeEdition } from "@/lib/system-design/practice";
import { requireUser } from "@/lib/users";

const bodySchema = z.object({
  slot: z.enum(["am", "pm"]).optional(),
});

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const body = await request.json().catch(() => ({}));
    const parsed = bodySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const result = await generatePracticeEdition(user.id, { slot: parsed.data.slot });
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Generation failed" },
      { status: 500 },
    );
  }
}
