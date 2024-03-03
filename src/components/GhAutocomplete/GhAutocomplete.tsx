import { useEffect, useRef, useState } from 'react';
import { FaSpinner } from 'react-icons/fa';
import { searchRepositories, searchUsers } from '@/api/github.ts';

interface SearchResult {
  type: 'user' | 'repository';
  name: string;
}

export function GhAutocomplete() {
  const [value, setValue] = useState('');
  const timeoutIdRef = useRef<number | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>();
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);

  useEffect(() => {
    if (value.length < 3) {
      return;
    }
    if (timeoutIdRef.current) {
      clearTimeout(timeoutIdRef.current);
    }
    timeoutIdRef.current = setTimeout(async () => {
      setIsLoading(true);
      try {
        const results = await Promise.all([
          searchUsers(value).then((res) =>
            res.items.map<SearchResult>((item) => ({
              type: 'user',
              name: item.login,
            })),
          ),
          searchRepositories(value).then((res) =>
            res.items.map<SearchResult>((item) => ({
              type: 'repository',
              name: item.name,
            })),
          ),
        ]).then((results) =>
          results.flat().sort((a, b) => a.name.localeCompare(b.name)),
        );
        setSearchResults(results);
        setIsLoading(false);
      } catch (error) {
        setIsLoading(false);
      }
    }, 300);
    return () => {
      if (timeoutIdRef.current) {
        clearTimeout(timeoutIdRef.current);
      }
    };
  }, [value]);

  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    setValue(event.target.value);
  }

  return (
    <div>
      <div className="relative w-full sm:w-2/3 md:w-1/2 lg:w-1/3 xl:w-1/4">
        <input
          className="w-full rounded border border-gray-300 p-2 transition duration-150 ease-in-out focus:border-blue-500 focus:outline-none"
          type="text"
          value={value}
          onChange={handleChange}
        />
        {isLoading && (
          <span
            aria-label="loading"
            className="absolute right-4 top-1/2 -translate-y-1/2 transform"
          >
            <FaSpinner className="animate-spin" />
          </span>
        )}
      </div>
      {searchResults.length > 0 && (
        <ul>
          {searchResults.map((result) => (
            <li key={result.name}>{result.name}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
