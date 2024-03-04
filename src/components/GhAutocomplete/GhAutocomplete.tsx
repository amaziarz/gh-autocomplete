import { useCallback } from 'react';
import { FaSpinner } from 'react-icons/fa';
import { clsx } from 'clsx';
import { useAutocomplete } from './useAutocomplete.ts';
import {
  type GithubSearchResult,
  searchGitHub,
} from './githubSearchService.ts';

export function GhAutocomplete() {
  const openGithubPage = useCallback(
    (githubSearchResult: GithubSearchResult) => {
      window.open(githubSearchResult.url, '_blank');
    },
    [],
  );
  const {
    getInputProps,
    getListItemProps,
    getListProps,
    searchResults,
    isLoading,
    isSuccess,
    isError,
    error,
  } = useAutocomplete<GithubSearchResult>({
    getData: searchGitHub,
    onSelect: openGithubPage,
  });

  return (
    <div className="relative w-full sm:w-2/3 md:w-1/2 lg:w-1/3 xl:w-1/4">
      <label htmlFor="gh-autocomplete" className="sr-only">
        GitHub Search
      </label>
      <input
        id="gh-autocomplete"
        className={clsx(
          'w-full rounded border border-gray-300 p-2 text-base transition duration-150 ease-in-out focus:border-blue-500 focus:outline-none',
          isError && ['border-red-500', 'focus:border-red-500'],
        )}
        type="text"
        placeholder="User or repository name"
        {...getInputProps()}
      />
      {isLoading && (
        <span
          aria-label="loading"
          className="absolute right-4 top-1/2 -translate-y-1/2 transform"
        >
          <FaSpinner className="animate-spin" />
        </span>
      )}
      {isSuccess && searchResults.length > 0 && (
        <ul
          className="absolute max-h-[22rem] w-full overflow-y-auto rounded border border-gray-200 bg-white"
          {...getListProps()}
        >
          {searchResults.map((result, index) => (
            <li
              {...getListItemProps(result, index, {
                className: 'border-b border-gray-100 p-2 truncate',
              })}
            />
          ))}
        </ul>
      )}
      {isSuccess && searchResults.length === 0 && (
        <p className="absolute w-full rounded border border-gray-200 bg-white p-2 text-base">
          No results found
        </p>
      )}
      {isError && <p className="mx-1 my-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}
