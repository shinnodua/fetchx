import { describe, expect, test } from 'bun:test';

import type { SensitiveCryptoConfig } from '../../types';
import {
  createSensitiveCryptoConfig,
  decryptSensitiveValue,
  deriveSensitiveCryptoKey,
  encryptSensitiveValue,
  getSensitivePinMinLength,
  SENSITIVE_PIN_MIN_LENGTH,
  validateSensitivePin,
} from '../sensitiveCrypto';

const testCryptoConfig: SensitiveCryptoConfig = {
  algorithm: 'AES-GCM',
  digest: 'SHA-256',
  iterations: 1,
  minPinLength: 4,
  salt: 'AQIDBAUGBwgJCgsMDQ4PEA==',
};

describe('sensitive crypto utilities', () => {
  test('validates pincode lengths and numeric content', () => {
    expect(getSensitivePinMinLength(null)).toBe(6);
    expect(
      getSensitivePinMinLength({ ...testCryptoConfig, minPinLength: 4 }),
    ).toBe(4);
    expect(validateSensitivePin('1234567890')).toBe(true);
    expect(validateSensitivePin('123456789', SENSITIVE_PIN_MIN_LENGTH)).toBe(
      false,
    );
    expect(validateSensitivePin('12345a7890')).toBe(false);
  });

  test('creates crypto configs with base64 salts', () => {
    const config = createSensitiveCryptoConfig();

    expect(config).toMatchObject({
      algorithm: 'AES-GCM',
      digest: 'SHA-256',
      minPinLength: SENSITIVE_PIN_MIN_LENGTH,
    });
    expect(atob(config.salt)).toHaveLength(16);
  });

  test('encrypts and decrypts sensitive values with derived keys', async () => {
    const key = await deriveSensitiveCryptoKey('1234', testCryptoConfig);
    const encrypted = await encryptSensitiveValue('secret token', key);

    expect(encrypted.ciphertext).not.toBe('secret token');
    expect(encrypted.iv).toBeTruthy();
    await expect(decryptSensitiveValue(encrypted, key)).resolves.toBe(
      'secret token',
    );
  });

  test('rejects pins shorter than configured minimum', async () => {
    await expect(
      deriveSensitiveCryptoKey('123', testCryptoConfig),
    ).rejects.toThrow('Pincode must be at least 4 numbers.');
  });
});
