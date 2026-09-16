import "server-only";
import { put, list, del } from "@vercel/blob";
import { env } from "@/lib/env";
import { buildSignedDocumentUrl } from "./signed-url";
import type { StorageProvider, StoredFile } from "./provider";

function token(): string {
  if (!env.BLOB_READ_WRITE_TOKEN) {
    throw new Error("BLOB_READ_WRITE_TOKEN is required when STORAGE_PROVIDER=vercel-blob");
  }
  return env.BLOB_READ_WRITE_TOKEN;
}

/**
 * Blobs are uploaded with public read access (Vercel Blob has no private
 * access tier), but the URL is never handed to the client — only fetched
 * server-side through the signed `/api/compliance/documents/file` route, so
 * documents stay unreachable without a valid session + signature.
 */
async function resolveUrl(key: string): Promise<string> {
  const { blobs } = await list({ prefix: key, limit: 1, token: token() });
  const match = blobs.find((blob) => blob.pathname === key);
  if (!match) throw new Error(`Storage object not found for key: ${key}`);
  return match.url;
}

export const vercelBlobStorageProvider: StorageProvider = {
  async upload({ key, buffer, mimeType }): Promise<StoredFile> {
    await put(key, buffer, {
      access: "public",
      addRandomSuffix: false,
      contentType: mimeType,
      token: token(),
    });
    return { key, mimeType, size: buffer.byteLength };
  },

  async read(key: string): Promise<Buffer> {
    const url = await resolveUrl(key);
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Failed to read storage object: ${key}`);
    return Buffer.from(await response.arrayBuffer());
  },

  async getSignedUrl(key: string, expiresInSeconds = 300): Promise<string> {
    return buildSignedDocumentUrl(key, expiresInSeconds);
  },

  async delete(key: string): Promise<void> {
    const url = await resolveUrl(key).catch(() => null);
    if (url) await del(url, { token: token() });
  },
};
