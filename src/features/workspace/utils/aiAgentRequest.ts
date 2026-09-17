import type { RequestItem } from '../types';
import { parseCurl } from './requestImport';

export type AiAssistantAction =
  | 'create_request'
  | 'update_request'
  | 'create_collection'
  | 'create_collection_with_request'
  | 'save_request_to_collection'
  | 'none';

export interface AiRequestDraft {
  name?: string;
  type?: string;
  target?: string;
  abi?: string;
  functionName?: string;
  network?: string;
  contractName?: string;
  customRpcId?: string;
  args?: Record<string, string>;
  headers?: { key: string; value: string }[];
  queryParams?: { key: string; value: string }[];
  body?: string;
  bodyType?: 'raw' | 'form-data' | 'x-www-form-urlencoded';
  formData?: { key: string; value: string }[];
}

export interface AiAgentStructuredResponse {
  message: string;
  action: AiAssistantAction;
  request?: AiRequestDraft;
  collection?: AiCollectionDraft;
}

export interface AiCollectionDraft {
  name?: string;
}

const allowedTypes = new Set([
  'GET',
  'POST',
  'PUT',
  'PATCH',
  'DELETE',
  'READ',
  'WRITE',
  'SEND',
]);

const requestFieldNames = [
  'name',
  'type',
  'target',
  'abi',
  'functionName',
  'network',
  'contractName',
  'customRpcId',
  'args',
  'headers',
  'queryParams',
  'body',
  'bodyType',
  'formData',
] as const;

type RequestFieldName = (typeof requestFieldNames)[number];

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const getString = (value: unknown) =>
  typeof value === 'string' ? value.trim() : undefined;

const normalizePairs = (value: unknown) => {
  if (!Array.isArray(value)) return undefined;

  return value
    .filter(isRecord)
    .map((item) => ({
      key: getString(item.key) || '',
      value: getString(item.value) || '',
    }))
    .filter((item) => item.key || item.value);
};

const normalizeArgs = (value: unknown) => {
  if (!isRecord(value)) return undefined;

  return Object.fromEntries(
    Object.entries(value)
      .map(([key, itemValue]) => [key.trim(), String(itemValue ?? '').trim()])
      .filter(([key, itemValue]) => key || itemValue),
  );
};

export function sanitizeAiRequestDraft(value: unknown): AiRequestDraft {
  if (!isRecord(value)) return {};

  const request: AiRequestDraft = {};
  for (const fieldName of requestFieldNames) {
    if (!(fieldName in value)) continue;

    const fieldValue = value[fieldName];
    switch (fieldName satisfies RequestFieldName) {
      case 'type': {
        const type = getString(fieldValue)?.toUpperCase();
        if (type && allowedTypes.has(type)) request.type = type;
        break;
      }
      case 'args': {
        const args = normalizeArgs(fieldValue);
        if (args) request.args = args;
        break;
      }
      case 'headers':
      case 'queryParams':
      case 'formData': {
        const pairs = normalizePairs(fieldValue);
        if (pairs && fieldName === 'headers') request.headers = pairs;
        if (pairs && fieldName === 'queryParams') request.queryParams = pairs;
        if (pairs && fieldName === 'formData') request.formData = pairs;
        break;
      }
      case 'bodyType': {
        const bodyType = getString(fieldValue);
        if (
          bodyType === 'raw' ||
          bodyType === 'form-data' ||
          bodyType === 'x-www-form-urlencoded'
        ) {
          request.bodyType = bodyType;
        }
        break;
      }
      default: {
        const textValue = getString(fieldValue);
        if (textValue === undefined) break;
        if (fieldName === 'name') request.name = textValue;
        if (fieldName === 'target') request.target = textValue;
        if (fieldName === 'abi') request.abi = textValue;
        if (fieldName === 'functionName') request.functionName = textValue;
        if (fieldName === 'network') request.network = textValue;
        if (fieldName === 'contractName') request.contractName = textValue;
        if (fieldName === 'customRpcId') request.customRpcId = textValue;
        if (fieldName === 'body') request.body = textValue;
      }
    }
  }

  if (/^curl(?:\.exe)?\b/i.test(request.target || '')) {
    const parsedCurl = parseCurl(request.target || '');
    if (parsedCurl.target) {
      request.target = parsedCurl.target;
      request.type = parsedCurl.method;
      request.headers = parsedCurl.headers;
      request.queryParams = parsedCurl.queryParams;
      request.body = parsedCurl.body;
    }
  }

  return request;
}

