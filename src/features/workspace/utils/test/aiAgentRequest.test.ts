import { describe, expect, test } from 'bun:test';

import {
  buildAiAgentPrompt,
  parseAiAgentResponse,
  sanitizeAiCollectionDraft,
  sanitizeAiRequestDraft,
  shouldRunCreatedRequest,
} from '../aiAgentRequest';

describe('AI agent request utilities', () => {
  test('parses structured create responses from fenced JSON', () => {
    const result = parseAiAgentResponse(`
      Here you go:
      \`\`\`json
      {
        "message": "Created a GitHub request.",
        "action": "create",
        "request": {
          "name": "GitHub User",
          "type": "get",
          "target": "https://api.github.com/users/octocat",
          "headers": [{ "key": "Accept", "value": "application/json" }]
        }
      }
      \`\`\`
    `);

    expect(result).toEqual({
      message: 'Created a GitHub request.',
      action: 'create_request',
      request: {
        name: 'GitHub User',
        type: 'GET',
        target: 'https://api.github.com/users/octocat',
        headers: [{ key: 'Accept', value: 'application/json' }],
      },
    });
  });

  test('sanitizes unknown fields and invalid methods', () => {
    expect(
      sanitizeAiRequestDraft({
        name: '  Token Balance  ',
        type: 'TRACE',
        target: '  0x123  ',
        dangerous: 'ignored',
        args: { owner: '  {{WALLET}}  ' },
      }),
    ).toEqual({
      name: 'Token Balance',
      target: '0x123',
      args: { owner: '{{WALLET}}' },
    });
  });

  test('turns a cURL target into a REST request draft', () => {
    expect(
      sanitizeAiRequestDraft({
        target:
          'curl -X POST -H "Accept: application/json" -d \'{"name":"Ada"}\' "https://api.example.com/users?include=roles"',
      }),
    ).toEqual({
      type: 'POST',
      target: 'https://api.example.com/users',
      headers: [{ key: 'Accept', value: 'application/json' }],
      queryParams: [{ key: 'include', value: 'roles' }],
      body: '{"name":"Ada"}',
    });
  });

  test('falls back to a no-op chat message for prose responses', () => {
    expect(parseAiAgentResponse('Please provide a target URL.')).toEqual({
      action: 'none',
      message: 'Please provide a target URL.',
    });
  });

  test('explains when an empty agent response cannot form a request', () => {
    expect(parseAiAgentResponse('')).toEqual({
      action: 'none',
      message:
        'Your request could not be understood. Please check the details and try again.',
    });
  });

  test('builds a prompt with the active request and response contract', () => {
    const prompt = buildAiAgentPrompt({
      userMessage: 'make this a POST',
      activeRequest: {
        id: 'r-1',
        name: 'Example',
        type: 'GET',
        target: 'https://example.com',
      },
    });

    expect(prompt).toContain('"action":"create_request|update_request');
    expect(prompt).toContain('Do not use tools, inspect files, run commands');
    expect(prompt).toContain('"name": "Example"');
    expect(prompt).toContain('make this a POST');
  });

  test('parses collection creation and request-save actions', () => {
    expect(
      parseAiAgentResponse(
        '{"message":"Created the Auth collection.","action":"create_collection","collection":{"name":" Auth "}}',
      ),
    ).toEqual({
      message: 'Created the Auth collection.',
      action: 'create_collection',
      collection: { name: 'Auth' },
    });

    expect(
      parseAiAgentResponse(
        '{"message":"Saved the request.","action":"save_request_to_collection","collection":{"name":"API"}}',
      ).action,
    ).toBe('save_request_to_collection');
    expect(sanitizeAiCollectionDraft({ name: '  Payments  ' })).toEqual({
      name: 'Payments',
    });

    expect(
      parseAiAgentResponse(
        '{"message":"Created a collection and request.","action":"create_collection_with_request","collection":{"name":"Users"},"request":{"name":"List users","type":"get","target":"/users"}}',
      ),
    ).toMatchObject({
      action: 'create_collection_with_request',
      collection: { name: 'Users' },
      request: { name: 'List users', type: 'GET', target: '/users' },
    });
  });

  test('only runs a created request when the user explicitly asks for it', () => {
    expect(
      shouldRunCreatedRequest('Create a GET request for the GitHub API.'),
    ).toBe(false);
    expect(
      shouldRunCreatedRequest(
        'Create a GET request for the GitHub API and send it.',
      ),
    ).toBe(true);
    expect(shouldRunCreatedRequest('Do the request now.')).toBe(true);
  });
});
