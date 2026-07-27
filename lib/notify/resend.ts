import { Resend } from "resend";

type EmailPayload = {
  subject: string;
  html: string;
  text: string;
  to: string;
};

function getResendClient() {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;
  if (!apiKey || !from) return null;
  return { client: new Resend(apiKey), from };
}

export async function sendEmailNotification(payload: EmailPayload): Promise<void> {
  const config = getResendClient();
  if (!config) {
    console.warn("Resend not configured, skipping notification");
    return;
  }
  const { error } = await config.client.emails.send({
    from: config.from,
    to: payload.to,
    subject: payload.subject,
    html: payload.html,
    text: payload.text,
  });
  if (error) throw new Error(`Resend error: ${error.message}`);
}

export function formatSuggestionEmail(
  problems: Array<{ title: string; difficulty: string; reason: string; leetcodeUrl: string }>,
) {
  const items = problems
    .map(
      (p, i) =>
        `<li><strong>${i + 1}. ${p.title}</strong> (${p.difficulty})<br/>${p.reason}<br/><a href="${p.leetcodeUrl}">${p.leetcodeUrl}</a></li>`,
    )
    .join("");
  const text = problems
    .map((p, i) => `${i + 1}. ${p.title} (${p.difficulty})\n   ${p.reason}\n   ${p.leetcodeUrl}`)
    .join("\n\n");
  return {
    subject: "Today's LeetCode plan — GrowthLab",
    html: `<h2>Today's LeetCode plan</h2><ul>${items}</ul>`,
    text: `Today's LeetCode plan\n\n${text}`,
  };
}

export function formatMissedDayEmail(
  streak: number,
  problems: Array<{ title: string; leetcodeUrl: string }>,
) {
  const items = problems.map((p) => `<li><a href="${p.leetcodeUrl}">${p.title}</a></li>`).join("");
  const textProblems = problems.map((p) => `- ${p.title}: ${p.leetcodeUrl}`).join("\n");
  return {
    subject: "LeetCode streak alert — GrowthLab",
    html: `<h2>Streak alert</h2><p>Current streak: <strong>${streak}</strong> days.</p><ul>${items}</ul>`,
    text: `Streak alert\n\nCurrent streak: ${streak} days.\n\n${textProblems}`,
  };
}
