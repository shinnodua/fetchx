import { parseUnits } from 'viem';

const DECIMALS_ARG_SUFFIX = '__decimals';
const VALUE_MODE_ARG_SUFFIX = '__valueMode';

export type ContractArgValueMode = 'hex' | 'dec';

export function getArgDecimalsKey(inputName: string) {
  return `${inputName}${DECIMALS_ARG_SUFFIX}`;
}

export function getArgValueModeKey(inputName: string) {
  return `${inputName}${VALUE_MODE_ARG_SUFFIX}`;
}

export function isIntegerAbiType(type: string) {
  return (
    !type.includes('[') && (type.startsWith('uint') || type.startsWith('int'))
  );
}

export function isStringAbiType(type: string) {
  return type === 'string';
}

function isDecimalInteger(value: string) {
  return /^\d+$/.test(value.trim());
}

function isHexInteger(value: string) {
  return /^0x[0-9a-fA-F]+$/.test(value.trim());
}

export function convertDecimalStringToHex(value: string) {
  if (!isDecimalInteger(value)) return value;

  return `0x${BigInt(value.trim()).toString(16)}`;
}

export function convertHexStringToDecimal(value: string) {
  if (!isHexInteger(value)) return value;

  return BigInt(value.trim()).toString(10);
}

export function formatStringContractArg(
  value: string,
  mode: string | undefined,
) {
  if (mode !== 'dec') return value;

  return convertDecimalStringToHex(value);
}

function parsePositiveDecimals(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (!/^\d{1,2}$/.test(trimmed)) return null;

  const decimals = Number(trimmed);
  if (!Number.isInteger(decimals) || decimals <= 0) return null;

  return decimals;
}

export function formatIntegerContractArg(value: string, decimalsValue: string) {
  const decimals = parsePositiveDecimals(decimalsValue);
  if (decimals === null) return BigInt(value);

  return parseUnits(value, decimals);
}
