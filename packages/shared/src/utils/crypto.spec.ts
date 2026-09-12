import { describe, it, expect } from 'vitest';
import {
  encrypt,
  decrypt,
  serializeEncrypted,
  deserializeEncrypted,
} from './crypto';

const TEST_KEY = 'a'.repeat(64); // 32 bytes in hex

describe('crypto utilities', () => {
  it('encrypts and decrypts a string', () => {
    const plaintext = 'Hello, GrowthOS!';
    const encrypted = encrypt(plaintext, TEST_KEY);

    expect(encrypted.iv).toBeTruthy();
    expect(encrypted.ciphertext).toBeTruthy();
    expect(encrypted.tag).toBeTruthy();
    expect(encrypted.ciphertext).not.toContain(plaintext);

    const decrypted = decrypt(encrypted, TEST_KEY);
    expect(decrypted).toBe(plaintext);
  });

  it('produces different ciphertext for same plaintext (random IV)', () => {
    const plaintext = 'same input';
    const enc1 = encrypt(plaintext, TEST_KEY);
    const enc2 = encrypt(plaintext, TEST_KEY);

    expect(enc1.iv).not.toBe(enc2.iv);
    expect(enc1.ciphertext).not.toBe(enc2.ciphertext);
  });

  it('throws on wrong key', () => {
    const plaintext = 'secret';
    const encrypted = encrypt(plaintext, TEST_KEY);
    const wrongKey = 'b'.repeat(64);

    expect(() => decrypt(encrypted, wrongKey)).toThrow();
  });

  it('serializes and deserializes encrypted data', () => {
    const plaintext = 'oauth-token-value';
    const encrypted = encrypt(plaintext, TEST_KEY);
    const serialized = serializeEncrypted(encrypted);
    const deserialized = deserializeEncrypted(serialized);

    expect(decrypt(deserialized, TEST_KEY)).toBe(plaintext);
  });

  it('throws on invalid key length', () => {
    expect(() => encrypt('test', 'short')).toThrow('32 bytes');
  });

  it('encrypts and decrypts OAuth tokens safely', () => {
    const oauthToken =
      'ya29.a0Ad52N38xKrTESTOAuthTokenThatShouldNeverAppearInLogsOrLLMContext';
    const encrypted = encrypt(oauthToken, TEST_KEY);

    // Token must not appear in any field of encrypted output
    expect(JSON.stringify(encrypted)).not.toContain('ya29');

    const decrypted = decrypt(encrypted, TEST_KEY);
    expect(decrypted).toBe(oauthToken);
  });
});
