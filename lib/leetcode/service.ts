import {
  formatAcSubmissionData,
  formatDailyData,
  formatProblemsData,
  formatQuestionData,
  formatSkillStats,
  formatSubmissionCalendarData,
  formatUserProfileData,
} from './formatters';
import {
  AcSubmissionQuery,
  dailyProblemQuery,
  getUserProfileQuery,
  problemListQuery,
  selectProblemQuery,
  skillStatsQuery,
  userProfileCalendarQuery,
} from './queries';
import type {
  DailyProblemData,
  ProblemSetQuestionListData,
  SelectProblemData,
  UserData,
  UserProfileResponse,
  Variables,
  CalendarArgs,
  ProblemArgs,
  SubmissionArgs,
} from './types';
import { executeGraphQL } from './client';

function buildVariables(input: Record<string, unknown>): Variables {
  const result: Variables = {};
  for (const [key, value] of Object.entries(input)) {
    if (
      value !== undefined &&
      value !== null &&
      !(typeof value === 'number' && Number.isNaN(value))
    ) {
      result[key] = value;
    }
  }
  return result;
}

export async function getUserProfileAggregate(username: string) {
  const data = await executeGraphQL(getUserProfileQuery, { username });
  return formatUserProfileData(data as UserProfileResponse);
}

export async function getRecentAcSubmission(args: SubmissionArgs) {
  const variables = buildVariables({
    username: args.username,
    limit: args.limit,
  });
  const data = await executeGraphQL(AcSubmissionQuery, variables);
  return formatAcSubmissionData(data as UserData);
}

export async function getSubmissionCalendar(args: CalendarArgs) {
  const variables = buildVariables({
    username: args.username,
    year: args.year,
  });
  const data = await executeGraphQL(userProfileCalendarQuery, variables);
  return formatSubmissionCalendarData(data as UserData);
}

export async function getSkillStats(username: string) {
  const data = await executeGraphQL(skillStatsQuery, { username });
  return formatSkillStats(data as UserData);
}

export async function getDailyProblem() {
  const data = await executeGraphQL(dailyProblemQuery, {});
  return formatDailyData(data as DailyProblemData);
}

export async function getSelectProblem(titleSlug: string) {
  const data = await executeGraphQL(selectProblemQuery, { titleSlug });
  return formatQuestionData(data as SelectProblemData);
}

export async function getProblemSet(args: ProblemArgs) {
  const limit =
    args.skip !== undefined && args.limit === undefined ? 1 : (args.limit ?? 20);
  const skip = args.skip ?? 0;
  const tags = args.tags ? args.tags.split(' ') : [];
  const difficulty = args.difficulty ?? undefined;
  const variables = buildVariables({
    categorySlug: '',
    limit,
    skip,
    filters: {
      tags,
      difficulty,
    },
  });
  const data = await executeGraphQL(problemListQuery, variables);
  return formatProblemsData(data as ProblemSetQuestionListData);
}
