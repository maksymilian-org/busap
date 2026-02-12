import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { randomUUID } from 'crypto';
import * as path from 'path';
import { StorageProvider } from './storage.interface';

@Injectable()
export class R2StorageService implements StorageProvider {
  private readonly s3: S3Client;
  private readonly bucket: string;
  private readonly publicUrl: string;
  private readonly logger = new Logger(R2StorageService.name);

  constructor(private configService: ConfigService) {
    const accountId = this.configService.getOrThrow<string>('R2_ACCOUNT_ID');
    const accessKeyId = this.configService.getOrThrow<string>('R2_ACCESS_KEY_ID');
    const secretAccessKey = this.configService.getOrThrow<string>('R2_SECRET_ACCESS_KEY');

    this.bucket = this.configService.get('R2_BUCKET_NAME', 'busap-storage');
    this.publicUrl = this.configService.get(
      'R2_PUBLIC_URL',
      `https://${this.bucket}.${accountId}.r2.cloudflarestorage.com`,
    );

    this.s3 = new S3Client({
      region: 'auto',
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });

    this.logger.log('R2 Storage initialized');
  }

  async upload(
    file: Buffer,
    filename: string,
    mimetype: string,
  ): Promise<{ path: string; url: string }> {
    const ext = this.getExtension(filename, mimetype);
    const category = this.getCategoryFromFilename(filename);
    const uniqueName = `${randomUUID()}${ext}`;
    const key = `${category}/${uniqueName}`;

    await this.s3.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: file,
        ContentType: mimetype,
      }),
    );

    this.logger.log(`Uploaded file: ${key}`);

    return {
      path: key,
      url: this.getUrl(key),
    };
  }

  async delete(filePath: string): Promise<void> {
    try {
      await this.s3.send(
        new DeleteObjectCommand({
          Bucket: this.bucket,
          Key: filePath,
        }),
      );
      this.logger.log(`Deleted file: ${filePath}`);
    } catch (err) {
      this.logger.warn(`Failed to delete file: ${filePath}`, err);
    }
  }

  getUrl(filePath: string): string {
    const base = this.publicUrl.replace(/\/+$/, '');
    return `${base}/${filePath}`;
  }

  private getExtension(filename: string, mimetype: string): string {
    const extFromName = path.extname(filename);
    if (extFromName) return extFromName;

    const mimeToExt: Record<string, string> = {
      'image/jpeg': '.jpg',
      'image/png': '.png',
      'image/webp': '.webp',
      'image/gif': '.gif',
      'application/pdf': '.pdf',
    };

    return mimeToExt[mimetype] || '.bin';
  }

  private getCategoryFromFilename(filename: string): string {
    const lower = filename.toLowerCase();
    if (lower.includes('avatar')) return 'avatars';
    if (lower.includes('vehicle')) return 'vehicles';
    if (lower.includes('logo')) return 'logos';
    if (lower.includes('report')) return 'reports';
    return 'uploads';
  }
}
