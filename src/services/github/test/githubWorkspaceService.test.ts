import { describe, expect, test } from 'bun:test';
import { hasGitHubAppInstallation } from '../githubInstallationService';
import {
  compareGitHubCommits,
  createGitHubRepository,
  getGitHubAccount,
  getGitHubBranchHead,
  listGitHubRepositories,
  pushGitHubWorkspace,
} from '../githubWorkspaceService';

describe('githubWorkspaceService', () => {
  test('checks whether the expected GitHub App is installed for an owner', async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = (async () =>
      new Response(
        JSON.stringify({
          installations: [
            {
              app_slug: 'fetchx-create',
              account: { login: 'FetchX-Org' },
            },
          ],
        }),
      )) as typeof fetch;

    try {
      await expect(
        hasGitHubAppInstallation('token', 'fetchx-create', 'fetchx-org'),
      ).resolves.toBe(true);
      await expect(
        hasGitHubAppInstallation('token', 'fetchx-sync', 'fetchx-org'),
      ).resolves.toBe(false);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  test('reads the authenticated GitHub account for a connection', async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = (async (input) => {
      expect(String(input)).toBe('https://api.github.com/user');
      return new Response(JSON.stringify({ id: 42, login: 'octocat' }));
    }) as typeof fetch;

    try {
      await expect(getGitHubAccount('token')).resolves.toEqual({
        id: '42',
        login: 'octocat',
      });
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  test('lists accessible repositories in most-recently-updated order', async () => {
    const originalFetch = globalThis.fetch;
    let requestUrl = '';
    let requestHeaders: HeadersInit | undefined;
    globalThis.fetch = (async (input, init) => {
      requestUrl = String(input);
      requestHeaders = init?.headers;
      return new Response(
        JSON.stringify([
          {
            full_name: 'fetchx/api-workspace',
            owner: { login: 'fetchx' },
            name: 'api-workspace',
            default_branch: 'trunk',
            private: true,
          },
        ]),
      );
    }) as typeof fetch;

    try {
      const repositories = await listGitHubRepositories('token');
      expect(requestUrl).toBe(
        'https://api.github.com/user/repos?affiliation=owner,collaborator,organization_member&per_page=100&sort=updated',
      );
      expect(repositories).toEqual([
        {
          fullName: 'fetchx/api-workspace',
          owner: 'fetchx',
          name: 'api-workspace',
          defaultBranch: 'trunk',
          private: true,
        },
      ]);
      expect(requestHeaders).toEqual({
        Accept: 'application/vnd.github+json',
        Authorization: 'Bearer token',
      });
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  test('creates organization repositories through the organization endpoint', async () => {
    const originalFetch = globalThis.fetch;
    let requestUrl = '';
    let requestBody = '';
    globalThis.fetch = (async (input, init) => {
      requestUrl = String(input);
      requestBody = String(init?.body);
      return new Response(
        JSON.stringify({
          full_name: 'fetchx-org/api-workspace',
          owner: { login: 'fetchx-org' },
          name: 'api-workspace',
          default_branch: 'main',
          private: true,
        }),
        { status: 201 },
      );
    }) as typeof fetch;

    try {
      const repository = await createGitHubRepository('token', {
        owner: 'fetchx-org',
        name: 'api-workspace',
        private: true,
      });
      expect(requestUrl).toBe('https://api.github.com/orgs/fetchx-org/repos');
      expect(requestBody).toContain('"private":true');
      expect(repository.fullName).toBe('fetchx-org/api-workspace');
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  test('safely defaults defaultBranch to main when missing in response and cleans Bearer prefix', async () => {
    const originalFetch = globalThis.fetch;
    let requestHeaders: HeadersInit | undefined;
    globalThis.fetch = (async (_input, init) => {
      requestHeaders = init?.headers;
      return new Response(
        JSON.stringify([
          {
            full_name: 'fetchx/empty-repo',
            owner: { login: 'fetchx' },
            name: 'empty-repo',
            private: false,
          },
        ]),
      );
    }) as typeof fetch;

    try {
      const repositories = await listGitHubRepositories('Bearer token123');
      expect(repositories[0].defaultBranch).toBe('main');
      expect(repositories[0].fullName).toBe('fetchx/empty-repo');
      expect(requestHeaders).toEqual({
        Accept: 'application/vnd.github+json',
        Authorization: 'Bearer token123',
      });
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  test('pushGitHubWorkspace encodes path segments without escaping slashes and handles empty repo', async () => {
    const originalFetch = globalThis.fetch;
    const requestedUrls: string[] = [];
    const requestBodies: string[] = [];

    globalThis.fetch = (async (input, init) => {
      const url = String(input);
      requestedUrls.push(url);
      if (init?.body) requestBodies.push(String(init.body));

      // Simulate GET returning 409 "This repository is empty." for initial file check
      if (!init || init.method === 'GET' || !init.method) {
        return new Response(
          JSON.stringify({ message: 'This repository is empty.' }),
          { status: 409 },
        );
      }

      // Simulate PUT succeeding
      return new Response(JSON.stringify({ content: { sha: 'sha123' } }), {
        status: 201,
      });
    }) as typeof fetch;

    try {
      await pushGitHubWorkspace('test-token', 'fetchx/my-repo', 'main', []);

      // Verify that GET checked .fetchx/workspace.json without percent-encoding the slash
      expect(
        requestedUrls.some((url) =>
          url.includes(
            '/repos/fetchx/my-repo/contents/.fetchx/workspace.json?ref=main',
          ),
        ),
      ).toBe(true);

      // Verify that PUT targeted .fetchx/workspace.json without percent-encoding the slash
      expect(
        requestedUrls.some((url) =>
          url.endsWith('/repos/fetchx/my-repo/contents/.fetchx/workspace.json'),
        ),
      ).toBe(true);

      // Verify body contained branch main
      expect(
        requestBodies.some((body) => body.includes('"branch":"main"')),
      ).toBe(true);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  test('pushGitHubWorkspace deletes collection files removed from the manifest', async () => {
    const originalFetch = globalThis.fetch;
    const currentManifest = {
      version: 1,
      updatedAt: '2026-09-20T00:00:00.000Z',
      collections: [
        {
          id: 'kept-collection',
          name: 'Kept',
          path: '.fetchx/collections/kept-collection.json',
        },
      ],
    };
    const requests: Array<{ url: string; method: string; body?: string }> = [];

    globalThis.fetch = (async (input, init) => {
      const url = String(input);
      const method = init?.method || 'GET';
      requests.push({ url, method, body: String(init?.body || '') });

      if (
        method === 'GET' &&
        url.includes('/contents/.fetchx/workspace.json?ref=main')
      ) {
        return new Response(
          JSON.stringify({
            content: btoa(JSON.stringify(currentManifest)),
            sha: 'manifest-sha',
          }),
        );
      }
      if (
        method === 'GET' &&
        url.includes('/contents/.fetchx/collections?ref=main')
      ) {
        return new Response(
          JSON.stringify([
            {
              path: '.fetchx/collections/kept-collection.json',
              sha: 'kept-file-sha',
              type: 'file',
            },
            {
              path: '.fetchx/collections/removed-collection.json',
              sha: 'removed-file-sha',
              type: 'file',
            },
            {
              path: '.fetchx/collections/notes.txt',
              sha: 'unmanaged-file-sha',
              type: 'file',
            },
          ]),
        );
      }
      if (method === 'GET') {
        return new Response(JSON.stringify({ message: 'Not Found' }), {
          status: 404,
        });
      }
      return new Response(JSON.stringify({ commit: { sha: `${method}-sha` } }));
    }) as typeof fetch;

    try {
      await pushGitHubWorkspace('token', 'fetchx/my-repo', 'main', [
        { id: 'kept-collection', name: 'Kept', requests: [] },
      ]);

      const deleteRequest = requests.find(
        (request) => request.method === 'DELETE',
      );
      expect(deleteRequest?.url).toEndWith(
        '/repos/fetchx/my-repo/contents/.fetchx/collections/removed-collection.json',
      );
      expect(JSON.parse(deleteRequest?.body || '{}')).toEqual({
        message: 'chore(fetchx): delete collection "removed-collection"',
        branch: 'main',
        sha: 'removed-file-sha',
      });
      expect(
        requests.some(
          (request) =>
            request.method === 'DELETE' &&
            request.url.includes('kept-collection.json'),
        ),
      ).toBe(false);
      expect(
        requests.some(
          (request) =>
            request.method === 'DELETE' && request.url.includes('notes.txt'),
        ),
      ).toBe(false);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  test('retrieves the branch head commit SHA', async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = (async (input) => {
      expect(String(input)).toContain(
        '/repos/fetchx/my-repo/branches/feature%2Ftest',
      );
      return new Response(
        JSON.stringify({
          name: 'feature/test',
          commit: { sha: 'commit-sha-456' },
        }),
      );
    }) as typeof fetch;

    try {
      const sha = await getGitHubBranchHead(
        'token',
        'fetchx/my-repo',
        'feature/test',
      );
      expect(sha).toBe('commit-sha-456');
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  test('compares commits between base and head ref', async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = (async (input) => {
      expect(String(input)).toContain(
        '/repos/fetchx/my-repo/compare/base-sha-123...main',
      );
      return new Response(
        JSON.stringify({
          status: 'ahead',
          ahead_by: 3,
          behind_by: 0,
          total_commits: 3,
        }),
      );
    }) as typeof fetch;

    try {
      const compare = await compareGitHubCommits(
        'token',
        'fetchx/my-repo',
        'base-sha-123',
        'main',
      );
      expect(compare.aheadBy).toBe(3);
      expect(compare.behindBy).toBe(0);
      expect(compare.status).toBe('ahead');
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});
