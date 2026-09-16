import "server-only";
import { promises as fs } from "node:fs";
import path from "node:path";
import { env } from "@/lib/env";
import { buildSignedDocumentUrl } from "./signed-url";
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

/**
 * Filesystem provider for local development. Files never live under
 * `public/`, so they are only reachable through the signed document route.
 * Not suitable for serverless hosting (Vercel) — its filesystem is
 * ephemeral and not shared across instances; use the vercel-blob provider
 * there instead.
 */
export const localStorageProvider: StorageProvider = {
  async upload({ key, buffer, mimeType }): Promise<StoredFile> {
    const target = resolveSafePath(key);
    await fs.mkdir(path.dirname(target), { recursive: true });
    await fs.writeFile(target, buffer);
    return { key, mimeType, size: buffer.byteLength };
  },

  async read(key: string): Promise<Buffer> {
    const target = resolveSafePath(key);
    return fs.readFile(target);
  },

  async getSignedUrl(key: string, expiresInSeconds = 300): Promise<string> {
    return buildSignedDocumentUrl(key, expiresInSeconds);
  },

  async delete(key: string): Promise<void> {
    const target = resolveSafePath(key);
    await fs.rm(target, { force: true });
  },
};
