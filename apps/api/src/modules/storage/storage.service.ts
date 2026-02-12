import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';
import { randomUUID } from 'crypto';
import { StorageProvider } from './storage.interface';

@Injectable()
export class StorageService implements StorageProvider {
  private readonly uploadDir: string;
  private readonly logger = new Logger(StorageService.name);

  constructor(private configService: ConfigService) {
    this.uploadDir = this.configService.get('UPLOAD_DIR', './uploads');
    this.ensureDirectories();
  }

  private ensureDirectories() {
    const dirs = ['avatars', 'vehicles', 'logos'];
    for (const dir of dirs) {
      const fullPath = path.join(this.uploadDir, dir);
      if (!fs.existsSync(fullPath)) {
        fs.mkdirSync(fullPath, { recursive: true });
        this.logger.log(`Created upload directory: ${fullPath}`);
      }
    }
  }

  async upload(
    file: Buffer,
    filename: string,
    mimetype: string,
  ): Promise<{ path: string; url: string }> {
    const ext = this.getExtension(filename, mimetype);
    const category = this.getCategoryFromFilename(filename);
    const uniqueName = `${randomUUID()}${ext}`;
    const relativePath = `${category}/${uniqueName}`;
    const fullPath = path.join(this.uploadDir, relativePath);

    await fs.promises.writeFile(fullPath, file);

    return {
      path: relativePath,
      url: this.getUrl(relativePath),
    };
  }

  async delete(filePath: string): Promise<void> {
    const fullPath = path.join(this.uploadDir, filePath);
    try {
      await fs.promises.unlink(fullPath);
    } catch (err) {
      this.logger.warn(`Failed to delete file: ${fullPath}`, err);
    }
  }

  getUrl(filePath: string): string {
    return `/uploads/${filePath}`;
  }

  private getExtension(filename: string, mimetype: string): string {
    const extFromName = path.extname(filename);
    if (extFromName) return extFromName;

    const mimeToExt: Record<string, string> = {
      'image/jpeg': '.jpg',
      'image/png': '.png',
      'image/webp': '.webp',
      'image/gif': '.gif',
    };

    return mimeToExt[mimetype] || '.bin';
  }

  private getCategoryFromFilename(filename: string): string {
    const lower = filename.toLowerCase();
    if (lower.includes('avatar')) return 'avatars';
    if (lower.includes('vehicle')) return 'vehicles';
    if (lower.includes('logo')) return 'logos';
    return 'avatars';
  }
}
