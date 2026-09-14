import "server-only";
import { promises as fs } from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { env } from "@/lib/env";
import type { StorageProvider, StoredFile } from "./provider";

const UPLOAD_ROOT = path.resolve(process.cwd(), env.UPLOAD_DIR);

function resolveSafePath(key: string): string {
  const normalized = path.normalize(key).replace(/^([./\\]+)/, "");
  const resolved = path.resolve(UPLOAD_ROOT, normalized);
  if (!resolved.startsWith(UPLOAD_ROOT)) {
    throw new Error("Invalid storage key");
  }
  return resolved;
}

function sign(key: string, expiresAt: number): string {
  return crypto
    .createHmac("sha256", env.AUTH_SECRET)
    .update(`${key}:${expiresAt}`)
    .digest("hex");
}

export function verifySignedKey(key: string, expiresAt: number, signature: string): boolean {
  if (Date.now() > expiresAt) return false;
  const expected = sign(key, expiresAt);
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature.padEnd(expected.length, "0")));
}

/**
 * Filesystem provider for local development. Files never live under
 * `public/`, so they are only reachable through the signed document route.
 */
export const localStorageProvider: StorageProvider = {
  async upload({ key, buffer, mimeType }): Promise<StoredFile> {
    const target = resolveSafePath(key);
    await fs.mkdir(path.dirname(target), { recursive: true });
    await fs.writeFile(target, buffer);
    return { key, mimeType, size: buffer.byteLength };
  },

  async getSignedUrl(key: string, expiresInSeconds = 300): Promise<string> {
    const expiresAt = Date.now() + expiresInSeconds * 1000;
    const signature = sign(key, expiresAt);
    const params = new URLSearchParams({ key, expiresAt: String(expiresAt), signature });
    return `/api/compliance/documents/file?${params.toString()}`;
  },

  async delete(key: string): Promise<void> {
    const target = resolveSafePath(key);
    await fs.rm(target, { force: true });
  },
};
