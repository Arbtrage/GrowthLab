interface UserDataProfile {
  aboutMe: string;
  company?: string;
  countryName?: string;
  realName: string;
  birthday?: string;
  userAvatar: string;
  ranking: number;
  reputation: number;
  school?: string;
  skillTags: string[];
  websites: string[];
}

interface MatchedUser {
  activeBadge: Badge;
  badges: Badge[];
  githubUrl: string;
  linkedinUrl?: string;
  profile: UserDataProfile;
  upcomingBadges: Badge[];
  username: string;
  twitterUrl?: string;
  userCalendar: {
    activeYears: number[];
    streak: number;
    totalActiveDays: number;
    dccBadge: {
      timestamp: number;
      badge: {
        name: string;
        icon: string;
      };
    }[];
    submissionCalendar: string;
  };
  submitStats: {
    totalSubmissionNum: {
      difficulty: Difficulty;
      count: number;
      submissions: number;
    }[];
    acSubmissionNum: {
      difficulty: Difficulty;
      count: number;
      submissions: number;
    }[];
    count: number;
  };
  tagProblemCounts: {
    fundamental: SkillStats[];
    intermediate: SkillStats[];
    advanced: SkillStats[];
  };
  languageProblemCount: { languageName: string; problemsSolved: number }[];
}

export interface UserData {
  userContestRanking: null | {
    attendedContestsCount: number;
    badge: Badge;
    globalRanking: number;
    rating: number;
    totalParticipants: number;
    topPercentage: number;
  };
  userContestRankingHistory: {
    attended: boolean;
    rating: number;
    ranking: number;
    trendDirection: string;
    problemsSolved: number;
    totalProblems: number;
    finishTimeInSeconds: number;
    contest: {
      title: string;
      startTime: string;
    };
  }[];
  matchedUser: MatchedUser;
  recentAcSubmissionList: Submission[];
  recentSubmissionList: Submission[];
  userProfileUserQuestionProgressV2: { count: number; difficulty: string }[];
}

interface Badge {
  name: string;
  icon: string;
}

export interface SkillStats {
  tagName: string;
  tagSlug: string;
  problemsSolved: number;
}

type Difficulty = 'All' | 'Easy' | 'Medium' | 'Hard';

export interface ProblemSetQuestionListData {
  problemsetQuestionList: {
    total: number;
    questions: ProblemListItem[];
  };
}

export interface ProblemListItem {
  title: string;
  titleSlug: string;
  difficulty: string;
  topicTags?: { name: string; slug: string }[];
}

export interface Submission {
  title: string;
  titleSlug: string;
  timestamp: string;
  statusDisplay: string;
  lang: string;
}

interface Question {
  content: string;
  companyTagStats: string[];
  difficulty: Difficulty;
  dislikes: number;
  exampleTestcases: object[];
  hints: object[];
  isPaidOnly: boolean;
  likes: number;
  questionId: number;
  questionFrontendId: number;
  solution: string;
  similarQuestions: object[];
  title: string;
  titleSlug: string;
  topicTags: string[];
}

export interface DailyProblemData {
  activeDailyCodingChallengeQuestion: {
    date: string;
    link: string;
    question: Question;
  };
}

export interface SelectProblemData {
  question: Question;
}

export interface TrendingDiscussionObject {
  data: {
    cachedTrendingCategoryTopics: {
      id: number;
      title: string;
      post: {
        id: number;
        creationDate: number;
        contentPreview: string;
        author: {
          username: string;
          isActive: boolean;
          profile: {
            userAvatar: string;
          };
        };
      };
    }[];
  };
}

export interface UserProfileResponse {
  matchedUser: {
    submitStats: {
      acSubmissionNum: Array<{ count: number }>;
      totalSubmissionNum: unknown;
    };
    submissionCalendar: string;
    profile: {
      ranking: number;
      reputation: number;
    };
    contributions: {
      points: number;
    };
  };
  allQuestionsCount: Array<{ count: number }>;
  recentSubmissionList: unknown[];
}

export type GraphQLParams = Record<string, unknown>;

export type Variables = Record<string, unknown>;

export type SubmissionArgs = { username: string; limit?: number };

export type CalendarArgs = { username: string; year: number };

export type ProblemArgs = {
  limit?: number;
  skip?: number;
  tags?: string;
  difficulty?: string;
};

export class GraphQLClientError extends Error {
  readonly status: number;
  readonly body: unknown;

  constructor(message: string, status: number, body: unknown) {
    super(message);
    this.status = status;
    this.body = body;
  }
}

export type SuggestedProblem = {
  slug: string;
  title: string;
  difficulty: string;
  reason: string;
  leetcodeUrl: string;
};
