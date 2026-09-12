import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';

const ALGORITHM = 'aes-256-gcm' as const;
const IV_LENGTH = 12; // 96 bits — recommended for GCM
const TAG_LENGTH = 16; // 128-bit auth tag

export interface EncryptedData {
  iv: string; // hex
  ciphertext: string; // hex
  tag: string; // hex
}

/**
 * Encrypt plaintext using AES-256-GCM.
 * @param plaintext - The data to encrypt
 * @param keyHex - 32-byte key as hex string (64 chars)
 */
export function encrypt(plaintext: string, keyHex: string): EncryptedData {
  const key = Buffer.from(keyHex, 'hex');
  if (key.length !== 32) {
    throw new Error('Encryption key must be 32 bytes (64 hex chars)');
  }

  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv, { authTagLength: TAG_LENGTH });

  const ciphertext = Buffer.concat([
    cipher.update(plaintext, 'utf8'),
    cipher.final(),
  ]);

  const tag = cipher.getAuthTag();

  return {
    iv: iv.toString('hex'),
    ciphertext: ciphertext.toString('hex'),
    tag: tag.toString('hex'),
  };
}

/**
 * Decrypt data encrypted with `encrypt()`.
 * @param data - Encrypted data object
 * @param keyHex - Same 32-byte key used for encryption
 */
export function decrypt(data: EncryptedData, keyHex: string): string {
  const key = Buffer.from(keyHex, 'hex');
  if (key.length !== 32) {
    throw new Error('Encryption key must be 32 bytes (64 hex chars)');
  }

  const iv = Buffer.from(data.iv, 'hex');
  const ciphertext = Buffer.from(data.ciphertext, 'hex');
  const tag = Buffer.from(data.tag, 'hex');

  const decipher = createDecipheriv(ALGORITHM, key, iv, { authTagLength: TAG_LENGTH });
  decipher.setAuthTag(tag);

  const plaintext = Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ]);

  return plaintext.toString('utf8');
}

/**
 * Serialize EncryptedData to a string for storage (JSON).
 */
export function serializeEncrypted(data: EncryptedData): string {
  return JSON.stringify(data);
}

/**
 * Deserialize stored encrypted string back to EncryptedData.
 */
export function deserializeEncrypted(stored: string): EncryptedData {
  const parsed: unknown = JSON.parse(stored);
  if (
    typeof parsed !== 'object' ||
    parsed === null ||
    typeof (parsed as Record<string, unknown>)['iv'] !== 'string' ||
    typeof (parsed as Record<string, unknown>)['ciphertext'] !== 'string' ||
    typeof (parsed as Record<string, unknown>)['tag'] !== 'string'
  ) {
    throw new Error('Invalid encrypted data format');
  }
  return parsed as EncryptedData;
}
