import { env } from "@/lib/env";
import { localStorageProvider } from "./local-provider";
import { vercelBlobStorageProvider } from "./vercel-blob-provider";
import type { StorageProvider } from "./provider";

export type { StorageProvider, StoredFile } from "./provider";
export { verifySignedKey } from "./signed-url";

const providers: Record<string, StorageProvider> = {
  local: localStorageProvider,
  "vercel-blob": vercelBlobStorageProvider,
};

export const storage: StorageProvider = providers[env.STORAGE_PROVIDER] ?? localStorageProvider;
