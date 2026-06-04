import type { RequestItem } from '../types';

export const getRequestIsDirty = (
  draft: RequestItem | undefined,
  original: RequestItem | undefined,
): boolean => {
  if (!draft) return false;
  if (!original) return true;

  return (
    draft.name !== original.name ||
    draft.type !== original.type ||
    draft.target !== original.target ||
    draft.body !== original.body ||
    draft.functionName !== original.functionName ||
    draft.network !== original.network ||
    JSON.stringify(draft.headers) !== JSON.stringify(original.headers) ||
    JSON.stringify(draft.queryParams) !==
      JSON.stringify(original.queryParams) ||
    JSON.stringify(draft.args) !== JSON.stringify(original.args) ||
    draft.abi !== original.abi
  );
};
