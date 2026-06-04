import type { RequestItem } from '../types';

export const getRequestIsDirty = (
  draft: RequestItem | undefined,
  original: RequestItem | undefined,
): boolean => {
  if (!draft) return false;

  if (!original) {
    const isDefaultName =
      draft.name === 'Untitled Request' || draft.name === 'Imported Request';
    const isDefaultType = draft.type === 'GET';
    const isDefaultNetwork = draft.network === '1';
    const isTargetEmpty = !draft.target || draft.target.trim() === '';
    const isBodyEmpty = !draft.body || draft.body.trim() === '';
    const isFunctionNameEmpty =
      !draft.functionName || draft.functionName.trim() === '';
    const isAbiEmpty = !draft.abi || draft.abi.trim() === '';
    const isArgsEmpty = !draft.args || Object.keys(draft.args).length === 0;
    const isHeadersEmpty = !draft.headers || draft.headers.length === 0;
    const isQueryParamsEmpty =
      !draft.queryParams || draft.queryParams.length === 0;

    const isEmpty =
      isDefaultName &&
      isDefaultType &&
      isDefaultNetwork &&
      isTargetEmpty &&
      isBodyEmpty &&
      isFunctionNameEmpty &&
      isAbiEmpty &&
      isArgsEmpty &&
      isHeadersEmpty &&
      isQueryParamsEmpty;

    return !isEmpty;
  }

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
