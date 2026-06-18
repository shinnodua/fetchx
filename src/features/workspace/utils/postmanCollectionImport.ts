import { REST_METHODS } from '../constants';
import type { CollectionItem, RequestItem } from '../types';

type KeyValuePair = { key: string; value: string };

interface PostmanKeyValueItem {
  key?: unknown;
  value?: unknown;
  disabled?: unknown;
}

interface PostmanAuth {
  type?: unknown;
  bearer?: unknown;
  basic?: unknown;
  apikey?: unknown;
}

interface PostmanBody {
  mode?: unknown;
  raw?: unknown;
  urlencoded?: unknown;
  formdata?: unknown;
  graphql?: unknown;
}

interface PostmanRequest {
  method?: unknown;
  header?: unknown;
  body?: unknown;
  url?: unknown;
  auth?: unknown;
}

interface PostmanItem {
  name?: unknown;
  request?: unknown;
  item?: unknown;
  auth?: unknown;
}

interface PostmanCollection {
  info?: unknown;
  item?: unknown;
  auth?: unknown;
}

interface ParsedPostmanUrl {
  target: string;
  queryParams: KeyValuePair[];
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isPostmanCollection = (
  value: unknown,
): value is PostmanCollection & { item: unknown[] } =>
  isRecord(value) &&
  isRecord(value.info) &&
  Array.isArray(value.item) &&
  (typeof value.info.name === 'string' ||
    typeof value.info.schema === 'string' ||
    typeof value.info._postman_id === 'string');

let importIdCounter = 0;

const createImportId = (prefix: 'c' | 'r') => {
  importIdCounter += 1;
  return `${prefix}-postman-${Date.now()}-${importIdCounter}`;
};

const stringValue = (value: unknown) => {
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  return '';
};

const getPostmanCollectionName = (collection: PostmanCollection) => {
  if (isRecord(collection.info) && typeof collection.info.name === 'string') {
    return collection.info.name;
  }

  return 'Imported Postman Collection';
};

const getPostmanKeyValue = (value: unknown, keyName: string): string | null => {
  if (!Array.isArray(value)) return null;

  for (const item of value) {
    if (!isRecord(item)) continue;
    if (item.key === keyName && item.value !== undefined) {
      return stringValue(item.value);
    }
  }

  return null;
};

const normalizeHeaderKey = (key: string) => key.trim().toLowerCase();

const hasHeader = (headers: KeyValuePair[], key: string) => {
  const normalizedKey = normalizeHeaderKey(key);
  return headers.some(
    (header) => normalizeHeaderKey(header.key) === normalizedKey,
  );
};

const parsePostmanKeyValueArray = (value: unknown): KeyValuePair[] => {
  if (!Array.isArray(value)) return [];

  return value.flatMap((item: PostmanKeyValueItem) => {
    if (!isRecord(item) || item.disabled === true) return [];

    const key = stringValue(item.key).trim();
    if (!key) return [];

    return [{ key, value: stringValue(item.value) }];
  });
};

const parsePostmanAuthHeaders = (auth: PostmanAuth | null): KeyValuePair[] => {
  if (!auth || typeof auth.type !== 'string') return [];

  const authType = auth.type.toLowerCase();
  if (authType === 'noauth') return [];

  if (authType === 'bearer') {
    const token = getPostmanKeyValue(auth.bearer, 'token');
    return token ? [{ key: 'Authorization', value: `Bearer ${token}` }] : [];
  }

  if (authType === 'basic') {
    const username = getPostmanKeyValue(auth.basic, 'username') ?? '';
    const password = getPostmanKeyValue(auth.basic, 'password') ?? '';
    if (!username && !password) return [];

    return [
      {
        key: 'Authorization',
        value: `Basic ${btoa(`${username}:${password}`)}`,
      },
    ];
  }

  if (authType === 'apikey') {
    const key = getPostmanKeyValue(auth.apikey, 'key');
    const value = getPostmanKeyValue(auth.apikey, 'value');
    const inLocation = getPostmanKeyValue(auth.apikey, 'in');

    if (!key || !value || inLocation === 'query') return [];
    return [{ key, value }];
  }

  return [];
};

const parsePostmanAuth = (
  value: unknown,
  inheritedAuth: PostmanAuth | null,
): PostmanAuth | null => {
  if (value === null) return null;
  if (isRecord(value)) return value;
  return inheritedAuth;
};

const parseQueryString = (queryString: string): KeyValuePair[] => {
  const params = new URLSearchParams(queryString);
  return Array.from(params.entries()).map(([key, value]) => ({ key, value }));
};

const splitUrlAndQuery = (rawUrl: string): ParsedPostmanUrl => {
  const [withoutHash] = rawUrl.split('#');
  const queryStart = withoutHash.indexOf('?');
  if (queryStart === -1) {
    return { target: withoutHash, queryParams: [] };
  }

  return {
    target: withoutHash.slice(0, queryStart),
    queryParams: parseQueryString(withoutHash.slice(queryStart + 1)),
  };
};

const parsePostmanUrlObject = (value: Record<string, unknown>) => {
  if (typeof value.raw === 'string') {
    return splitUrlAndQuery(value.raw);
  }

  const protocol = stringValue(value.protocol);
  const host = Array.isArray(value.host)
    ? value.host.map(stringValue).join('.')
    : stringValue(value.host);
  const path = Array.isArray(value.path)
    ? value.path.map(stringValue).join('/')
    : stringValue(value.path);

  const targetParts = [
    protocol ? `${protocol}://` : '',
    host,
    path ? `/${path.replace(/^\/+/, '')}` : '',
  ];

  return { target: targetParts.join(''), queryParams: [] };
};

const parsePostmanUrl = (value: unknown): ParsedPostmanUrl => {
  if (typeof value === 'string') return splitUrlAndQuery(value);
  if (!isRecord(value)) return { target: '', queryParams: [] };

  const parsedUrl = parsePostmanUrlObject(value);
  const queryParams = parsePostmanKeyValueArray(value.query);

  return {
    target: parsedUrl.target,
    queryParams: queryParams.length > 0 ? queryParams : parsedUrl.queryParams,
  };
};

const parseUrlEncodedBody = (value: unknown) =>
  new URLSearchParams(
    parsePostmanKeyValueArray(value).map(({ key, value: itemValue }) => [
      key,
      itemValue,
    ]),
  ).toString();

const parseFormDataBody = (value: unknown) =>
  parsePostmanKeyValueArray(value)
    .map(({ key, value: itemValue }) => `${key}: ${itemValue}`)
    .join('\n');

const parseGraphqlBody = (value: unknown) => {
  if (!isRecord(value)) return '';

  return JSON.stringify(
    {
      query: stringValue(value.query),
      variables: stringValue(value.variables),
    },
    null,
    2,
  );
};

const parsePostmanBody = (value: unknown) => {
  if (!isRecord(value)) return '';

  const body = value as PostmanBody;
  if (body.mode === 'raw') return stringValue(body.raw);
  if (body.mode === 'urlencoded') return parseUrlEncodedBody(body.urlencoded);
  if (body.mode === 'formdata') return parseFormDataBody(body.formdata);
  if (body.mode === 'graphql') return parseGraphqlBody(body.graphql);

  return '';
};

const parsePostmanRequest = (
  item: PostmanItem,
  request: PostmanRequest,
  inheritedAuth: PostmanAuth | null,
  path: string[],
): RequestItem | null => {
  const method = stringValue(request.method).toUpperCase() || 'GET';
  if (!REST_METHODS.includes(method)) return null;

  const parsedUrl = parsePostmanUrl(request.url);
  if (!parsedUrl.target) return null;

  const inheritedOrRequestAuth = parsePostmanAuth(request.auth, inheritedAuth);
  const headers = parsePostmanKeyValueArray(request.header);
  for (const authHeader of parsePostmanAuthHeaders(inheritedOrRequestAuth)) {
    if (!hasHeader(headers, authHeader.key)) {
      headers.push(authHeader);
    }
  }

  return {
    id: createImportId('r'),
    name: [...path, stringValue(item.name) || `${method} Request`].join(' / '),
    type: method,
    target: parsedUrl.target,
    abi: '',
    functionName: '',
    network: '',
    args: {},
    headers,
    queryParams: parsedUrl.queryParams,
    body: parsePostmanBody(request.body),
    response: null,
    savedResponses: [],
    savedResponsesCollapsed: false,
  };
};

const collectPostmanRequests = (
  items: unknown[],
  inheritedAuth: PostmanAuth | null,
  path: string[] = [],
): RequestItem[] => {
  const requests: RequestItem[] = [];

  for (const itemValue of items) {
    if (!isRecord(itemValue)) continue;

    const item = itemValue as PostmanItem;
    const itemAuth = parsePostmanAuth(item.auth, inheritedAuth);
    if (Array.isArray(item.item)) {
      requests.push(
        ...collectPostmanRequests(item.item, itemAuth, [
          ...path,
          stringValue(item.name) || 'Folder',
        ]),
      );
      continue;
    }

    if (!isRecord(item.request)) continue;

    const request = parsePostmanRequest(item, item.request, itemAuth, path);
    if (request) requests.push(request);
  }

  return requests;
};

export const canParsePostmanCollection = isPostmanCollection;

export const parsePostmanCollection = (
  value: PostmanCollection & { item: unknown[] },
): CollectionItem[] => [
  {
    id: createImportId('c'),
    name: getPostmanCollectionName(value),
    requests: collectPostmanRequests(
      value.item,
      parsePostmanAuth(value.auth, null),
    ),
  },
];