export function sanitizeAiCollectionDraft(value: unknown): AiCollectionDraft {
  if (!isRecord(value)) return {};

  const name = getString(value.name);
  return name ? { name } : {};
}

const actionAliases: Record<string, AiAssistantAction> = {
  create: 'create_request',
  create_request: 'create_request',
  update: 'update_request',
  update_request: 'update_request',
  create_collection: 'create_collection',
  create_collection_with_request: 'create_collection_with_request',
  save_request_to_collection: 'save_request_to_collection',
};

export function parseAiAgentResponse(
  rawContent: string,
): AiAgentStructuredResponse {
  const fencedMatch = rawContent.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fencedMatch?.[1] || rawContent;
  const firstBrace = candidate.indexOf('{');
  const lastBrace = candidate.lastIndexOf('}');

  if (firstBrace < 0 || lastBrace <= firstBrace) {
    return {
      action: 'none',
      message:
        rawContent.trim() ||
        'Your request could not be understood. Please check the details and try again.',
    };
  }

  try {
    const parsed = JSON.parse(candidate.slice(firstBrace, lastBrace + 1));
    if (!isRecord(parsed)) throw new Error('Expected object response.');

    const actionValue = getString(parsed.action)?.toLowerCase();
    const action = actionValue ? actionAliases[actionValue] || 'none' : 'none';
    const request = sanitizeAiRequestDraft(parsed.request);
    const collection = sanitizeAiCollectionDraft(parsed.collection);
    const message =
      getString(parsed.message) ||
      (action === 'none'
        ? 'The agent replied without changing the request.'
        : 'The agent formed a request draft.');

    return {
      action,
      message,
      ...(Object.keys(request).length > 0 ? { request } : {}),
      ...(Object.keys(collection).length > 0 ? { collection } : {}),
    };
  } catch {
    return {
      action: 'none',
      message:
        rawContent.trim() ||
        'Your request could not be understood. Please check the details and try again.',
    };
  }
}

export function shouldRunCreatedRequest(userMessage: string) {
  const message = userMessage.toLowerCase();
  return (
    /\brequest\b/.test(message) &&
    /\b(?:send|run|execute|perform|do)\b/.test(message)
  );
}

export function buildAiAgentPrompt(input: {
  userMessage: string;
  activeRequest: RequestItem | null;
}) {
  const activeRequestJson = input.activeRequest
    ? JSON.stringify(input.activeRequest, null, 2)
    : 'null';

  return `You are an API and smart-contract request assistant inside Fetchx.
Turn the user's chat message into a Fetchx request or collection action.

Rules:
- Return only JSON. Do not wrap it in markdown.
- Do not use tools, inspect files, run commands, or modify anything. Respond directly from this prompt.
- Use this exact shape: {"message":"short user-facing summary","action":"create_request|update_request|create_collection|create_collection_with_request|save_request_to_collection|none","request":{...fields},"collection":{"name":"..."}}.
- Use action "create_request" when the user asks for a new request. Include collection.name when they ask to save it in an existing collection.
- Use action "update_request" when the user asks to modify the active request.
- Use action "create_collection" when the user asks for a collection without a request.
- Use action "create_collection_with_request" when the user asks to make a new collection and put a new request in it. Include both request and collection.
- Use action "save_request_to_collection" when the user asks to save the active request in a collection. Include collection.
- Use action "none" if there is not enough information.
- A collection name is required for every collection action. Do not invent a collection name when the user did not provide one.
- Allowed request fields: ${requestFieldNames.join(', ')}.
- Allowed type values: ${Array.from(allowedTypes).join(', ')}.
- For REST requests, set type, target, optional headers, queryParams, body, and bodyType.
- When the user provides a cURL command, parse it into those REST fields. Never put the whole cURL command in request.target.
- For contract requests, set type READ/WRITE/SEND, target, network, abi, functionName, args, and contractName when known.
- Preserve environment placeholders like {{API_KEY}} exactly.

Active request:
${activeRequestJson}

User message:
${input.userMessage}`;
}
