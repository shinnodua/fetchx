import type {
  EncryptedEnvironmentValue,
  SensitiveCryptoConfig,
} from '../types';

const SENSITIVE_KEY_ITERATIONS = 210_000;

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary);
}

function base64ToBytes(value: string): Uint8Array {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function bytesToArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  const buffer = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(buffer).set(bytes);
  return buffer;
}

function getCrypto() {
  if (!globalThis.crypto?.subtle) {
    throw new Error('Secure encryption is not available in this environment.');
  }
  return globalThis.crypto;
}

export function validateSensitivePin(pin: string): boolean {
  return /^\d{6,}$/.test(pin);
}

export function createSensitiveCryptoConfig(): SensitiveCryptoConfig {
  const salt = new Uint8Array(16);
  getCrypto().getRandomValues(salt);

  return {
    algorithm: 'AES-GCM',
    digest: 'SHA-256',
    iterations: SENSITIVE_KEY_ITERATIONS,
    salt: bytesToBase64(salt),
  };
}

export async function deriveSensitiveCryptoKey(
  pin: string,
  config: SensitiveCryptoConfig,
): Promise<CryptoKey> {
  if (!validateSensitivePin(pin)) {
    throw new Error('Pincode must be at least 6 numbers.');
  }

  const crypto = getCrypto();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    textEncoder.encode(pin),
    'PBKDF2',
    false,
    ['deriveKey'],
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: bytesToArrayBuffer(base64ToBytes(config.salt)),
      iterations: config.iterations,
      hash: config.digest,
    },
    keyMaterial,
    { name: config.algorithm, length: 256 },
    false,
    ['encrypt', 'decrypt'],
  );
}

export async function encryptSensitiveValue(
  value: string,
  key: CryptoKey,
): Promise<EncryptedEnvironmentValue> {
  const iv = new Uint8Array(12);
  getCrypto().getRandomValues(iv);

  const ciphertext = await getCrypto().subtle.encrypt(
    { name: 'AES-GCM', iv: bytesToArrayBuffer(iv) },
    key,
    textEncoder.encode(value),
  );

  return {
    ciphertext: bytesToBase64(new Uint8Array(ciphertext)),
    iv: bytesToBase64(iv),
  };
}

export async function decryptSensitiveValue(
  encryptedValue: EncryptedEnvironmentValue,
  key: CryptoKey,
): Promise<string> {
  const plaintext = await getCrypto().subtle.decrypt(
    {
      name: 'AES-GCM',
      iv: bytesToArrayBuffer(base64ToBytes(encryptedValue.iv)),
    },
    key,
    bytesToArrayBuffer(base64ToBytes(encryptedValue.ciphertext)),
  );

  return textDecoder.decode(plaintext);
}
