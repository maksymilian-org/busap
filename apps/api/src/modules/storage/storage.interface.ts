export interface StorageProvider {
  upload(
    file: Buffer,
    filename: string,
    mimetype: string,
  ): Promise<{ path: string; url: string }>;

  delete(path: string): Promise<void>;

  getUrl(path: string): string;
}

export const STORAGE_PROVIDER = 'STORAGE_PROVIDER';
