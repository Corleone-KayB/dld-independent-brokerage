import { env } from "@/lib/env";
import { localStorageProvider } from "./local-provider";
import type { StorageProvider } from "./provider";

export type { StorageProvider, StoredFile } from "./provider";
export { verifySignedKey } from "./local-provider";

const providers: Record<string, StorageProvider> = {
  local: localStorageProvider,
};

export const storage: StorageProvider = providers[env.STORAGE_PROVIDER] ?? localStorageProvider;
