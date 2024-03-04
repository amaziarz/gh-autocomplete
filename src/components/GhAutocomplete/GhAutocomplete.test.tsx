import {
  act,
  render,
  screen,
  waitFor,
  waitForElementToBeRemoved,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as GitHubClient from '@/api/github';
import type { GithubRepository, GithubUser } from '@/api/types/github';
import { GhAutocomplete } from './GhAutocomplete';

const user = userEvent.setup({
  advanceTimers: vi.advanceTimersByTime,
});

const scrollIntoViewMock = vi.fn();

describe('GhAutocomplete', () => {
  beforeAll(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true }); // shouldAdvanceTime for vitest fake timers with rtl
    window.HTMLElement.prototype.scrollIntoView = scrollIntoViewMock;
    window.open = vi.fn();
  });

  it('should render search results and open a github page when user selects an option', async () => {
    vi.spyOn(GitHubClient, 'searchUsers').mockResolvedValue({
      incomplete_results: false,
      total_count: 9,
      items: [
        {
          login: 'test-user',
          id: 1,
          html_url: 'userpage',
        },
      ] as GithubUser[],
    });
    vi.spyOn(GitHubClient, 'searchRepositories').mockResolvedValue({
      incomplete_results: false,
      total_count: 9,
      items: [
        {
          id: 2,
          full_name: 'test-repo',
          html_url: 'repopage',
        },
      ] as GithubRepository[],
    });
    const sortedListItems: string[] = ['test-repo', 'test-user'];

    render(<GhAutocomplete />);

    const text = 'test';
    const input = screen.getByRole('textbox', { name: /github search/i });

    await user.type(input, text);

    act(() => {
      vi.runAllTimers();
    });

    await waitForElementToBeRemoved(() => screen.queryByLabelText(/loading/i));

    expect(GitHubClient.searchUsers).toHaveBeenCalledWith(text);
    expect(GitHubClient.searchUsers).toHaveBeenCalledTimes(1);
    expect(GitHubClient.searchRepositories).toHaveBeenCalledWith(text);
    expect(GitHubClient.searchRepositories).toHaveBeenCalledTimes(1);

    expect(screen.getByRole('list')).toBeInTheDocument();
    const listItems = screen.getAllByRole('listitem');
    expect(listItems).toHaveLength(2);
    listItems.forEach((item, i) => {
      expect(item).toHaveTextContent(sortedListItems[i]);
    });

    await userEvent.keyboard('{arrowdown}{arrowdown}{enter}');

    expect(scrollIntoViewMock).toHaveBeenCalledTimes(2);
    await waitFor(() => {
      expect(window.open).toHaveBeenCalledWith('userpage', '_blank');
    });
  });
});
