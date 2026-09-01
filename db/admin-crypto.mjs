// Password and token primitives for administrator accounts.
//
// This module is plain ESM JavaScript on purpose: `app/api/_shared.ts` and
// `scripts/lead-admin.mjs` both import it, so the application and the
// maintenance CLI can never drift apart. Duplicating password hashing across
// two files is how an administrator ends up locked out by a format change.

import { createHash, randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(scryptCallback);

// 128 * N * r = 16 MiB, comfortably under the 32 MiB Node default ceiling.
const SCRYPT_PARAMS = { N: 16384, r: 8, p: 1, maxmem: 64 * 1024 * 1024 };
const KEY_BYTES = 64;
const SALT_BYTES = 16;

/** Lowercase hex SHA-256. Used for token digests and length-safe comparisons. */
export function sha256Hex(value) {
  return createHash("sha256").update(String(value), "utf8").digest("hex");
}

/** URL-safe random token for session cookies. 32 bytes by default. */
export function randomToken(bytes = 32) {
  return randomBytes(bytes).toString("base64url");
}

/** Returns the salt and key derived from a plain-text password. */
export async function hashPassword(password) {
  const salt = randomBytes(SALT_BYTES).toString("hex");
  return { salt, hash: (await derive(password, salt)).toString("hex") };
}

export async function verifyPassword(password, salt, expectedHash) {
  const actual = await derive(password, salt);
  const expected = Buffer.from(String(expectedHash ?? ""), "hex");
  if (expected.length !== actual.length) return false;
  return timingSafeEqual(actual, expected);
}

async function derive(password, salt) {
  return scrypt(String(password), String(salt), KEY_BYTES, SCRYPT_PARAMS);
}

/**
 * Compares two secrets in constant time without revealing their length.
 *
 * Both sides are hashed first, so the loop always runs over a fixed-width
 * digest and the early `length` bail-out present in a naive comparison (which
 * leaks how long the secret is) never happens.
 */
export function constantTimeEqual(a, b) {
  return timingSafeEqual(Buffer.from(sha256Hex(a), "hex"), Buffer.from(sha256Hex(b), "hex"));
}

/** Placeholder credentials with the same shape as a real row, for equal-time failures. */
export function dummyPassword() {
  return { salt: "0".repeat(SALT_BYTES * 2), hash: "0".repeat(KEY_BYTES * 2) };
}
