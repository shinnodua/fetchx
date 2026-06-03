import type { RequestItem } from '../types';

interface ParsedCurl {
  method: string;
  target: string;
  headers: NonNullable<RequestItem['headers']>;
  queryParams: NonNullable<RequestItem['queryParams']>;
  body: string;
}

const CURL_OPTIONS_WITH_VALUE = [
  '-o',
  '--output',
  '-E',
  '--cert',
  '--key',
  '--capath',
  '--cacert',
  '-K',
  '--config',
  '-y',
  '--speed-time',
  '-Y',
  '--speed-limit',
  '--limit-rate',
  '--retry',
  '--retry-delay',
  '--retry-max-time',
];

export const createImportedRequestName = (method: string, target: string) => {
  let name = 'Imported Request';
  try {
    const urlObj = new URL(target);
    name = `${method} ${urlObj.hostname}${
      urlObj.pathname === '/' ? '' : urlObj.pathname
    }`;
    if (name.length > 30) {
      name = `${method} ${urlObj.hostname}`;
    }
  } catch {
    // Fall back to the generic import name.
  }
  return name;
};

const tokenizeCurl = (curl: string) => {
  const cleanCurl = curl
    .replace(/\\\r?\n/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const args: string[] = [];
  let current = '';
  let inQuote = false;
  let quoteChar = '';

  for (let i = 0; i < cleanCurl.length; i++) {
    const char = cleanCurl[i];
    if (
      (char === '"' || char === "'") &&
      (i === 0 || cleanCurl[i - 1] !== '\\')
    ) {
      if (inQuote && char === quoteChar) {
        inQuote = false;
      } else if (!inQuote) {
        inQuote = true;
        quoteChar = char;
      } else {
        current += char;
      }
    } else if (char === ' ' && !inQuote) {
      if (current) {
        args.push(current);
        current = '';
      }
    } else {
      current += char;
    }
  }

  if (current) {
    args.push(current);
  }

  return args;
};

export const parseCurl = (curl: string): ParsedCurl => {
  const args = tokenizeCurl(curl);
  let method = 'GET';
  let target = '';
  const headers: ParsedCurl['headers'] = [];
  const queryParams: ParsedCurl['queryParams'] = [];
  let body = '';

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    const nextArg = args[i + 1] || '';

    if (arg === '-X' || arg === '--request') {
      method = nextArg.toUpperCase();
      i++;
    } else if (arg === '-H' || arg === '--header') {
      const parts = nextArg.split(':');
      if (parts.length >= 2) {
        headers.push({
          key: parts[0].trim(),
          value: parts.slice(1).join(':').trim(),
        });
      }
      i++;
    } else if (
      arg === '-d' ||
      arg === '--data' ||
      arg === '--data-raw' ||
      arg === '--data-binary' ||
      arg === '--data-ascii' ||
      arg === '--data-urlencode'
    ) {
      body = nextArg;
      i++;
      if (method === 'GET') {
        method = 'POST';
      }
    } else if (arg === '-u' || arg === '--user') {
      try {
        const encoded = btoa(nextArg);
        headers.push({
          key: 'Authorization',
          value: `Basic ${encoded}`,
        });
      } catch {
        // Ignore malformed credential data.
      }
      i++;
    } else if (arg === '--url') {
      target = nextArg;
      i++;
    } else if (arg.startsWith('-')) {
      if (CURL_OPTIONS_WITH_VALUE.includes(arg)) {
        i++;
      }
    } else if (arg !== 'curl' && !target) {
      target = arg;
    }
  }

  if (target) {
    if (!/^https?:\/\//i.test(target)) {
      target = `https://${target}`;
    }
    try {
      const urlObj = new URL(target);
      urlObj.searchParams.forEach((value, key) => {
        queryParams.push({ key, value });
      });
      target = `${urlObj.origin}${urlObj.pathname}`;
    } catch {
      // Keep the parsed target as-is.
    }
  }

  return { method, target, headers, queryParams, body };
};

const isImportObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

export const parseRequestImportContent = (
  content: string,
): Partial<RequestItem> => {
  const trimmedContent = content.trim();
  if (trimmedContent.toLowerCase().startsWith('curl')) {
    const parsedCurl = parseCurl(trimmedContent);
    if (!parsedCurl.target) {
      throw new Error('Failed to parse URL from curl command.');
    }

    return {
      name: createImportedRequestName(parsedCurl.method, parsedCurl.target),
      type: parsedCurl.method,
      target: parsedCurl.target,
      headers: parsedCurl.headers,
      queryParams: parsedCurl.queryParams,
      body: parsedCurl.body,
    };
  }

  const parsed: unknown = JSON.parse(trimmedContent);
  if (!isImportObject(parsed)) {
    throw new Error('Invalid request JSON. Expected an object.');
  }

  const name = typeof parsed.name === 'string' ? parsed.name : '';
  const rawType = typeof parsed.type === 'string' ? parsed.type : '';
  if (!name || !rawType) {
    throw new Error(
      "Invalid request JSON. 'name' and 'type' (e.g. GET, POST, READ, WRITE) are required fields.",
    );
  }

  const method = rawType.toUpperCase();
  if (!['GET', 'POST', 'READ', 'WRITE'].includes(method)) {
    throw new Error('Method must be one of: GET, POST, READ, WRITE');
  }

  return {
    name,
    type: method,
    target: typeof parsed.target === 'string' ? parsed.target : '',
    abi: typeof parsed.abi === 'string' ? parsed.abi : '',
    functionName:
      typeof parsed.functionName === 'string' ? parsed.functionName : '',
    network: typeof parsed.network === 'string' ? parsed.network : '1',
    args: isImportObject(parsed.args)
      ? Object.fromEntries(
          Object.entries(parsed.args).filter(
            (entry): entry is [string, string] => typeof entry[1] === 'string',
          ),
        )
      : {},
    headers: Array.isArray(parsed.headers)
      ? parsed.headers.filter(
          (
            header,
          ): header is {
            key: string;
            value: string;
          } =>
            isImportObject(header) &&
            typeof header.key === 'string' &&
            typeof header.value === 'string',
        )
      : [],
    queryParams: Array.isArray(parsed.queryParams)
      ? parsed.queryParams.filter(
          (
            queryParam,
          ): queryParam is {
            key: string;
            value: string;
          } =>
            isImportObject(queryParam) &&
            typeof queryParam.key === 'string' &&
            typeof queryParam.value === 'string',
        )
      : [],
    body: typeof parsed.body === 'string' ? parsed.body : '',
  };
};
