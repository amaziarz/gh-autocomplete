import { type Reducer, useEffect, useReducer, useRef } from 'react';
import { clsx } from 'clsx';

type NavigationKeyCode = 'ArrowDown' | 'ArrowUp' | 'Enter';

const NAVIGATION_KEY_CODES: NavigationKeyCode[] = [
  'ArrowDown',
  'ArrowUp',
  'Enter',
];

function isNavigationCode(code: string): code is NavigationKeyCode {
  return NAVIGATION_KEY_CODES.includes(code as NavigationKeyCode);
}

export interface SearchResult {
  id: string;
  name: string;
}

type Status = 'initial' | 'loading' | 'success' | 'error';

type ActiveItemIndex = number | null;

interface AutocompleteState<SearchResultType extends SearchResult> {
  value: string;
  status: Status;
  error: string | null;
  searchResults: SearchResultType[];
  activeItemIndex: ActiveItemIndex;
  isSelected: boolean;
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
      type: 'NAVIGATION_KEY_DOWN';
      payload: NavigationKeyCode;
    }
  | {
      type: 'SEARCH_RESULT_HOVERED';
      payload: number;
    }
  | {
      type: 'SEARCH_RESULT_SELECTED';
      payload: number;
    };

function calculateActiveItemIndexState(
  keyCode: NavigationKeyCode,
  prevIndex: ActiveItemIndex,
  searchResultsLength: number,
): ActiveItemIndex {
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
        isSelected: false,
        ...(action.payload.length === 0 && {
          status: 'initial',
          searchResults: [],
          activeItemIndex: null,
        }),
      };
    case 'SEARCH_LOADING':
      return {
        ...state,
        status: 'loading',
        error: null,
        activeItemIndex: null,
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
        activeItemIndex: null,
      };
    case 'NAVIGATION_KEY_DOWN':
      return {
        ...state,
        activeItemIndex: calculateActiveItemIndexState(
          action.payload,
          state.activeItemIndex,
          state.searchResults.length,
        ),
      };
    case 'SEARCH_RESULT_HOVERED':
      return {
        ...state,
        activeItemIndex: action.payload,
      };
    case 'SEARCH_RESULT_SELECTED':
      return {
        ...state,
        value: state.searchResults[action.payload].name,
        isSelected: true,
        status: 'initial',
        searchResults: [],
        activeItemIndex: null,
      };
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
    activeItemIndex: null,
    isSelected: false,
  });

  useEffect(() => {
    if (timeoutIdRef.current) {
      clearTimeout(timeoutIdRef.current);
    }

    if (state.value.length < minSearchLength || state.isSelected) {
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
  }, [getData, searchDelay, minSearchLength, state.value, state.isSelected]);

  useEffect(() => {
    if (listRef.current && state.activeItemIndex !== null) {
      listRef.current.children[state.activeItemIndex].scrollIntoView({
        block: 'nearest',
      });
    }
  }, [state.activeItemIndex]);

  function handleInputChange(event: React.ChangeEvent<HTMLInputElement>) {
    dispatch({ type: 'INPUT_VALUE_CHANGED', payload: event.target.value });
  }

  function handleSelect(index: number) {
    if (onSelect) {
      onSelect(state.searchResults[index]);
    } else {
      dispatch({ type: 'SEARCH_RESULT_SELECTED', payload: index });
    }
  }

  function handleInputKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (isNavigationCode(event.code)) {
      event.preventDefault();
      if (event.code === 'Enter' && state.activeItemIndex !== null) {
        handleSelect(state.activeItemIndex);
      } else {
        dispatch({ type: 'NAVIGATION_KEY_DOWN', payload: event.code });
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
        state.activeItemIndex === index && 'bg-gray-200',
      ),
      onMouseEnter: () => {
        dispatch({ type: 'SEARCH_RESULT_HOVERED', payload: index });
      },
      onClick: () => {
        handleSelect(index);
      },
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
