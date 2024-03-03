import { FaSpinner } from 'react-icons/fa';
import { useAutocomplete } from './useAutocomplete.ts';
import { GithubSearchResult, searchGitHub } from './githubSearchService.ts';

export function GhAutocomplete() {
  const { getInputProps, getListItemProps, isLoading, searchResults, error } =
    useAutocomplete<GithubSearchResult>({
      getData: searchGitHub,
    });

  return (
    <div className="relative w-full sm:w-2/3 md:w-1/2 lg:w-1/3 xl:w-1/4">
      <input
        className="w-full rounded border border-gray-300 p-2 transition duration-150 ease-in-out focus:border-blue-500 focus:outline-none"
        type="text"
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
      {searchResults.length > 0 && (
        <ul className="absolute max-h-[37.5rem] w-full overflow-y-scroll rounded-b border border-gray-200">
          {searchResults.map((result) => (
            <li {...getListItemProps(result)} />
          ))}
        </ul>
      )}
      {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
    </div>
  );
}
