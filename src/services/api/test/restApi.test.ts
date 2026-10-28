import { afterEach, describe, expect, spyOn, test } from 'bun:test';

import { executeRestApiCall } from '../restApi';

const target = 'https://rest-body.example.com/items';
let fetchSpy: ReturnType<typeof spyOn<typeof globalThis, 'fetch'>>;

afterEach(() => {
  fetchSpy?.mockRestore();
});

async function sendRequest(
  body: string | undefined,
  headers?: { key: string; value: string }[],
  bodyType?: 'raw' | 'form-data' | 'x-www-form-urlencoded',
  method = 'POST',
  formData?: { key: string; value: string }[],
) {
  fetchSpy = spyOn(globalThis, 'fetch').mockResolvedValue(
    new Response('OK', { status: 200, statusText: 'OK' }),
  );
  await executeRestApiCall(
    method,
    target,
    headers,
    undefined,
    body,
    bodyType,
    formData,
  );
  return fetchSpy.mock.calls[0]?.[1];
}

describe.each(['POST', 'PUT', 'PATCH'])('REST %s content types', (method) => {
  const send = (
    body: string | undefined,
    headers?: { key: string; value: string }[],
    bodyType?: 'raw' | 'form-data' | 'x-www-form-urlencoded',
  ) =>
    sendRequest(body, headers, bodyType, method, [
      { key: 'field', value: 'value' },
    ]);
  test.each([
    'raw',
    undefined,
  ] as const)('adds the JSON content type for body type %s', async (bodyType) => {
    const body = '  {"name":"example"}\n';
    const options = await send(
      body,
      [{ key: 'Accept', value: 'application/json' }],
      bodyType,
    );
    expect(options?.headers).toEqual({
      Accept: 'application/json',
      'content-type': 'application/json',
    });
    expect(options?.body).toBe(body);
  });

  test.each([
    '[]',
    'null',
    'false',
    '42',
    '"hello"',
  ])('recognizes valid JSON body %s', async (body) => {
    const options = await send(body);
    expect(options?.headers).toEqual({ 'content-type': 'application/json' });
  });

  test.each([
    'Content-Type',
    'content-type',
    'CONTENT-TYPE',
  ])('preserves an explicit %s header', async (key) => {
    const headers = [{ key, value: 'application/vnd.example+json' }];
    const options = await send('{}', headers);
    expect(options?.headers).toEqual({ [key]: headers[0]?.value });
    expect(headers).toEqual([{ key, value: 'application/vnd.example+json' }]);
  });

  test.each([
    '',
    '  ',
    '{invalid}',
    'hello',
    'field=value',
  ])('defaults non-JSON raw body %s to plain text', async (body) => {
    const options = await send(body);
    expect(options?.headers).toEqual({
      'content-type': 'text/plain;charset=UTF-8',
    });
    expect(options?.body).toBe(body);
  });

  test('handles lowercase methods', async () => {
    const options = await sendRequest(
      '{}',
      undefined,
      'raw',
      method.toLowerCase(),
    );
    expect(options?.headers).toEqual({ 'content-type': 'application/json' });
  });

  test('does not change other methods', async () => {
    const options = await sendRequest('{}', undefined, 'raw', 'DELETE');
    expect(options?.headers).toEqual({});
  });

  test('does not add a content type when the raw body is absent', async () => {
    const options = await send(undefined);
    expect(options?.headers).toEqual({});
    expect(options?.body).toBeUndefined();
  });

  test('leaves multipart content type to the transport', async () => {
    const options = await send('{}', undefined, 'form-data');
    expect(options?.headers).toEqual({});
    expect(options?.body).toBeInstanceOf(FormData);
    const request = new Request(target, options);
    const contentType = request.headers.get('content-type');
    expect(contentType).toMatch(/^multipart\/form-data; boundary=/);
    const boundary = contentType?.split('boundary=')[1];
    expect(await request.text()).toContain(`--${boundary}\r\n`);
  });

  test.each([
    'Content-Type',
    'content-type',
    'CONTENT-TYPE',
  ])('preserves an explicit %s header for URL-encoded bodies', async (key) => {
    const options = await send(
      undefined,
      [{ key, value: 'custom/type' }],
      'x-www-form-urlencoded',
    );
    expect(options?.headers).toEqual({ [key]: 'custom/type' });
    expect(options?.body).toBe('field=value');
  });

  test.each([
    'raw',
    'x-www-form-urlencoded',
    'form-data',
  ] as const)('preserves explicit headers for body type %s', async (bodyType) => {
    const options = await send(
      'hello',
      [{ key: 'Content-Type', value: 'custom/type' }],
      bodyType,
    );
    expect(options?.headers).toEqual({ 'Content-Type': 'custom/type' });
  });

  test.each([
    'x-www-form-urlencoded',
    'form-data',
  ] as const)('creates an empty %s body when form rows are absent', async (bodyType) => {
    const options = await sendRequest(
      '{}',
      undefined,
      bodyType,
      method,
      undefined,
    );
    if (bodyType === 'form-data') {
      expect(options?.body).toBeInstanceOf(FormData);
      expect(options?.headers).toEqual({});
    } else {
      expect(options?.body).toBe('');
      expect(options?.headers).toEqual({
        'content-type': 'application/x-www-form-urlencoded',
      });
    }
  });

  test('preserves URL-encoded form behavior', async () => {
    const options = await send('{}', undefined, 'x-www-form-urlencoded');
    expect(options?.headers).toEqual({
      'content-type': 'application/x-www-form-urlencoded',
    });
    expect(options?.body).toBe('field=value');
  });
});
