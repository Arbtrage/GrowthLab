import { verifyCronAuth } from "@/lib/cron/auth";
import { generateAndDeliverEdition } from "@/lib/system-design/editions";

export async function POST(request: Request) {
  const unauthorized = verifyCronAuth(request);
  if (unauthorized) return unauthorized;

  const { searchParams } = new URL(request.url);
  const slot = searchParams.get("slot");
  if (slot !== "am" && slot !== "pm") {
    return Response.json({ error: "slot must be am or pm" }, { status: 400 });
  }

  try {
    const result = await generateAndDeliverEdition(slot);
    return Response.json(result);
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Generation failed" },
      { status: 500 },
    );
  }
}
