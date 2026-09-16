export interface StoredFile {
  key: string;
  mimeType: string;
  size: number;
}

/**
 * Storage abstraction for compliance/private documents. Local filesystem
 * provider is used for development; a signed-URL S3-compatible provider is
 * an extension point for production and must not change this interface.
 */
export interface StorageProvider {
  upload(input: { key: string; buffer: Buffer; mimeType: string }): Promise<StoredFile>;
  read(key: string): Promise<Buffer>;
  getSignedUrl(key: string, expiresInSeconds?: number): Promise<string>;
  delete(key: string): Promise<void>;
}
