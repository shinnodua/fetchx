import { describe, expect, test } from 'bun:test';

import { findRequestByKeyword } from '../assistantRequestSearch';

const collections = [
  {
    id: 'users',
    name: 'Users',
    requests: [
      {
        id: 'github-user',
        name: 'GitHub User',
        type: 'GET',
        target: 'https://api.github.com/users/octocat',
      },
      {
        id: 'github-repos',
        name: 'GitHub Repositories',
        type: 'GET',
        target: 'https://api.github.com/users/octocat/repos',
      },
    ],
  },
];

describe('assistant request search', () => {
  test('prefers exact request names before partial name and target matches', () => {
    expect(findRequestByKeyword(collections, ' github user ')).toMatchObject({
      id: 'github-user',
    });
    expect(findRequestByKeyword(collections, 'repos')).toMatchObject({
      id: 'github-repos',
    });
    expect(
      findRequestByKeyword(collections, 'api.github.com/users/octocat'),
    ).toMatchObject({
      id: 'github-user',
    });
  });

  test('does not open a request for an empty or unmatched keyword', () => {
    expect(findRequestByKeyword(collections, '')).toBeUndefined();
    expect(findRequestByKeyword(collections, 'Stripe')).toBeUndefined();
  });
});
