import "server-only";
import crypto from "node:crypto";
import { env } from "@/lib/env";

function sign(key: string, expiresAt: number): string {
  return crypto
    .createHmac("sha256", env.AUTH_SECRET)
    .update(`${key}:${expiresAt}`)
    .digest("hex");
}

export function signKey(key: string, expiresInSeconds: number): { expiresAt: number; signature: string } {
  const expiresAt = Date.now() + expiresInSeconds * 1000;
  return { expiresAt, signature: sign(key, expiresAt) };
}

export function verifySignedKey(key: string, expiresAt: number, signature: string): boolean {
  if (Date.now() > expiresAt) return false;
  const expected = sign(key, expiresAt);
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature.padEnd(expected.length, "0")));
}

export function buildSignedDocumentUrl(key: string, expiresInSeconds: number): string {
  const { expiresAt, signature } = signKey(key, expiresInSeconds);
  const params = new URLSearchParams({ key, expiresAt: String(expiresAt), signature });
  return `/api/compliance/documents/file?${params.toString()}`;
}
