import { parseAbi } from 'viem';
import type { AbiItem } from '../types';

const ABI_ITEM_TYPES = new Set([
  'constructor',
  'error',
  'event',
  'fallback',
  'function',
  'receive',
]);
const ABI_WRAPPER_KEYS = ['abi', 'ABI', 'result', 'data', 'output'] as const;
const MAX_PARSE_DEPTH = 6;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const unwrapPastedText = (value: string): string => {
  let unwrapped = value.trim();
  const codeFenceMatch = unwrapped.match(
    /^```(?:json|javascript|typescript|solidity)?\s*([\s\S]*?)\s*```$/i,
  );
  if (codeFenceMatch) unwrapped = codeFenceMatch[1].trim();

  const firstCharacter = unwrapped[0];
  const lastCharacter = unwrapped.at(-1);
  if (
    unwrapped.length >= 2 &&
    ((firstCharacter === "'" && lastCharacter === "'") ||
      (firstCharacter === '`' && lastCharacter === '`'))
  ) {
    unwrapped = unwrapped.slice(1, -1).trim();
  }

  return unwrapped;
};

const isAbiParameter = (value: unknown): boolean => {
  if (!isRecord(value) || typeof value.type !== 'string') return false;

  return (
    value.components === undefined ||
    (Array.isArray(value.components) && value.components.every(isAbiParameter))
  );
};

const isAbiItem = (value: unknown): value is AbiItem => {
  if (
    !isRecord(value) ||
    typeof value.type !== 'string' ||
    !ABI_ITEM_TYPES.has(value.type)
  ) {
    return false;
  }

  if (
    (value.type === 'function' ||
      value.type === 'event' ||
      value.type === 'error') &&
    typeof value.name !== 'string'
  ) {
    return false;
  }

  return (
    (value.inputs === undefined ||
      (Array.isArray(value.inputs) && value.inputs.every(isAbiParameter))) &&
    (value.outputs === undefined ||
      (Array.isArray(value.outputs) && value.outputs.every(isAbiParameter)))
  );
};

const splitHumanReadableSignatures = (value: string): string[] => {
  if (!value.includes(';')) return value.split(/\r?\n/);

  const signatures: string[] = [];
  let braceDepth = 0;
  let start = 0;

  for (let index = 0; index < value.length; index += 1) {
    const character = value[index];
    if (character === '{') braceDepth += 1;
    if (character === '}') {
      braceDepth = Math.max(0, braceDepth - 1);
      const currentSignature = value.slice(start, index + 1).trim();
      if (braceDepth === 0 && currentSignature.startsWith('struct ')) {
        signatures.push(currentSignature);
        start = index + 1;
      }
    }

    if (character === ';' && braceDepth === 0) {
      signatures.push(value.slice(start, index));
      start = index + 1;
    }
  }

  signatures.push(value.slice(start));
  return signatures;
};

const parseHumanReadableAbi = (value: string): AbiItem[] | null => {
  const withoutComments = value
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\/\/.*$/gm, '')
    .trim();
  if (!withoutComments) return null;

  const bodyMatch = withoutComments.match(
    /^(?:(?:abstract\s+)?contract|interface|library)\s+\w+(?:\s+is\s+[^{]+)?\s*\{([\s\S]*)\}\s*;?$/,
  );
  const signatureSource = bodyMatch?.[1] ?? withoutComments;
  const signatures = splitHumanReadableSignatures(signatureSource)
    .map((signature) => signature.trim().replace(/,$/, ''))
    .filter(Boolean);

  if (signatures.length === 0) return null;

  try {
    const parsed = parseAbi(signatures);
    return parsed.length > 0 ? ([...parsed] as unknown as AbiItem[]) : null;
  } catch {
    return null;
  }
};

const parseAbiValue = (value: unknown, depth = 0): AbiItem[] | null => {
  if (depth > MAX_PARSE_DEPTH) return null;

  if (typeof value === 'string') {
    const trimmed = unwrapPastedText(value);
    if (!trimmed) return null;

    try {
      return parseAbiValue(JSON.parse(trimmed), depth + 1);
    } catch {
      return parseHumanReadableAbi(trimmed);
    }
  }

  if (Array.isArray(value)) {
    if (value.length === 0) return null;
    if (value.every(isAbiItem)) return value;

    if (value.every((item) => typeof item === 'string')) {
      try {
        const parsed = parseAbi(value);
        return parsed.length > 0 ? ([...parsed] as unknown as AbiItem[]) : null;
      } catch {
        return null;
      }
    }

    const looksLikeInvalidAbi = value.some(
      (item) => isRecord(item) && typeof item.type === 'string',
    );
    if (looksLikeInvalidAbi) return null;

    for (const nestedValue of value) {
      const parsed = parseAbiValue(nestedValue, depth + 1);
      if (parsed) return parsed;
    }

    return null;
  }

  if (!isRecord(value)) return null;
  if (isAbiItem(value)) return [value];

  for (const key of ABI_WRAPPER_KEYS) {
    if (key in value) {
      const parsed = parseAbiValue(value[key], depth + 1);
      if (parsed) return parsed;
    }
  }

  for (const nestedValue of Object.values(value)) {
    const parsed = parseAbiValue(nestedValue, depth + 1);
    if (parsed) return parsed;
  }

  return null;
};

export const parseContractAbi = (value: string): AbiItem[] | null => {
  return parseAbiValue(value);
};

export const isContractBytecode = (value: string): boolean => {
  const trimmed = value.trim();

  return (
    trimmed.length > 42 &&
    trimmed.length % 2 === 0 &&
    /^0x[0-9a-fA-F]+$/.test(trimmed)
  );
};

export const isReadContractFunction = (item: AbiItem): boolean => {
  if (item.type !== 'function') return false;
  if (item.stateMutability === 'view' || item.stateMutability === 'pure') {
    return true;
  }
  if (
    item.stateMutability === 'payable' ||
    item.stateMutability === 'nonpayable'
  ) {
    return false;
  }
  if (item.constant !== undefined) return item.constant;

  // Some legacy and third-party ABIs omit both mutability fields.
  return true;
};

export const isWriteContractFunction = (item: AbiItem): boolean => {
  if (item.type !== 'function') return false;
  if (
    item.stateMutability === 'payable' ||
    item.stateMutability === 'nonpayable'
  ) {
    return true;
  }
  if (item.stateMutability === 'view' || item.stateMutability === 'pure') {
    return false;
  }
  if (item.constant !== undefined) return !item.constant;

  // Keep unknown legacy functions available for either request mode.
  return true;
};

export const formatContractAbi = (value: string): string | null => {
  const parsed = parseContractAbi(value);
  return parsed ? JSON.stringify(parsed, null, 2) : null;
};
