import { describe, expect, test } from 'bun:test';

import { createCorsProxyFetch } from '../rpcTransport';

describe('CORS proxy RPC transport', () => {
  test('forwards JSON-RPC requests through the shared CORS-aware API client', async () => {
    const calls: Parameters<typeof createCorsProxyFetch>[0][] = [];
    const executeApiRequest = async (
      ...args: Parameters<typeof createCorsProxyFetch>[0]
    ) => {
      calls.push(args);
      return {
        status: 200,
        statusText: 'OK',
        headers: { 'content-type': 'application/json' },
        data: { jsonrpc: '2.0', id: 1, result: '0x1' },
        proxied: true,
      };
    };
    const corsProxyFetch = createCorsProxyFetch(executeApiRequest);

    const response = await corsProxyFetch('https://rpc.example.com', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'eth_call' }),
    });

    expect(calls).toEqual([
      [
        {
          url: 'https://rpc.example.com/',
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: '{"jsonrpc":"2.0","id":1,"method":"eth_call"}',
        },
        {
          proxyOnBrowserBlock: true,
          proxyOnForbiddenResponse: true,
        },
      ],
    ]);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      jsonrpc: '2.0',
      id: 1,
      result: '0x1',
    });
  });
});
