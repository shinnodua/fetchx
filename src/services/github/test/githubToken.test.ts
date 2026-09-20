import { describe, expect, test } from 'bun:test';
import { getGitHubTokenType } from '../githubToken';

describe('GitHub token detection', () => {
  test('recognizes classic and fine-grained PAT prefixes', () => {
    expect(getGitHubTokenType('ghp_example')).toBe('classic');
    expect(getGitHubTokenType('github_pat_example')).toBe('fine-grained');
    expect(getGitHubTokenType('other-token')).toBe('unknown');
  });
});
