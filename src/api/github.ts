import { client } from './client.ts';
import type {
  GithubRepository,
  GithubSearchResponse,
  GithubUser,
} from './types/github.ts';

const GITHUB_API_URL = 'https://api.github.com';
const PER_PAGE = 50;

export function searchUsers(
  query: string,
): Promise<GithubSearchResponse<GithubUser>> {
  return client<GithubSearchResponse<GithubUser>>(
    `${GITHUB_API_URL}/search/users?q=${query}&per_page=${PER_PAGE}`,
  );
}

export function searchRepositories(
  query: string,
): Promise<GithubSearchResponse<GithubRepository>> {
  return client(
    `${GITHUB_API_URL}/search/repositories?q=${query}&per_page=${PER_PAGE}`,
  );
}
