import type { AbiItem } from '../types';

export const parseContractAbi = (value: string): AbiItem[] | null => {
  try {
    const parsed: unknown = JSON.parse(value);
    if (
      !Array.isArray(parsed) ||
      parsed.length === 0 ||
      !parsed.every(
        (item) =>
          typeof item === 'object' &&
          item !== null &&
          'type' in item &&
          typeof item.type === 'string',
      )
    ) {
      return null;
    }

    return parsed as AbiItem[];
  } catch {
    return null;
  }
};

export const formatContractAbi = (value: string): string | null => {
  const parsed = parseContractAbi(value);
  return parsed ? JSON.stringify(parsed, null, 2) : null;
};
