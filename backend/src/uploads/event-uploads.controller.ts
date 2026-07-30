import {
  Controller,
  FileTypeValidator,
  Get,
  Headers,
  MaxFileSizeValidator,
  Param,
  ParseIntPipe,
  ParseFilePipe,
  ParseUUIDPipe,
  Post,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { UploadedEventImage, UploadsService } from './uploads.service';
import { GuestGalleryImage } from './domain/event-images.repository';

const MAX_FILES = 10;
const MAX_FILE_SIZE = 100 * 1024 * 1024;

@Controller('events/public/:publicId/images')
export class EventUploadsController {
  constructor(private readonly uploadsService: UploadsService) {}

  @Get()
  getGallery(
    @Param('publicId', new ParseUUIDPipe({ version: '4' })) publicId: string,
    @Headers('authorization') authorization: string | undefined,
  ): Promise<GuestGalleryImage[]> {
    const token = authorization?.startsWith('Bearer ')
      ? authorization.slice(7).trim()
      : undefined;
    return this.uploadsService.getGuestGallery(publicId, token || undefined);
  }

  @Post(':imageId/like')
  toggleLike(
    @Param('publicId', new ParseUUIDPipe({ version: '4' })) publicId: string,
    @Param('imageId', ParseIntPipe) imageId: number,
    @Headers('authorization') authorization: string | undefined,
  ): Promise<{ liked: boolean; likeCount: number }> {
    const token = authorization?.startsWith('Bearer ')
      ? authorization.slice(7).trim()
      : undefined;
    return this.uploadsService.toggleImageLike(
      publicId,
      imageId,
      token || undefined,
    );
  }

  @Get(':imageId/download')
  async downloadImage(
    @Param('publicId', new ParseUUIDPipe({ version: '4' })) publicId: string,
    @Param('imageId', ParseIntPipe) imageId: number,
    @Headers('authorization') authorization: string | undefined,
  ): Promise<{ url: string }> {
    const token = authorization?.startsWith('Bearer ')
      ? authorization.slice(7).trim()
      : undefined;
    return {
      url: await this.uploadsService.getGuestImageDownloadUrl(
        publicId,
        imageId,
        token || undefined,
      ),
    };
  }

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
            fileType:
              /^(image\/(jpeg|png|webp|gif|avif|heic|heif|svg\+xml)|video\/(mp4|quicktime|webm|x-m4v|mpeg))$/,
            fallbackToMimetype: true,
            errorMessage:
              'Файлът трябва да бъде изображение или MP4, MOV, WebM, M4V или MPEG видео.',
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
