/**
 * API Key Encryption Utilities
 *
 * Provides AES-256-GCM encryption for storing API keys securely.
 */

import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

/**
 * Get encryption key from environment
 */
function getEncryptionKey(): Buffer {
  const key = process.env.API_KEY_ENCRYPTION_SECRET;

  if (!key) {
    // In development, use a default key (NOT for production!)
    if (process.env.NODE_ENV === "development") {
      console.warn(
        "WARNING: Using default encryption key. Set API_KEY_ENCRYPTION_SECRET in production!"
      );
      return crypto.scryptSync("dev-secret-key-not-for-prod", "salt", 32);
    }
    throw new Error("API_KEY_ENCRYPTION_SECRET environment variable is required");
  }

  // If hex string (64 chars = 32 bytes)
  if (/^[a-fA-F0-9]{64}$/.test(key)) {
    return Buffer.from(key, "hex");
  }

  // Otherwise derive key from password
  return crypto.scryptSync(key, "viponly-salt", 32);
}

/**
 * Encrypt an API key
 *
 * @param plainKey - The plain API key to encrypt
 * @returns Encrypted string in format: iv:authTag:encrypted
 */
export function encryptApiKey(plainKey: string): string {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);

  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  let encrypted = cipher.update(plainKey, "utf8", "hex");
  encrypted += cipher.final("hex");

  const authTag = cipher.getAuthTag();

  return `${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted}`;
}

/**
 * Decrypt an API key
 *
 * @param encryptedKey - The encrypted key string
 * @returns Decrypted plain API key
 */
export function decryptApiKey(encryptedKey: string): string {
  const key = getEncryptionKey();

  const parts = encryptedKey.split(":");
  if (parts.length !== 3) {
    throw new Error("Invalid encrypted key format");
  }

  const [ivHex, authTagHex, encrypted] = parts;
  const iv = Buffer.from(ivHex, "hex");
  const authTag = Buffer.from(authTagHex, "hex");

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encrypted, "hex", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
}

/**
 * Mask an API key for display
 *
 * @param key - Plain or encrypted API key
 * @returns Masked key like "sk-ant-****1234"
 */
export function maskApiKey(key: string): string {
  if (!key || key.length < 8) {
    return "****";
  }

  // If it looks encrypted (contains :), try to decrypt first
  if (key.includes(":")) {
    try {
      key = decryptApiKey(key);
    } catch {
      return "****";
    }
  }

  // Get prefix (e.g., "sk-ant-", "sk-or-v1-", "sk-")
  const prefixMatch = key.match(/^(sk-(?:ant-|or-v1-|proj-)?)/);
  const prefix = prefixMatch ? prefixMatch[1] : "";

  // Get last 4 characters
  const suffix = key.slice(-4);

  return `${prefix}****${suffix}`;
}

/**
 * Generate a hash of the API key for identification
 * (Used to check if key changed without decrypting)
 *
 * @param key - Plain API key
 * @returns First 16 chars of SHA256 hash
 */
export function hashApiKey(key: string): string {
  return crypto.createHash("sha256").update(key).digest("hex").slice(0, 16);
}

/**
 * Validate that a key can be decrypted
 *
 * @param encryptedKey - The encrypted key to validate
 * @returns True if key can be decrypted
 */
export function isValidEncryptedKey(encryptedKey: string): boolean {
  try {
    decryptApiKey(encryptedKey);
    return true;
  } catch {
    return false;
  }
}

/**
 * Generate a secure encryption secret (for initial setup)
 *
 * @returns 64-character hex string (32 bytes)
 */
export function generateEncryptionSecret(): string {
  return crypto.randomBytes(32).toString("hex");
}
