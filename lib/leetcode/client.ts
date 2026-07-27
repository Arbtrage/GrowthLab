import { GraphQLClientError, type GraphQLParams } from './types';

const GRAPHQL_ENDPOINT = 'https://leetcode.com/graphql';

export async function executeGraphQL(
  query: string,
  variables: GraphQLParams = {},
): Promise<unknown> {
  const response = await fetch(GRAPHQL_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Referer: 'https://leetcode.com',
    },
    body: JSON.stringify({ query, variables }),
  });

  const payload = await response.json();

  if (!response.ok) {
    throw new GraphQLClientError(
      'HTTP error when calling LeetCode GraphQL',
      response.status,
      payload,
    );
  }

  if (payload?.errors) {
    throw new GraphQLClientError(
      'LeetCode GraphQL responded with errors',
      response.status,
      payload,
    );
  }

  return payload.data;
}
