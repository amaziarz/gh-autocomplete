import { type Reducer, useEffect, useReducer, useRef } from 'react';
import { clsx } from 'clsx';

type NavigationKeyCode = 'ArrowDown' | 'ArrowUp' | 'Enter';

const ALLOWED_KEY_CODES: NavigationKeyCode[] = [
  'ArrowDown',
  'ArrowUp',
  'Enter',
];

function isNavigationCode(code: string): code is NavigationKeyCode {
  return ALLOWED_KEY_CODES.includes(code as NavigationKeyCode);
}

export interface SearchResult {
  id: string;
  name: string;
}

type Status = 'initial' | 'loading' | 'success' | 'error';

type SelectedItemIndex = number | null;

interface AutocompleteState<SearchResultType extends SearchResult> {
  value: string;
  status: Status;
  error: string | null;
  searchResults: SearchResultType[];
  selectedItemIndex: SelectedItemIndex;
}

type AutocompleteAction<SearchResultType extends SearchResult> =
  | {
      type: 'INPUT_VALUE_CHANGED';
      payload: string;
    }
  | {
      type: 'SEARCH_LOADING';
    }
  | {
      type: 'SEARCH_SUCCESS';
      payload: SearchResultType[];
    }
  | {
      type: 'SEARCH_ERROR';
      payload: string;
    }
  | {
      type: 'SELECTED_ITEM_CHANGED';
      payload: NavigationKeyCode;
    };

function calculateSelectedItemIndexState(
  keyCode: NavigationKeyCode,
  prevIndex: SelectedItemIndex,
  searchResultsLength: number,
): SelectedItemIndex {
  if (keyCode === 'ArrowDown') {
    return prevIndex === null || prevIndex === searchResultsLength - 1
      ? 0
      : prevIndex + 1;
  }
  if (keyCode === 'ArrowUp') {
    return prevIndex === null || prevIndex === 0
      ? searchResultsLength - 1
      : prevIndex - 1;
  }
  return null;
}

function autocompleteReducer<SearchResultType extends SearchResult>(
  state: AutocompleteState<SearchResultType>,
  action: AutocompleteAction<SearchResultType>,
): AutocompleteState<SearchResultType> {
  switch (action.type) {
    case 'INPUT_VALUE_CHANGED':
      return {
        ...state,
        value: action.payload,
        ...(action.payload.length === 0 && {
          status: 'initial',
          searchResults: [],
          selectedItemIndex: null,
        }),
      };
    case 'SEARCH_LOADING':
      return {
        ...state,
        status: 'loading',
        error: null,
        selectedItemIndex: null,
      };
    case 'SEARCH_SUCCESS':
      return {
        ...state,
        status: 'success',
        searchResults: [...action.payload].sort((a, b) =>
          a.name.localeCompare(b.name),
        ),
      };
    case 'SEARCH_ERROR':
      return {
        ...state,
        status: 'error',
        error: action.payload,
        searchResults: [],
        selectedItemIndex: null,
      };
    case 'SELECTED_ITEM_CHANGED': {
      return {
        ...state,
        selectedItemIndex: calculateSelectedItemIndexState(
          action.payload,
          state.selectedItemIndex,
          state.searchResults.length,
        ),
      };
    }
    default:
      return state;
  }
}

export interface UseAutocompleteParams<SearchResultType extends SearchResult> {
  getData: (value: string) => Promise<SearchResultType[]>;
  onSelect?: (item: SearchResultType) => void;
  searchDelay?: number;
  minSearchLength?: number;
}

export function useAutocomplete<
  SearchResultType extends SearchResult,
  ListElementType extends HTMLElement = HTMLUListElement,
>({
  getData,
  onSelect,
  searchDelay = 300,
  minSearchLength = 3,
}: UseAutocompleteParams<SearchResultType>) {
  const timeoutIdRef = useRef<number | null>(null);
  const listRef = useRef<ListElementType | null>(null);
  const [state, dispatch] = useReducer<
    Reducer<
      AutocompleteState<SearchResultType>,
      AutocompleteAction<SearchResultType>
    >
  >(autocompleteReducer, {
    value: '',
    status: 'initial',
    error: null,
    searchResults: [],
    selectedItemIndex: null,
  });

  useEffect(() => {
    if (timeoutIdRef.current) {
      clearTimeout(timeoutIdRef.current);
    }

    if (state.value.length < minSearchLength) {
      return;
    }

    timeoutIdRef.current = setTimeout(async () => {
      try {
        dispatch({ type: 'SEARCH_LOADING' });
        const results = await getData(state.value);
        dispatch({ type: 'SEARCH_SUCCESS', payload: results });
      } catch (error) {
        dispatch({
          type: 'SEARCH_ERROR',
          payload: 'Error fetching search results. Please try again.',
        });
      }
    }, searchDelay);

    return () => {
      if (timeoutIdRef.current) {
        clearTimeout(timeoutIdRef.current);
      }
    };
  }, [getData, searchDelay, minSearchLength, state.value]);

  useEffect(() => {
    if (listRef.current && state.selectedItemIndex !== null) {
      listRef.current.children[state.selectedItemIndex].scrollIntoView({
        block: 'nearest',
      });
    }
  }, [state.selectedItemIndex]);

  function handleInputChange(event: React.ChangeEvent<HTMLInputElement>) {
    dispatch({ type: 'INPUT_VALUE_CHANGED', payload: event.target.value });
  }

  function handleInputKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    const { code } = event;
    if (isNavigationCode(code)) {
      event.preventDefault();
      if (code === 'Enter' && state.selectedItemIndex !== null) {
        onSelect?.(state.searchResults[state.selectedItemIndex]);
      } else {
        dispatch({ type: 'SELECTED_ITEM_CHANGED', payload: code });
      }
    }
  }

  function getInputProps() {
    return {
      value: state.value,
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
      className: clsx(
        className,
        state.selectedItemIndex === index && 'bg-gray-100',
      ),
    };
  }

  function getListProps() {
    return {
      ref: listRef,
    };
  }

  return {
    ...state,
    isLoading: state.status === 'loading',
    isSuccess: state.status === 'success',
    isError: state.status === 'error',
    getInputProps,
    getListItemProps,
    getListProps,
  };
}
