import {
  Controller,
  Post,
  Delete,
  Param,
  BadRequestException,
  Inject,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { FastifyRequest } from 'fastify';
import { STORAGE_PROVIDER, StorageProvider } from './storage.interface';

const ALLOWED_MIMETYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'application/pdf',
];

@ApiTags('storage')
@Controller('storage')
@ApiBearerAuth()
export class StorageController {
  constructor(
    @Inject(STORAGE_PROVIDER) private storage: StorageProvider,
  ) {}

  @Post('upload/avatar')
  @ApiOperation({ summary: 'Upload user avatar' })
  async uploadAvatar(@Req() req: FastifyRequest) {
    return this.handleUpload(req, 'avatar');
  }

  @Post('upload/vehicle-photo')
  @ApiOperation({ summary: 'Upload vehicle photo' })
  async uploadVehiclePhoto(@Req() req: FastifyRequest) {
    return this.handleUpload(req, 'vehicle');
  }

  @Post('upload/company-logo')
  @ApiOperation({ summary: 'Upload company logo' })
  async uploadCompanyLogo(@Req() req: FastifyRequest) {
    return this.handleUpload(req, 'logo');
  }

  @Post('upload/news-image')
  @ApiOperation({ summary: 'Upload news image' })
  async uploadNewsImage(@Req() req: FastifyRequest) {
    return this.handleUpload(req, 'news');
  }

  @Delete(':path')
  @ApiOperation({ summary: 'Delete a file' })
  async deleteFile(@Param('path') filePath: string) {
    await this.storage.delete(filePath);
    return { message: 'File deleted' };
  }

  private async handleUpload(req: FastifyRequest, category: string) {
    const file = await req.file();

    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    if (!ALLOWED_MIMETYPES.includes(file.mimetype)) {
      throw new BadRequestException(
        `Invalid file type. Allowed: ${ALLOWED_MIMETYPES.join(', ')}`,
      );
    }

    const buffer = await file.toBuffer();
    const result = await this.storage.upload(
      buffer,
      `${category}_${file.filename}`,
      file.mimetype,
    );

    return {
      url: result.url,
      path: result.path,
    };
  }
}
