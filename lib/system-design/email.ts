import { eq } from "drizzle-orm";
import { Resend } from "resend";
import { MorningEditionEmail } from "@/emails/morning-edition";
import { EveningEditionEmail } from "@/emails/evening-edition";
import { db, profiles, userPreferences } from "@/lib/db";
import { createServiceClient } from "@/lib/supabase/server";

const from = process.env.RESEND_FROM_EMAIL ?? "GrowthLab <onboarding@resend.dev>";
const appUrl = process.env.APP_URL ?? "http://localhost:3000";

function getResend() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return null;
  return new Resend(apiKey);
}

async function sendEmail(params: { to: string; subject: string; react: React.ReactElement }) {
  if (!process.env.RESEND_API_KEY) {
    console.warn(`[email] Would send to ${params.to}: ${params.subject}`);
    return { id: "dev-skipped" };
  }
  const resend = getResend();
  if (!resend) return { id: "dev-skipped" };
  const { data, error } = await resend.emails.send({
    from,
    to: params.to,
    subject: params.subject,
    react: params.react,
  });
  if (error) throw new Error(error.message);
  return data;
}

export async function sendMorningEditionEmail(params: {
  to: string;
  name: string;
  title: string;
  date: string;
}) {
  const challengeUrl = `${appUrl}/system-design/c/${params.date}/am`;
  return sendEmail({
    to: params.to,
    subject: `Morning sketch: ${params.title}`,
    react: MorningEditionEmail({ name: params.name, title: params.title, challengeUrl }),
  });
}

export async function sendEveningEditionEmail(params: {
  to: string;
  name: string;
  title: string;
  date: string;
}) {
  const challengeUrl = `${appUrl}/system-design/c/${params.date}/pm`;
  return sendEmail({
    to: params.to,
    subject: `Evening design: ${params.title}`,
    react: EveningEditionEmail({ name: params.name, title: params.title, challengeUrl }),
  });
}

export async function sendEditionEmailsToUsers(params: {
  slot: "am" | "pm";
  title: string;
  date: string;
}) {
  const usersWithPrefs = await db
    .select({
      userId: profiles.id,
      name: profiles.name,
    })
    .from(profiles)
    .innerJoin(userPreferences, eq(userPreferences.userId, profiles.id))
    .where(eq(userPreferences.sysdesignEmailEnabled, true));

  const supabase = await createServiceClient();
  const sendFn = params.slot === "am" ? sendMorningEditionEmail : sendEveningEditionEmail;
  let sent = 0;

  for (const user of usersWithPrefs) {
    const { data } = await supabase.auth.admin.getUserById(user.userId);
    const email = data.user?.email;
    if (!email) continue;
    await sendFn({
      to: email,
      name: user.name ?? "there",
      title: params.title,
      date: params.date,
    });
    sent++;
  }

  return sent;
}
