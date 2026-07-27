/**
 * One-time backfill of activity_events from historical submissions and feedback.
 * Usage: pnpm run backfill:activity [userId]
 */
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { eq } from "drizzle-orm";
import * as schema from "../lib/db/schema";

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("DATABASE_URL is required");
  process.exit(1);
}

const userIdArg = process.argv[2];

async function main() {
  const client = postgres(DATABASE_URL!, { ssl: "require", max: 1 });
  const db = drizzle(client, { schema });

  const users = userIdArg
    ? [{ id: userIdArg }]
    : await db.select({ id: schema.profiles.id }).from(schema.profiles);

  let inserted = 0;

  for (const { id: userId } of users) {
    const submissions = await db
      .select()
      .from(schema.leetcodeSubmissions)
      .where(eq(schema.leetcodeSubmissions.userId, userId));

    for (const sub of submissions) {
      await db.insert(schema.activityEvents).values({
        userId,
        module: "leetcode",
        eventType: "problem_solved",
        metadata: {
          titleSlug: sub.titleSlug,
          title: sub.title,
          lang: sub.lang,
          backfill: true,
        },
        occurredAt: sub.timestamp,
      });
      inserted++;
    }

    const sdSubs = await db
      .select({
        submission: schema.sdSubmissions,
        edition: schema.sdEditions,
      })
      .from(schema.sdSubmissions)
      .innerJoin(schema.sdEditions, eq(schema.sdSubmissions.editionId, schema.sdEditions.id))
      .where(eq(schema.sdSubmissions.userId, userId));

    for (const row of sdSubs) {
      if (!row.submission.submittedAt) continue;
      await db.insert(schema.activityEvents).values({
        userId: row.submission.userId,
        module: "system-design",
        eventType: "edition_submitted",
        metadata: {
          editionId: row.submission.editionId,
          slot: row.edition.slot,
          topic: row.edition.topic,
          backfill: true,
        },
        occurredAt: row.submission.submittedAt,
      });
      inserted++;

      const [feedback] = await db
        .select()
        .from(schema.sdFeedback)
        .where(eq(schema.sdFeedback.submissionId, row.submission.id))
        .limit(1);

      if (feedback) {
        await db.insert(schema.activityEvents).values({
          userId: row.submission.userId,
          module: "system-design",
          eventType: "feedback_received",
          metadata: {
            score: feedback.score,
            editionId: row.submission.editionId,
            backfill: true,
          },
          occurredAt: feedback.generatedAt,
        });
        inserted++;
      }
    }

    const practiceSubs = await db
      .select({
        submission: schema.sdPracticeSubmissions,
        edition: schema.sdPracticeEditions,
      })
      .from(schema.sdPracticeSubmissions)
      .innerJoin(
        schema.sdPracticeEditions,
        eq(schema.sdPracticeSubmissions.practiceEditionId, schema.sdPracticeEditions.id),
      )
      .where(eq(schema.sdPracticeSubmissions.userId, userId));

    for (const row of practiceSubs) {
      if (!row.submission.submittedAt) continue;
      await db.insert(schema.activityEvents).values({
        userId: row.submission.userId,
        module: "system-design",
        eventType: "practice_submitted",
        metadata: {
          practiceEditionId: row.submission.practiceEditionId,
          slot: row.edition.slot,
          topic: row.edition.topic,
          backfill: true,
        },
        occurredAt: row.submission.submittedAt,
      });
      inserted++;

      const [feedback] = await db
        .select()
        .from(schema.sdPracticeFeedback)
        .where(eq(schema.sdPracticeFeedback.submissionId, row.submission.id))
        .limit(1);

      if (feedback) {
        await db.insert(schema.activityEvents).values({
          userId: row.submission.userId,
          module: "system-design",
          eventType: "feedback_received",
          metadata: {
            score: feedback.score,
            practiceEditionId: row.submission.practiceEditionId,
            backfill: true,
          },
          occurredAt: feedback.generatedAt,
        });
        inserted++;
      }
    }
  }

  await client.end();
  console.log(`Backfill complete: ${inserted} events inserted for ${users.length} user(s).`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
