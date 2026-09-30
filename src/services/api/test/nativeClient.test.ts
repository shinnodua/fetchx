import { describe, expect, mock, test } from 'bun:test';

import {
  executeNativeRequest,
  parseNativeResponse,
  serializeNativeRequestBody,
} from '../nativeClient';

describe('nativeClient', () => {
  describe('serializeNativeRequestBody', () => {
    test('handles undefined or null body', async () => {
      const resultNull = await serializeNativeRequestBody(null, {
        accept: 'application/json',
      });
      expect(resultNull).toEqual({
        headers: { accept: 'application/json' },
      });

      const resultUndefined = await serializeNativeRequestBody(undefined, {});
      expect(resultUndefined).toEqual({ headers: {} });
    });

    test('passes string body as-is', async () => {
      const result = await serializeNativeRequestBody('{"name":"fetchx"}', {
        'content-type': 'application/json',
      });
      expect(result).toEqual({
        bodyString: '{"name":"fetchx"}',
        headers: { 'content-type': 'application/json' },
      });
    });

    test('serializes URLSearchParams and adds content-type header if missing', async () => {
      const params = new URLSearchParams({ key: 'val', tag: 'test' });
      const result = await serializeNativeRequestBody(params, {});
      expect(result.bodyString).toBe('key=val&tag=test');
      expect(result.headers['content-type']).toBe(
        'application/x-www-form-urlencoded',
      );
    });

    test('serializes FormData to multipart format with boundary', async () => {
      const formData = new FormData();
      formData.append('username', 'alice');
      formData.append('role', 'admin');

      const result = await serializeNativeRequestBody(formData, {});
      expect(result.bodyString).toContain('name="username"');
      expect(result.bodyString).toContain('alice');
      expect(result.bodyString).toContain('name="role"');
      expect(result.bodyString).toContain('admin');
      expect(result.headers['content-type']).toMatch(
        /^multipart\/form-data; boundary=----FetchXFormBoundary/,
      );
    });
  });

  describe('parseNativeResponse', () => {
    test('parses JSON responses automatically when content-type is application/json', () => {
      const response = parseNativeResponse({
        status: 200,
        statusText: 'OK',
        headers: { 'content-type': 'application/json; charset=utf-8' },
        body: JSON.stringify({ message: 'success', count: 42 }),
      });

      expect(response.status).toBe(200);
      expect(response.statusText).toBe('OK');
      expect(response.proxied).toBe(false);
      expect(response.data).toEqual({ message: 'success', count: 42 });
    });

    test('leaves non-JSON responses as raw text', () => {
      const response = parseNativeResponse({
        status: 200,
        statusText: 'OK',
        headers: { 'content-type': 'text/plain' },
        body: 'Hello world',
      });

      expect(response.status).toBe(200);
      expect(response.proxied).toBe(false);
      expect(response.data).toBe('Hello world');
    });

    test('gracefully falls back to raw text if JSON parsing fails', () => {
      const response = parseNativeResponse({
        status: 200,
        statusText: 'OK',
        headers: { 'content-type': 'application/json' },
        body: 'invalid-json{',
      });

      expect(response.status).toBe(200);
      expect(response.data).toBe('invalid-json{');
    });
  });

  describe('executeNativeRequest', () => {
    test('serializes body and delegates to native executor, returning parsed ApiResponse', async () => {
      const mockNativeExecutor = mock(async (req) => {
        expect(req.url).toBe(
          'https://api.pilauncher.org/v1/public/servers/community',
        );
        expect(req.method).toBe('POST');
        expect(req.body).toBe('{"key":"value"}');
        return {
          status: 200,
          statusText: 'OK',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ success: true, count: 8 }),
        };
      });

      const response = await executeNativeRequest(
        {
          url: 'https://api.pilauncher.org/v1/public/servers/community',
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: '{"key":"value"}',
        },
        mockNativeExecutor,
      );

      expect(mockNativeExecutor).toHaveBeenCalledTimes(1);
      expect(response.status).toBe(200);
      expect(response.statusText).toBe('OK');
      expect(response.proxied).toBe(false);
      expect(response.data).toEqual({ success: true, count: 8 });
    });
  });
});
