import type {
  GithubRepository,
  GithubSearchResponse,
  GithubUser,
} from '@/api/types/github.ts';
import type { SearchResult } from './useAutocomplete.ts';
import { searchRepositories, searchUsers } from '@/api/github.ts';

export interface GithubSearchResult extends SearchResult {
  type: 'user' | 'repository';
  url: string;
}

function mapUsersResponseToSearchResults(
  response: GithubSearchResponse<GithubUser>,
): GithubSearchResult[] {
  return response.items.map((user) => ({
    id: user.id.toString(),
    type: 'user',
    name: user.login,
    url: user.html_url,
  }));
}

function mapRepositoriesResponseToSearchResults(
  response: GithubSearchResponse<GithubRepository>,
): GithubSearchResult[] {
  return response.items.map((repository) => ({
    id: repository.id.toString(),
    type: 'repository',
    name: repository.name,
    url: repository.html_url,
  }));
}

export async function searchGitHub(
  query: string,
): Promise<GithubSearchResult[]> {
  const [users, repositories] = await Promise.all([
    searchUsers(query).then(mapUsersResponseToSearchResults),
    searchRepositories(query).then(mapRepositoriesResponseToSearchResults),
  ]);
  return [...users, ...repositories];
}
