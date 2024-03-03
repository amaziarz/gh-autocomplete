import { client } from './client.ts';
import type {
  GithubRepository,
  GithubSearchResponse,
  GithubUser,
} from './types/github.ts';

const GITHUB_API_URL = 'https://api.github.com';
const PER_PAGE = 50;
// use a GITHUB_TOKEN to prevent rate limiting
const REQUEST_CONFIG: RequestInit = import.meta.env.VITE_GITHUB_TOKEN
  ? {
      headers: {
        Authorization: `token ${import.meta.env.VITE_GITHUB_TOKEN}`,
      },
    }
  : {};

export function searchUsers(
  query: string,
): Promise<GithubSearchResponse<GithubUser>> {
  return client<GithubSearchResponse<GithubUser>>(
    `${GITHUB_API_URL}/search/users?q=${query}&per_page=${PER_PAGE}`,
    REQUEST_CONFIG,
  );
}

export function searchRepositories(
  query: string,
): Promise<GithubSearchResponse<GithubRepository>> {
  return client(
    `${GITHUB_API_URL}/search/repositories?q=${query}&per_page=${PER_PAGE}`,
    REQUEST_CONFIG,
  );
}
