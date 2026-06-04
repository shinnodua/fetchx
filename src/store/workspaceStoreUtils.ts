import { ERC20_ABI } from '../features/workspace/constants';
import type { CollectionItem, RequestItem } from '../features/workspace/types';

export const createId = (prefix: 'c' | 'r' | 'env' | 'v') =>
  `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

export const createNewRequestId = () =>
  `r-new-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

export const createDefaultAbi = (type: string) =>
  type === 'READ' || type === 'WRITE' ? JSON.stringify(ERC20_ABI, null, 2) : '';

export const createRequest = (
  id: string,
  name: string,
  type: string,
  overrides: Partial<RequestItem> = {},
): RequestItem => ({
  id,
  name,
  type,
  target: '',
  abi: createDefaultAbi(type),
  functionName: '',
  network: '1',
  args: {},
  headers: [],
  queryParams: [],
  body: '',
  response: null,
  ...overrides,
});

export const createCopyName = (name: string, existingNames: string[]) => {
  const normalizedExistingNames = new Set(
    existingNames.map((existingName) => existingName.toLowerCase()),
  );
  const baseName = `${name} Copy`;

  if (!normalizedExistingNames.has(baseName.toLowerCase())) {
    return baseName;
  }

  let copyIndex = 2;
  let nextName = `${baseName} ${copyIndex}`;
  while (normalizedExistingNames.has(nextName.toLowerCase())) {
    copyIndex += 1;
    nextName = `${baseName} ${copyIndex}`;
  }

  return nextName;
};

export const createAvailableName = (name: string, existingNames: string[]) => {
  const trimmedName = name.trim() || 'Imported Collection';
  const normalizedExistingNames = new Set(
    existingNames.map((existingName) => existingName.toLowerCase()),
  );

  if (!normalizedExistingNames.has(trimmedName.toLowerCase())) {
    return trimmedName;
  }

  return createCopyName(trimmedName, existingNames);
};

export const cloneRequest = (request: RequestItem): RequestItem =>
  JSON.parse(JSON.stringify(request));

export const findRequestById = (
  collections: CollectionItem[],
  reqId: string,
) => {
  for (const collection of collections) {
    const request = collection.requests.find((item) => item.id === reqId);
    if (request) return request;
  }

  return undefined;
};

export const resetDraftForClosedTab = (
  reqId: string,
  collections: CollectionItem[],
  drafts: Record<string, RequestItem>,
) => {
  if (reqId.startsWith('r-new-')) {
    delete drafts[reqId];
    return;
  }

  const original = findRequestById(collections, reqId);

  if (original) {
    drafts[reqId] = cloneRequest(original);
  } else {
    delete drafts[reqId];
  }
};
