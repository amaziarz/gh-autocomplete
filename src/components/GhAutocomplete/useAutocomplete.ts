import { useEffect, useRef, useState } from 'react';

export interface SearchResult {
  id: string;
  name: string;
}

export interface UseAutocompleteParams<T> {
  getData: (value: string) => Promise<T[]>;
  searchDelay?: number;
}

export function useAutocomplete<T extends SearchResult>({
  getData,
  searchDelay = 300,
}: UseAutocompleteParams<T>) {
  const [value, setValue] = useState('');
  const timeoutIdRef = useRef<number | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>();
  const [error, setError] = useState<string | null>(null);
  const [searchResults, setSearchResults] = useState<T[]>([]);

  useEffect(() => {
    if (timeoutIdRef.current) {
      clearTimeout(timeoutIdRef.current);
    }
    if (value.length < 3) {
      return;
    }
    timeoutIdRef.current = setTimeout(async () => {
      try {
        setIsLoading(true);
        setError(null);
        const results = await getData(value);
        setSearchResults(
          [...results].sort((a, b) => a.name.localeCompare(b.name)),
        );
      } catch (error) {
        setError('Error fetching search results. Please try again.');
        setSearchResults([]);
      } finally {
        setIsLoading(false);
      }
    }, searchDelay);
    return () => {
      if (timeoutIdRef.current) {
        clearTimeout(timeoutIdRef.current);
      }
    };
  }, [getData, searchDelay, value]);

  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    setValue(event.target.value);
  }

  function getInputProps() {
    return {
      value,
      onChange: handleChange,
    };
  }

  function getListItemProps(item: T) {
    return {
      key: item.id,
      children: item.name,
    };
  }

  return {
    value,
    isLoading,
    error,
    searchResults,
    getInputProps,
    getListItemProps,
  };
}
