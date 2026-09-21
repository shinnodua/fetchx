import { describe, expect, test } from 'bun:test';
import {
  getInitialPullRequestBase,
  getPullRequestBaseBranches,
} from '../GitHubPullRequestDialog';

const branches = [
  { name: 'feature/request-editor', sha: 'feature-sha' },
  { name: 'develop', sha: 'develop-sha' },
  { name: 'main', sha: 'main-sha' },
];

describe('GitHubPullRequestDialog branch selection', () => {
  test('excludes the current head branch from base branch choices', () => {
    expect(
      getPullRequestBaseBranches(branches, 'feature/request-editor').map(
        (branch) => branch.name,
      ),
    ).toEqual(['develop', 'main']);
  });

  test('prefers the repository default branch when it is available', () => {
    expect(
      getInitialPullRequestBase(branches, 'feature/request-editor', 'main'),
    ).toBe('main');
  });

  test('falls back to the first valid base branch', () => {
    expect(
      getInitialPullRequestBase(
        branches,
        'feature/request-editor',
        'missing-default',
      ),
    ).toBe('develop');
    expect(getInitialPullRequestBase(branches, 'main', 'main')).toBe(
      'feature/request-editor',
    );
  });
});
