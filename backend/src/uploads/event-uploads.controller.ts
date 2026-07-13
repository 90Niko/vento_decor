import {
  Controller,
  FileTypeValidator,
  Headers,
  MaxFileSizeValidator,
  Param,
  ParseFilePipe,
  ParseUUIDPipe,
  Post,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { UploadedEventImage, UploadsService } from './uploads.service';

const MAX_FILES = 10;
const MAX_FILE_SIZE = 20 * 1024 * 1024;

@Controller('events/public/:publicId/images')
export class EventUploadsController {
  constructor(private readonly uploadsService: UploadsService) {}

  @Post()
  @UseInterceptors(
    FilesInterceptor('images', MAX_FILES, {
      storage: memoryStorage(),
      limits: { fileSize: MAX_FILE_SIZE, files: MAX_FILES },
    }),
  )
  async uploadImages(
    @Param('publicId', new ParseUUIDPipe({ version: '4' })) publicId: string,
    @Headers('authorization') authorization: string | undefined,
    @UploadedFiles(
      new ParseFilePipe({
        fileIsRequired: true,
        validators: [
          new MaxFileSizeValidator({ maxSize: MAX_FILE_SIZE }),
          new FileTypeValidator({
            fileType: /^image\/(jpeg|png|webp|gif|avif|heic|heif|svg\+xml)$/,
            fallbackToMimetype: true,
            errorMessage:
              'Файлът трябва да бъде JPG, PNG, WebP, GIF, AVIF, HEIC, HEIF или SVG изображение.',
          }),
        ],
      }),
    )
    files: Express.Multer.File[],
  ): Promise<{ images: UploadedEventImage[] }> {
    const token = authorization?.startsWith('Bearer ')
      ? authorization.slice(7).trim()
      : undefined;

    return {
      images: await this.uploadsService.uploadEventImages(
        publicId,
        token || undefined,
        files,
      ),
    };
  }
}
