import * as Crypto from 'expo-crypto';
import { xchacha20poly1305 } from '@noble/ciphers/chacha.js';
import { pbkdf2 } from '@noble/hashes/pbkdf2.js';
import { sha256 } from '@noble/hashes/sha2.js';
import { fromByteArray, toByteArray } from 'base64-js';

const encoder = new TextEncoder();
const decoder = new TextDecoder();

export function randomBase64(length: number): string {
  return fromByteArray(Crypto.getRandomBytes(length));
}

export function deriveKey(secret: string, salt: string): Uint8Array {
  return pbkdf2(sha256, encoder.encode(secret), toByteArray(salt), { c: 150_000, dkLen: 32 });
}

export function encode(bytes: Uint8Array): string { return fromByteArray(bytes); }
export function decode(value: string): Uint8Array { return toByteArray(value); }

export function encrypt(plaintext: string, key: Uint8Array): string {
  const nonce = Crypto.getRandomBytes(24);
  const payload = xchacha20poly1305(key, nonce).encrypt(encoder.encode(plaintext));
  return JSON.stringify({ v: 1, nonce: encode(nonce), data: encode(payload) });
}

export function decrypt(ciphertext: string, key: Uint8Array): string {
  const payload = JSON.parse(ciphertext) as { v: number; nonce: string; data: string };
  if (payload.v !== 1 || typeof payload.nonce !== 'string' || typeof payload.data !== 'string') {
    throw new Error('Unsupported encrypted data');
  }
  return decoder.decode(xchacha20poly1305(key, decode(payload.nonce)).decrypt(decode(payload.data)));
}

export function equalBytes(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let difference = 0;
  for (let i = 0; i < a.length; i++) difference |= a[i] ^ b[i];
  return difference === 0;
}
