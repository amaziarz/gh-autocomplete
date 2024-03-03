import { useEffect, useRef, useState } from 'react';
import { clsx } from 'clsx';

export interface SearchResult {
  id: string;
  name: string;
}

export interface UseAutocompleteParams<T> {
  getData: (value: string) => Promise<T[]>;
  onSelect?: (item: T) => void;
  searchDelay?: number;
}

type Status = 'initial' | 'loading' | 'success' | 'error';

const MIN_SEARCH_LENGTH = 3;
const KEY_CODES = {
  ARROW_DOWN: 'ArrowDown',
  ARROW_UP: 'ArrowUp',
  ENTER: 'Enter',
} satisfies Record<string, string>;

export function useAutocomplete<
  SearchResultType extends SearchResult,
  ListElementType extends HTMLElement = HTMLUListElement,
>({
  getData,
  onSelect,
  searchDelay = 300,
}: UseAutocompleteParams<SearchResultType>) {
  const timeoutIdRef = useRef<number | null>(null);
  const listRef = useRef<ListElementType | null>(null);
  const [value, setValue] = useState('');
  const [status, setStatus] = useState<Status>('initial');
  const [error, setError] = useState<string | null>(null);
  const [searchResults, setSearchResults] = useState<SearchResultType[]>([]);
  const [selectedItemIndex, setSelectedItemIndex] = useState<number | null>(
    null,
  );

  useEffect(() => {
    if (timeoutIdRef.current) {
      clearTimeout(timeoutIdRef.current);
    }

    if (value.length === 0) {
      setStatus('initial');
      setSearchResults([]);
      setSelectedItemIndex(null);
    }
    if (value.length < MIN_SEARCH_LENGTH) {
      return;
    }

    timeoutIdRef.current = setTimeout(async () => {
      try {
        setStatus('loading');
        setError(null);
        setSelectedItemIndex(null);
        const results = await getData(value);
        setSearchResults(
          [...results].sort((a, b) => a.name.localeCompare(b.name)),
        );
        setStatus('success');
      } catch (error) {
        setStatus('error');
        setError('Error fetching search results. Please try again.');
        setSelectedItemIndex(null);
        setSearchResults([]);
      }
    }, searchDelay);

    return () => {
      if (timeoutIdRef.current) {
        clearTimeout(timeoutIdRef.current);
      }
    };
  }, [getData, searchDelay, value]);

  useEffect(() => {
    if (listRef.current && selectedItemIndex !== null) {
      listRef.current.children[selectedItemIndex].scrollIntoView({
        block: 'nearest',
      });
    }
  }, [selectedItemIndex]);

  function handleInputChange(event: React.ChangeEvent<HTMLInputElement>) {
    setValue(event.target.value);
  }

  const inputKeyDownHandlers: Record<string, VoidFunction> = {
    [KEY_CODES.ARROW_DOWN]: () => {
      setSelectedItemIndex((prevIndex) => {
        if (prevIndex === null || prevIndex === searchResults.length - 1) {
          return 0;
        }
        return prevIndex + 1;
      });
    },
    [KEY_CODES.ARROW_UP]: () => {
      setSelectedItemIndex((prevIndex) => {
        if (prevIndex === null || prevIndex === 0) {
          return searchResults.length - 1;
        }
        return prevIndex - 1;
      });
    },
    [KEY_CODES.ENTER]: () => {
      if (selectedItemIndex !== null) {
        if (onSelect) {
          onSelect(searchResults[selectedItemIndex]);
        } else {
          setValue(searchResults[selectedItemIndex].name);
          setSearchResults([]);
        }
      }
    },
  };

  function handleInputKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    const { code } = event;
    if (inputKeyDownHandlers[code]) {
      event.preventDefault();
      inputKeyDownHandlers[code]();
    }
  }

  function getInputProps() {
    return {
      value,
      onChange: handleInputChange,
      onKeyDown: handleInputKeyDown,
    };
  }

  function getListItemProps(
    item: SearchResultType,
    index: number,
    { className }: { className?: string },
  ) {
    return {
      key: item.id,
      children: item.name,
      className: clsx(className, selectedItemIndex === index && 'bg-gray-100'),
    };
  }

  function getListProps() {
    return {
      ref: listRef,
    };
  }

  return {
    value,
    status,
    isLoading: status === 'loading',
    isSuccess: status === 'success',
    isError: status === 'error',
    error,
    searchResults,
    getInputProps,
    getListItemProps,
    getListProps,
  };
}
